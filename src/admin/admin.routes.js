import { Router } from "express";

// Mounted at /api/admin. The legacy staff login stays at /api/staff/auth
// because moving it would also require a cookie-path/authentication migration.
export function createAdminRouter({
  adminAuthModule,
  staffServicesModule,
  certificationsModule,
  itCertificationsModule,
  academicLeaveModule,
  organizationModule,
} = {}) {
  const router = Router();
  const routes = [
    ["/auth", adminAuthModule?.router],
    ["/requests", staffServicesModule?.adminRouter],
    ["/certifications", certificationsModule?.adminRouter],
    ["/it-certifications", itCertificationsModule?.adminRouter],
    ["/academic-leave", academicLeaveModule?.adminRouter],
    ["/organization", organizationModule?.router],
  ];

  for (const [path, moduleRouter] of routes) {
    if (moduleRouter) router.use(path, moduleRouter);
  }
  return router;
}
