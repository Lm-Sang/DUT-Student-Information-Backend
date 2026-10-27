import {AppError} from '../../../shared/errors/app-error.js';

export const functionPermissions=[
 ['requests.view','Xem hồ sơ','Hồ sơ'],['requests.receive','Tiếp nhận đơn','Hồ sơ'],['requests.print','In đơn','Hồ sơ'],
 ['requests.complete','Đánh dấu đã xử lý / phản hồi LMS','Hồ sơ'],['requests.cancel','Hủy đơn và phản hồi','Hồ sơ'],
 ['workbook.export','Xuất Excel','Excel'],['workbook.import','Nhập Excel và lưu xử lý','Excel'],
 ['requests.reassign','Bàn giao người phụ trách','Quản trị'],['rbac.roles.manage','Tạo và chỉnh sửa role','Quản trị'],['rbac.staff.manage','Tạo tài khoản và gán role','Quản trị'],
].map(([key,name,group])=>({key,name,group}));
export const legacyFunctions=functionPermissions.filter(p=>!['Quản trị'].includes(p.group)).map(p=>p.key);
export const defaultStaffPermissions=['requests.view','requests.receive','requests.print','requests.complete','requests.cancel','workbook.export','workbook.import'];
export const isDefaultStaffPermission=key=>defaultStaffPermissions.includes(key);
export const actionPermission=action=>({receive:'requests.receive',print:'requests.print',complete:'requests.complete',result:'requests.complete',cancel:'requests.cancel'}[action]);
export const hasPermission=(actor,key)=>actor?.role==='ADMIN'||actor?.role==='STAFF'&&(isDefaultStaffPermission(key)||actor.permissions?.includes(key)===true);
export function requirePermission(actor,key){if(!hasPermission(actor,key))throw new AppError('Bạn chưa được cấp quyền thực hiện chức năng này.',403);}
export function requireManagement(actor){if(!['rbac.roles.manage','rbac.staff.manage','requests.reassign'].some(p=>hasPermission(actor,p)))throw new AppError('Bạn chưa có quyền quản trị tài khoản hoặc role.',403);}
function object(input,allowed){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!allowed.includes(k)))throw new AppError('Dữ liệu có trường không hợp lệ.',400);}
function text(value,min,max,label){if(typeof value!=='string'||value.trim().length<min||value.trim().length>max||/[\u0000-\u001f]/.test(value))throw new AppError(`${label} không hợp lệ.`,400);return value.trim();}
function keys(value,available,max=200){if(!Array.isArray(value)||value.length>max||new Set(value).size!==value.length||value.some(k=>typeof k!=='string'||!available.includes(k)))throw new AppError('Có quyền hoặc role không hợp lệ.',400);return [...value].sort();}
export function parseRole(input,available,editing=false){object(input,['name','description','permissions','active',...(editing?['version']:[])]);const result={name:text(input.name,1,150,'Tên role'),description:input.description?text(input.description,1,1000,'Mô tả'):'',permissions:keys(input.permissions,available),active:input.active??true};if(typeof result.active!=='boolean')throw new AppError('Trạng thái role không hợp lệ.',400);if(editing){if(!Number.isInteger(input.version)||input.version<1)throw new AppError('Thiếu phiên bản role.',400);result.version=input.version;}return result;}
export function parseAssignments(input,available){object(input,['roleIds','version']);if(!Number.isInteger(input.version)||input.version<1)throw new AppError('Thiếu phiên bản tài khoản.',400);return{roleIds:keys(input.roleIds,available,30),version:input.version};}
export function parseAccount(input,available){object(input,['username','password','name','department','roleIds']);const username=text(input.username,3,64,'Tên đăng nhập').toLowerCase();if(!/^[a-z0-9][a-z0-9._-]*$/.test(username))throw new AppError('Tên đăng nhập chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.',400);if(typeof input.password!=='string'||input.password.length<12||input.password.length>128||input.password.includes('\0'))throw new AppError('Mật khẩu cần từ 12 đến 128 ký tự.',400);if(!['CTSV','DT','IT'].includes(input.department))throw new AppError('Chọn đơn vị của chuyên viên.',400);return{username,password:input.password,name:text(input.name,1,150,'Họ tên'),department:input.department,roleIds:keys(input.roleIds,available,30)};}
