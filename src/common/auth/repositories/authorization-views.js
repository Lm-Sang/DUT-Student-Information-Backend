// Workflow SQL guards retain their view contract; authority comes only from auth.
export const workflowPermissionsViewSql = `CREATE OR ALTER VIEW svc_demo.vQuyenHieuLuc AS
 SELECT a.MaHS,CONVERT(varchar(100),tp.PermissionName) AS MaQuyen FROM auth.AccountProfiles p
 JOIN auth.LocalAccounts la ON la.Id=p.AccountId AND la.IsActive=1
 JOIN svc_demo.TaiKhoan a ON a.MaHS=p.StaffAccountId AND a.HieuLuc=1 AND a.NguonDanhTinh='LOCAL' AND a.VaiTro='STAFF'
 JOIN auth.Fields f ON f.FieldCode=p.FieldCode AND f.IsActive=1
 JOIN auth.AccountTasks assigned ON assigned.AccountId=p.AccountId AND assigned.FieldCode=p.FieldCode
 JOIN auth.Tasks t ON t.TaskId=assigned.TaskId AND t.FieldCode=p.FieldCode AND t.IsActive=1
 JOIN auth.TaskPermissions tp ON tp.TaskId=t.TaskId
 WHERE p.AccessLevel='specialist'`;
