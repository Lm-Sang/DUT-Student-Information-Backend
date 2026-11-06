import { Router } from "express";

export function createItCertificationsRouter(controller, context) {
  const router = Router(),
    student = Router(),
    reviewer = Router();
  student.get("/form", controller.form);
  student.get("/records", controller.records);
  student.post("/applications", controller.prepare);
  student.post("/applications/:applicationId/complete", controller.complete);
  student.get("/applications", controller.list);
  student.get("/applications/:applicationId", controller.get);
  student.get(
    "/applications/:applicationId/files/:fileId/download",
    controller.download,
  );
  reviewer.get("/applications", controller.queue);
  reviewer.get("/records", controller.records);
  reviewer.get("/applications/:applicationId", controller.get);
  reviewer.get(
    "/applications/:applicationId/files/:fileId/download",
    controller.download,
  );
  reviewer.post("/applications/:applicationId/review", controller.review);
  router.use("/reviewer", context("reviewer"), reviewer);
  router.use(context("student"), student);
  return router;
}
