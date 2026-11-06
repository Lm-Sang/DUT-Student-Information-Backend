# Default specialist operations

Active specialist accounts have the seven standard request and Excel operations by default. These operations are no longer edited on a role. Work scopes and management privileges remain explicit grants from active assigned roles. Work ownership, request state, terminal status and Excel validation still apply.

The domain permission check and local SQL view `svc_demo.vQuyenHieuLuc` use the same default operation list. `svc_demo.vQuyenXuLy` continues to derive work scopes only from `work:*` permissions. A specialist without a work scope cannot process or export another work type simply because an operation is available by default.

The role editor shows work scopes and management privileges. Its checkbox is labeled “Role có hiệu lực”. Turning it off and saving suspends that role's scope/management contributions, while retaining its assignment and history. It does not deactivate the account, and other active roles can still grant permissions.

Existing roles, assignments and historical versions are retained. Old operation grants remain readable for compatibility; future role saves omit these default keys. Previous versions are preserved by the existing revision/audit mechanism.

For an existing local installation run `node scripts/upgrade-request-default-permissions.js`. It backs up the old view definition and changes only the local effective-permission view. Fresh RBAC setup uses the same definition. No school or SSH database is modified.

Validation: 120 backend checks, 22 frontend checks, 59 isolated RBAC HTTP checks and 43 workflow HTTP checks passed. Covered cases include a scope-only role, a specialist with no roles, disabling/restoring a role during an active session, wrong work type, another owner, missing management rights, role history and existing-role preservation. Integration fixtures are cleaned up after each run.
