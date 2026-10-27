import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mapSchoolProfile} from '../domain/student-profile.js';
import {createStudentProfileService} from '../services/student-profile.service.js';
import {createSchoolStudentService} from '../services/school-student.service.js';
import {createPaperFilesService} from '../services/paper-files.service.js';
import {createConfirmationFilesService} from '../services/confirmation-files.service.js';
import {renderPaperPdf,paperTemplates} from '../services/paper-pdf.renderer.js';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {legacyFunctions} from '../domain/rbac.js';

const base={MaHS:'qa-profile',SoTheSV:'000000001',Hoten:'QA registry',MaLop:'12345',AdmissionClassName:'QA old class',SoCMND:'OLD-ID',Mobile:'OLD-PHONE',Ngaysinh:new Date('2000-01-01T00:00:00Z'),NoiSinh:'QA old place',Gioitinh:1,DanToc:'01',AdmissionEthnicityName:'Kinh',AdmissionProgramName:'QA program'};
const current={CurrentMaHS:'qa-profile',CurrentStudentNumber:'000000001',CurrentName:'QA current student',CurrentClass:'QA24A',CurrentCccd:'000123456789',CurrentIdentity:'OLD-CMND',CurrentPhone:'0912345678',BirthDay:'29',BirthMonth:'02',BirthYear:'2004',CurrentBirthPlace:'QA current place',CurrentGender:2,CurrentEthnicityCode:'01',CurrentEthnicityName:'Kinh'};
test('forms prefer current personal fields and preserve leading zeros in CCCD and phone',()=>{
 const p=mapSchoolProfile(base,current);assert.equal(p.ClassName,current.CurrentClass);assert.equal(p.IdentityNumber,current.CurrentCccd);assert.equal(p.Phone,current.CurrentPhone);assert.equal(p.Hoten,current.CurrentName);assert.equal(p.DateOfBirth.toISOString(),'2004-02-29T00:00:00.000Z');assert.equal(p.BirthPlace,current.CurrentBirthPlace);assert.equal(p.Gender,'Nữ');assert.equal(p.Ethnicity,'Kinh');assert.equal(p.ProgramName,'QA program');assert.equal(p.Source,'DATA_SV1.NhanThan + DATA_GVien1');
});
test('class and ethnicity codes are resolved to labels and unresolved codes are never printed as names',()=>{
 assert.equal(mapSchoolProfile(base,{...current,CurrentClass:'12345',CurrentClassNameFromCode:'QA24B'}).ClassName,'QA24B');
 const unresolved=mapSchoolProfile(base,{...current,CurrentClass:'98765',CurrentEthnicityCode:'99',CurrentEthnicityName:null});assert.equal(unresolved.ClassName,'');assert.equal(unresolved.Ethnicity,'');
 const fallback=mapSchoolProfile(base);assert.equal(fallback.ClassName,'QA old class');assert.notEqual(fallback.ClassName,base.MaLop);assert.equal(fallback.Ethnicity,'Kinh');
 assert.equal(mapSchoolProfile({...base,AdmissionClassName:null,AdmissionEthnicityName:null}).ClassName,'');assert.equal(mapSchoolProfile({...base,AdmissionEthnicityName:null}).Ethnicity,'');
});
test('missing current values fall back only within the same verified profile; invalid dates do not roll over',()=>{
 const p=mapSchoolProfile(base,{...current,CurrentCccd:' ',CurrentPhone:'',CurrentClass:'',BirthDay:'31',BirthMonth:'02'});assert.equal(p.IdentityNumber,'OLD-CMND');assert.equal(p.Phone,base.Mobile);assert.equal(p.ClassName,base.AdmissionClassName);assert.equal(p.DateOfBirth.toISOString(),base.Ngaysinh.toISOString());
 for(const patch of [{CurrentMaHS:'other'},{CurrentStudentNumber:'000000002'}])assert.throws(()=>mapSchoolProfile(base,{...current,...patch}),e=>e.details?.code==='STUDENT_PROFILE_MISMATCH');
});
test('birth place is a resolved location label, with explicit handling for foreign birth',()=>{
 assert.equal(mapSchoolProfile(base,{...current,CurrentBirthPlace:'48',CurrentBirthPlaceName:'QA province'}).BirthPlace,'QA province');
 assert.equal(mapSchoolProfile(base,{...current,CurrentBirthPlace:'48',CurrentBirthPlaceName:null}).BirthPlace,'');
 assert.equal(mapSchoolProfile(base,{...current,CurrentBirthPlace:'48',ForeignBirth:1,ForeignBirthPlace:'QA foreign place'}).BirthPlace,'QA foreign place');
});
test('live profile loader refreshes SSO records before reading the local typed profile and leaves demo profiles intact',async()=>{
 const calls=[],repo={actor:async id=>({IdentitySource:id==='sso'?'SSO':'DEMO'}),profile:async id=>{calls.push('profile:'+id);return{name:'QA'};}},school={refresh:async id=>calls.push('refresh:'+id)};
 const loader=createStudentProfileService(repo,school);await loader.get('sso');await loader.get('demo');assert.deepEqual(calls,['refresh:sso','profile:sso','profile:demo']);
 school.refresh=async()=>{throw Error('unavailable');};await assert.rejects(()=>loader.get('sso'));assert.equal(calls.filter(x=>x==='profile:sso').length,1);
});
test('refresh keeps the original school ID and actor link and never switches to another student',async()=>{
 let synced=0;const repo={actor:async()=>({Role:'STUDENT',IdentitySource:'SSO',SchoolId:'qa-profile',StudentNumber:'000000001'}),syncSchoolStudent:async()=>{synced++;return'sso:qa-profile';}};
 const service=createSchoolStudentService(repo,{readProfile:async()=>[{...base,MaHS:'other'}]});await assert.rejects(()=>service.refresh('sso:qa-profile'),e=>e.statusCode===409);assert.equal(synced,0);
});
test('student paper download uses the fresh profile without recording a specialist print',async()=>{
 const actor={id:'sso:qa-profile',role:'STUDENT'},row={Id:'qa-doc',TypeCode:'DonSV01',Status:'RECEIVED',StudentId:actor.id,StudentNumber:'000000001',Payload:{reasonCode:'LOST_OR_DAMAGED'},AssignedStaffId:'qa',Version:1,CreatedAt:'2026-10-26T00:00:00Z'};
 let loads=0;const repo={get:async()=>row,catalogs:async()=>({programs:[],terms:[]}),recordPrint:async()=>assert.fail('student download must not record specialist printing'),profile:async()=>assert.fail('stale profile must not be used')};
 const loadProfile=async id=>{assert.equal(id,row.StudentId);loads++;return{name:current.CurrentName,studentNumber:'000000001',className:'QA24A',identityNumber:current.CurrentCccd,phone:current.CurrentPhone};};
 const paper=createPaperFilesService(repo,{loadProfile,renderer:async({snapshot})=>{assert.equal(snapshot.profile.phone,current.CurrentPhone);return{bytes:Buffer.from('%PDF-QA')};}});
 await paper.download(actor,row.Id);assert.equal(loads,1);
});

test('actual PDF contains the selected personal values, not admission codes or old contacts',async()=>{
 const p=mapSchoolProfile(base,current),profile={name:p.Hoten,studentNumber:p.SoTheSV,className:p.ClassName,identityNumber:p.IdentityNumber,phone:p.Phone,dateOfBirth:'29/02/2004',birthPlace:p.BirthPlace,gender:p.Gender,ethnicity:p.Ethnicity};
 const result=await renderPaperPdf({template:paperTemplates.find(t=>t.code==='DonSV01'),snapshot:{createdAt:'2026-10-26T00:00:00Z',profile,payload:{reasonCode:'LOST_OR_DAMAGED'},values:{}}});
 const task=getDocument({data:new Uint8Array(result.bytes),useSystemFonts:true});try{const doc=await task.promise;let text='';for(let i=1;i<=doc.numPages;i++)text+=(await(await doc.getPage(i)).getTextContent()).items.map(x=>x.str).join(' ');for(const expected of [profile.name,profile.className,profile.identityNumber,profile.phone])assert(text.includes(expected));for(const old of ['QA old class','OLD-ID','OLD-PHONE'])assert(!text.includes(old));}finally{await task.destroy();}
});
