import assert from "node:assert/strict";
import { test } from "node:test";
import { Router } from "express";
import { isolatedApp, listen } from "../support/frontend-areas.js";

function probeRouter(label) {
  const router = Router();
  router.get("/probe", (req, res) => res.json({ label, baseUrl: req.baseUrl }));
  return router;
}

test("frontend route registries mount each area and retain legacy URLs", async (t) => {
  const module = {
    basePath: "/api/certifications",
    router: probeRouter("legacy"),
    studentRouter: probeRouter("student"),
    adminRouter: probeRouter("admin"),
  };
  const base = await listen(t, isolatedApp({ certificationsModule: module }));
  for (const [prefix, label] of [
    ["/api/student/certifications", "student"],
    ["/api/admin/certifications", "admin"],
    ["/api/certifications", "legacy"],
  ]) {
    const response = await fetch(base + prefix + "/probe");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { label, baseUrl: prefix });
  }
  const disabledBase = await listen(t, isolatedApp({ certificationsModule: null }));
  for (const prefix of ["/api/student/certifications", "/api/admin/certifications", "/api/certifications"]) {
    assert.equal((await fetch(disabledBase + prefix + "/probe")).status, 404);
  }
});

test("auth is mounted once per area and staff auth keeps its cookie-compatible prefix", async (t) => {
  const visits = { student: 0, admin: 0 };
  function authModule(area) {
    const router = Router();
    router.use((_req, _res, next) => { visits[area]++; next(); });
    router.get("/me", (_req, res) => res.json({ area }));
    return { basePath: `/api/${area}/auth`, router };
  }
  const base = await listen(t, isolatedApp({
    studentAuthModule: authModule("student"),
    adminAuthModule: authModule("admin"),
    staffAuthModule: { basePath: "/api/staff/auth", router: probeRouter("staff") },
  }));
  for (const area of ["student", "admin"]) {
    const response = await fetch(`${base}/api/${area}/auth/me`);
    assert.deepEqual(await response.json(), { area });
    visits[area] = 0;
    assert.equal((await fetch(`${base}/api/${area}/auth/missing`)).status, 404);
    assert.equal(visits[area], 1, "fallthrough must not execute auth a second time");
  }
  const staff = await fetch(base + "/api/staff/auth/probe");
  assert.deepEqual(await staff.json(), { label: "staff", baseUrl: "/api/staff/auth" });
  const disabledBase = await listen(t, isolatedApp({}));
  assert.equal((await fetch(disabledBase + "/api/admin/auth/me")).status, 404);
});
