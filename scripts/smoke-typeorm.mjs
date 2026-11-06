// End-to-end persistence regression using disposable local records only.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {getLocalDataSource,queryLocalDatabase as query,disconnectLocalDatabase,entitySchema,localEntities,schoolEntities} from '../src/database.js';
import {localDatabaseGuardSql,assertLocalDemoTarget} from '../src/infrastructure/database/local-write-guard.js';
import {createRequestsRepository} from '../src/common/student-requests/repositories/requests.repository.js';
import {createRequestsService} from '../src/common/student-requests/services/requests.service.js';


import {createCertificationsRepository} from '../src/common/certifications/repositories/certifications.repository.js';
import {createItCertificationsRepository} from '../src/common/certifications/repositories/it-certifications.repository.js';
import {createAcademicLeaveRepository} from '../src/common/academic-leave/repositories/academic-leave.repository.js';

assertLocalDemoTarget();
const studentId='sv:'+randomUUID(),staffId='cv:'+randomUUID(),accountId=randomUUID();
const studentCode=String(Math.floor(Math.random()*900_000_000)+100_000_000);
const write=(sql,params=[])=>query(localDatabaseGuardSql+sql,params);
try{
 const source=await getLocalDataSource();assert.equal(source.entityMetadatas.length,localEntities.length);
 assert.equal(source.options.synchronize,false);assert.equal(source.options.migrationsRun,false);

 await source.transaction(async manager=>{
  await manager.getRepository(entitySchema('svc_demo.TaiKhoan')).insert([
   {MaHS:studentId,Hoten:'ORM fixture student',VaiTro:'STUDENT',SoThe:studentCode,NguonDanhTinh:'DEMO',HieuLuc:true},
   {MaHS:staffId,Hoten:'ORM fixture staff',VaiTro:'STAFF',MaDV:'115',NguonDanhTinh:'LOCAL',HieuLuc:true},
  ]);
  await manager.getRepository(entitySchema('svc_demo.NhanThan')).insert({MaHS:studentId,Hoten:'ORM fixture student',SoThe:studentCode,Lop:'ORMTEST',NgaySinh:new Date('2004-01-01Z'),SoCCCD:'000000000001',DienThoai:'0000000000',DuLieuThuNghiem:true});
  await manager.getRepository(entitySchema('auth.LocalAccounts')).insert({Id:accountId,Username:'orm-fixture-'+accountId,DisplayName:'ORM fixture staff',PasswordHash:'fixture-only-no-login',Channel:'admin',IsActive:true});
  await manager.getRepository(entitySchema('auth.AccountProfiles')).insert({AccountId:accountId,StaffAccountId:staffId,AccessLevel:'specialist',FieldCode:'DT',Revision:1});
  await manager.getRepository(entitySchema('auth.AccountTasks')).insert({AccountId:accountId,TaskId:4,FieldCode:'DT'});
 });
 const repository=createRequestsRepository(),service=createRequestsService(repository);
 const student=await service.sessionActor(studentId),staff=await service.sessionActor(staffId),catalog=await service.catalogs();
 assert.equal(student.studentNumber,studentCode);assert(staff.permissions.includes('requests.receive'));assert.equal(catalog.documents.length,11);
 const created=[];let pdfCount=0;
 const make=async(typeCode,payload)=>{const row=await service.create(student,{typeCode,payload,idempotencyKey:'orm:'+randomUUID()});created.push(row.id);return row;};
 const command=(actor,row,action,extra={})=>service.command(actor,row.id,{action,version:row.version,idempotencyKey:'orm:'+randomUUID(),...extra});
 const cases=[
  ['DonSV01',{reasonCode:'CHANGE_INFO',changeDescription:'Thông tin kiểm thử TypeORM'}],
  ['DonSV03',{expectedTerm:catalog.currentTerm}],
  ['DonSV04',{targetTerm:catalog.currentTerm,reason:'Kiểm thử TypeORM'}],
  ['DonSV05',{reviewTerm:catalog.currentTerm,reason:'Kiểm thử TypeORM'}],
  ['DonSV07',{programCode:catalog.programs[0].code,startTerm:catalog.currentTerm}],
 ];
 for(const [type,payload]of cases){
  let row=await make(type,payload);
  const pdf=await service.download(student,row.id);assert(pdf.bytes.subarray(0,4).equals(Buffer.from('%PDF')));
  pdfCount++;
  row=await command(staff,row,'receive');row=await command(staff,row,'complete');assert.equal(row.status,'COMPLETED');
  assert((await service.detail(student,row.id)).events.length>=3);
 }
 let cancelled=await make('DonSV01',{reasonCode:'LOST_OR_DAMAGED'});cancelled=await command(student,cancelled,'cancel');
 assert.equal(cancelled.cancelledByRole,'STUDENT');assert.equal(cancelled.status,'CANCELLED');
 let staffCancelled=await make('DonSV01',{reasonCode:'LOST_OR_DAMAGED'});staffCancelled=await command(staff,staffCancelled,'receive');
 staffCancelled=await command(staff,staffCancelled,'cancel',{message:'Hồ sơ kiểm thử không hợp lệ.'});assert.equal(staffCancelled.cancelledByRole,'STAFF');
 let lms=await make('LMS_SUPPORT',{});lms=await command(staff,lms,'receive');lms=await command(staff,lms,'result',{message:'Fixture-LMS-password'});assert.equal(lms.status,'COMPLETED');
 for(const doc of catalog.documents){
  let confirmation=await make('CONFIRMATION',{documentCode:doc.code,additionalInfo:'Kiểm thử TypeORM',quantity:1,feeMode:doc.freeAllowed?'FREE':'PAID',serviceSpeed:'NORMAL'});
  confirmation=await command(staff,confirmation,'receive');
  const file=await service.printConfirmation(staff,confirmation.id,{version:confirmation.version,idempotencyKey:'orm:'+randomUUID()});assert(file.bytes.subarray(0,4).equals(Buffer.from('%PDF')));
  confirmation=await service.detail(staff,confirmation.id);confirmation=await command(staff,confirmation,'result');assert.equal(confirmation.status,'COMPLETED');assert(confirmation.pickupAt);
 }
 let withdrawal=await make('DonSV06',{reasonCode:'LH001',reasonDetail:'Kiểm thử TypeORM'});
 const withdrawalPdf=await service.download(student,withdrawal.id);assert(withdrawalPdf.bytes.subarray(0,4).equals(Buffer.from('%PDF')));pdfCount++;
 withdrawal=await command(staff,withdrawal,'receive');withdrawal=await command(staff,withdrawal,'complete');assert.equal(withdrawal.status,'COMPLETED');
 assert.equal((await service.list(student)).length,created.length);
 const certification=await createCertificationsRepository().catalog();assert(Array.isArray(certification.languages));
 assert(Array.isArray(await createItCertificationsRepository().catalog()));
 const leave=createAcademicLeaveRepository(),leaveActor={role:'student',source:'auth',reference:'orm:'+studentId,studentCode,name:'ORM fixture student'};
 const draft=await leave.save(leaveActor,{kind:'leave',reasonCode:'medical',startSemesterCode:catalog.currentTerm,semesterCount:1,content:'ORM transaction test'});
 assert(draft.id);assert.equal((await leave.get(leaveActor,draft.id)).studentCode,studentCode);
 await leave.cancel(leaveActor,draft.id,draft.rowVersion);
 console.log(JSON.stringify({localMappings:localEntities.length,schoolMappings:schoolEntities.length,petitionPdfs:pdfCount,confirmationTypes:catalog.documents.length,requests:created.length,workflow:true,canonicalAuthTask4:true,certifications:true,academicLeave:true}));
}finally{
 await write(`SET XACT_ABORT ON;BEGIN TRANSACTION;
  DELETE academic_leave.ApplicationHistory WHERE ApplicationId IN(SELECT Id FROM academic_leave.Applications WHERE ActorReference=?);
  DELETE academic_leave.Applications WHERE ActorReference=?;
  DELETE svc_demo.LichSuTruongDuLieu WHERE IDLichSu IN(SELECT e.ID FROM svc_demo.LichSuXuLyDon e JOIN svc_demo.DonDeNghi d ON d.ID=e.IDDon WHERE d.MaHS=?);
  DELETE svc_demo.TruongCanBoSung WHERE IDDon IN(SELECT ID FROM svc_demo.DonDeNghi WHERE MaHS=?);
  DELETE svc_demo.LichSuNoiDungDon WHERE IDDon IN(SELECT ID FROM svc_demo.DonDeNghi WHERE MaHS=?);
  DELETE svc_demo.ChongGuiTrung WHERE MaHS IN(?,?);
  DELETE svc_demo.His_InDon WHERE ID IN(SELECT ID FROM svc_demo.DonDeNghi WHERE MaHS=?);
  DELETE svc_demo.DeNghiVanBan WHERE ID IN(SELECT ID FROM svc_demo.DonDeNghi WHERE MaHS=?);
  DELETE svc_demo.DeNghiEmail WHERE ID IN(SELECT ID FROM svc_demo.DonDeNghi WHERE MaHS=?);
  DELETE svc_demo.LichSuXuLyDon WHERE IDDon IN(SELECT ID FROM svc_demo.DonDeNghi WHERE MaHS=?);
  DELETE svc_demo.DonDeNghi WHERE MaHS=?;
  DELETE svc_demo.LichSuRBAC WHERE MaNguoiThucHien=?;
  DELETE svc_demo.TaiKhoanVaiTro WHERE MaHS=?;
  DELETE auth.AccountTasks WHERE AccountId='${accountId}';DELETE auth.AccountProfiles WHERE AccountId='${accountId}';DELETE auth.LocalAccounts WHERE Id='${accountId}';
  DELETE svc_demo.NhanThan WHERE MaHS=?;DELETE svc_demo.TaiKhoan WHERE MaHS IN(?,?);COMMIT;`,
  ['orm:'+studentId,'orm:'+studentId,studentId,studentId,studentId,studentId,staffId,studentId,studentId,studentId,studentId,studentId,staffId,staffId,studentId,studentId,staffId]);
 await disconnectLocalDatabase();
}
