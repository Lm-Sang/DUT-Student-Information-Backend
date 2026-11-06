import { Router } from "express";

// Mounted at /api/student. Detailed endpoints and guards belong to each module.
export function createStudentRouter({
  studentAuthModule,
  studentServicesModule,
  certificationsModule,
  itCertificationsModule,
  academicLeaveModule,
} = {}) {
  const router = Router();
  const routes = [
    ["/auth", studentAuthModule?.router],
    ["/requests", studentServicesModule?.studentRouter],
    ["/certifications", certificationsModule?.studentRouter],
    ["/it-certifications", itCertificationsModule?.studentRouter],
    ["/academic-leave", academicLeaveModule?.studentRouter],
  ];

  for (const [path, moduleRouter] of routes) {
    if (moduleRouter) router.use(path, moduleRouter);
  }
  return router;
}
