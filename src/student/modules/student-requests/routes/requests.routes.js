import { Router } from "express";
import { createRequestContextMiddleware } from "../../../../common/student-requests/middlewares/request-context.middleware.js";

export function createStudentRequestsRouter(
  controller,
  resolveActor,
  { collectionPath = "/" } = {},
) {
  const router = Router();
  const item = collectionPath === "/" ? "" : collectionPath;
  router.use(createRequestContextMiddleware(resolveActor));
  router.get("/me", controller.me);
  router.get("/profile", controller.profile);
  router.get("/catalogs", controller.catalogs);
  router.get(collectionPath, controller.list);
  router.post(collectionPath, controller.create);
  router.get(item + "/:id", controller.detail);
  router.get(item + "/:id/file", controller.download);
  router.post(item + "/:id/print", controller.printConfirmation);
  router.post(item + "/:id/actions", controller.command);
  return router;
}
