import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import { queryLocalDatabase, disconnectLocalDatabase } from '../../../infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget, localDatabaseGuardSql } from '../../../infrastructure/database/local-write-guard.js';
import { hashPassword } from '../services/password.service.js';

try {
 const { values }=parseArgs({options:{username:{type:'string'},name:{type:'string'},department:{type:'string'},'bootstrap-admin':{type:'boolean',default:false},'env-password':{type:'boolean',default:false}}});
 const password=values['env-password']?process.env.DUT_STAFF_BOOTSTRAP_PASSWORD:undefined;
 if(!values['env-password']||!password)throw new Error('Set DUT_STAFF_BOOTSTRAP_PASSWORD in the process environment and pass --env-password. Passwords are never accepted as CLI arguments or printed.');
 if(!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(values.username||'')||!values.name?.trim()||values.name.length>150||!['115','120','IT'].includes(values.department))throw new Error('Provide --username (3-64 lower-case characters), --name and --department 115|120|IT.');
 assertLocalDemoTarget();
 const id='cv:'+randomUUID();const hash=await hashPassword(password);const role='bootstrap-management';
 const params=[id,values.name.trim(),values.department,id,values.username,hash];
 let sql=`INSERT svc_demo.TaiKhoan(MaHS,Hoten,VaiTro,MaDV,NguonDanhTinh,HieuLuc) VALUES(?,?,'STAFF',?,'LOCAL',1);
 INSERT svc_demo.DangNhapChuyenVien(MaHS,TenDangNhap,MatKhauBam) VALUES(?,?,?);`;
 if(values['bootstrap-admin']) {
  sql+=`IF EXISTS(SELECT 1 FROM svc_demo.DangNhapChuyenVien c JOIN svc_demo.vQuyenHieuLuc p ON p.MaHS=c.MaHS WHERE p.MaQuyen IN('rbac.roles.manage','rbac.staff.manage')) THROW 51152,'An operator already has management credentials; use the RBAC API',1;
   IF NOT EXISTS(SELECT 1 FROM svc_demo.QuyenRBAC WHERE MaQuyen='rbac.permissions.delegate')
    INSERT svc_demo.QuyenRBAC(MaQuyen,TenQuyen,Nhom) VALUES('rbac.permissions.delegate',N'Cấp quyền khác phạm vi xử lý của mình',N'Quản trị');
   IF NOT EXISTS(SELECT 1 FROM svc_demo.VaiTroRBAC WITH(UPDLOCK,HOLDLOCK) WHERE MaRole='bootstrap-management')
    INSERT svc_demo.VaiTroRBAC(MaRole,TenRole,MoTa,NguoiTao) VALUES('bootstrap-management',N'Quản trị phân quyền ban đầu',N'Cấp role và tài khoản; phạm vi xử lý hồ sơ phải cấp riêng.',?);
   INSERT svc_demo.VaiTroQuyen(MaRole,MaQuyen) SELECT 'bootstrap-management',MaQuyen FROM svc_demo.QuyenRBAC q WHERE MaQuyen IN('rbac.roles.manage','rbac.staff.manage','requests.reassign','rbac.permissions.delegate') AND NOT EXISTS(SELECT 1 FROM svc_demo.VaiTroQuyen p WHERE p.MaRole='bootstrap-management' AND p.MaQuyen=q.MaQuyen);
   INSERT svc_demo.TaiKhoanVaiTro(MaHS,MaRole,NguoiGan) VALUES(?,'bootstrap-management',?);`;
  params.push(id,id,id);
 }
 await queryLocalDatabase(`SET XACT_ABORT ON;${localDatabaseGuardSql}BEGIN TRY BEGIN TRANSACTION;${sql}COMMIT TRANSACTION;END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;THROW;END CATCH;`,params);
 console.log(JSON.stringify({id,username:values.username,channel:'staff',managementRole:values['bootstrap-admin']?role:null}));
} catch(error){console.error(error instanceof Error?error.message:'Staff provisioning failed');process.exitCode=1;}
finally{await disconnectLocalDatabase();}
