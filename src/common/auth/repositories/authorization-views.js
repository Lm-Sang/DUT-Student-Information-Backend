// All grants are owned by auth. Task IDs are compatibility group labels only.
export const assignedPermissionsViewSql=`CREATE OR ALTER VIEW auth.vAssignedPermissions AS
 SELECT p.AccountId,d.PermissionName,d.TaskId,d.ModuleCode FROM auth.AccountProfiles p
 JOIN auth.LocalAccounts a ON a.Id=p.AccountId AND a.IsActive=1
 JOIN auth.Fields f ON f.FieldCode=p.FieldCode AND f.IsActive=1
 JOIN auth.AccountPermissions ap ON ap.AccountId=p.AccountId
 JOIN auth.PermissionDefinitions d ON d.PermissionName=ap.PermissionName AND d.FieldCode=p.FieldCode AND d.IsActive=1
 WHERE p.AccessLevel='specialist'
 UNION
 SELECT p.AccountId,d.PermissionName,d.TaskId,d.ModuleCode FROM auth.AccountProfiles p
 JOIN auth.LocalAccounts a ON a.Id=p.AccountId AND a.IsActive=1
 JOIN auth.Fields f ON f.FieldCode=p.FieldCode AND f.IsActive=1
 JOIN auth.AccountRoles ar ON ar.AccountId=p.AccountId
 JOIN auth.RoleDefinitions r ON r.RoleName=ar.RoleName AND r.FieldCode=p.FieldCode AND r.IsActive=1
 JOIN auth.RolePermissions rp ON rp.RoleName=r.RoleName
 JOIN auth.PermissionDefinitions d ON d.PermissionName=rp.PermissionName AND d.FieldCode=p.FieldCode AND d.IsActive=1
 WHERE p.AccessLevel='specialist'`;
export const effectiveAuthPermissionsViewSql=`CREATE OR ALTER VIEW auth.vEffectivePermissions AS
 SELECT AccountId,PermissionName FROM auth.vAssignedPermissions
 UNION SELECT a.AccountId,v.permission FROM auth.vAssignedPermissions a
 CROSS JOIN(VALUES(N'requests.view'),(N'requests.receive'),(N'requests.print'),(N'requests.complete'),(N'requests.cancel'))v(permission)
 WHERE a.ModuleCode='student-requests' AND a.PermissionName LIKE N'work:%'
 UNION SELECT AccountId,N'certifications:review' FROM auth.vAssignedPermissions
 WHERE ModuleCode IN('certifications','it-certifications') AND PermissionName LIKE N'work:%'
 UNION SELECT AccountId,N'academic-leave:review' FROM auth.vAssignedPermissions
 WHERE ModuleCode='academic-leave' AND PermissionName LIKE N'work:%'`;
export const workflowPermissionsViewSql=`CREATE OR ALTER VIEW svc_demo.vQuyenHieuLuc AS
 SELECT t.MaHS,CONVERT(varchar(100),e.PermissionName) MaQuyen FROM auth.vEffectivePermissions e
 JOIN auth.AccountProfiles p ON p.AccountId=e.AccountId
 JOIN svc_demo.TaiKhoan t ON t.MaHS=p.StaffAccountId AND t.HieuLuc=1 AND t.NguonDanhTinh='LOCAL' AND t.VaiTro='STAFF'`;
