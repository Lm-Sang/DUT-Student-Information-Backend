import {defaultStaffPermissions} from '../domain/rbac.js';

// Basic operations belong to every active specialist account. Work scopes and
// management rights still come only from active assigned roles, with all other
// ownership, state and work-scope guards retained in their respective services.
export const effectivePermissionsViewSql=`CREATE OR ALTER VIEW svc_demo.vQuyenHieuLuc AS
 SELECT u.MaHS,p.MaQuyen FROM svc_demo.TaiKhoanVaiTro u
 JOIN svc_demo.VaiTroRBAC r ON r.MaRole=u.MaRole AND r.HieuLuc=1
 JOIN svc_demo.VaiTroQuyen p ON p.MaRole=r.MaRole
 JOIN svc_demo.TaiKhoan a ON a.MaHS=u.MaHS AND a.HieuLuc=1
 UNION
 SELECT a.MaHS,p.MaQuyen FROM svc_demo.TaiKhoan a
 CROSS JOIN(VALUES ${defaultStaffPermissions.map(key=>`('${key}')`).join(',')}) p(MaQuyen)
 WHERE a.VaiTro='STAFF' AND a.HieuLuc=1`;
