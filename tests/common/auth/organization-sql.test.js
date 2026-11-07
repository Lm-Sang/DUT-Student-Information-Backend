import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { queryLocalDatabase, transactionLocalDatabase, disconnectLocalDatabase } from '../../../src/infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget, localDatabaseGuardSql } from '../../../src/infrastructure/database/local-write-guard.js';
import { createAuthRepository } from '../../../src/common/auth/repositories/auth.repository.js';
import { createOrganizationRepository } from '../../../src/common/auth/repositories/organization.repository.js';
import { createAuthService } from '../../../src/common/auth/services/auth.service.js';
import { createAuthStore } from '../../../src/common/auth/stores/auth.store.js';
import { hashPassword } from '../../../src/common/auth/services/password.service.js';
import { createOrganizationService } from '../../../src/admin/modules/organization/services/organization.service.js';
import { createProgressRepository } from '../../../src/admin/modules/organization/repositories/progress.repository.js';

test('local organization FKs and effective workflow grants enforce scope; all fixtures roll back', {
  skip: process.env.AUTH_ORGANIZATION_DB_TEST !== '1',
}, async () => {
  assertLocalDemoTarget();
  const ids = [randomUUID(), randomUUID(), randomUUID()], staff = ids.map(id => 'cv:' + id);
  const usernames = ids.map(id => 'org-test-' + id);
  try {
    const result = await queryLocalDatabase(`${localDatabaseGuardSql}SET XACT_ABORT ON;
      BEGIN TRY BEGIN TRANSACTION;
      DECLARE @specialist uniqueidentifier=?,@manager uniqueidentifier=?,@root uniqueidentifier=?;
      INSERT auth.LocalAccounts(Id,Username,DisplayName,PasswordHash,Channel) VALUES
        (@specialist,?,N'Organization fixture',N'fixture-only','admin'),
        (@manager,?,N'Organization fixture',N'fixture-only','admin'),
        (@root,?,N'Organization fixture',N'fixture-only','admin');
      INSERT svc_demo.TaiKhoan(MaHS,Hoten,VaiTro,MaDV,NguonDanhTinh,HieuLuc) VALUES
        (?,N'Organization fixture','STAFF','115','LOCAL',1),
        (?,N'Organization fixture','STAFF','115','LOCAL',1),
        (?,N'Organization fixture','STAFF',NULL,'LOCAL',1);
      INSERT auth.AccountProfiles(AccountId,StaffAccountId,AccessLevel,FieldCode) VALUES
        (@specialist,?,'specialist','DT'),(@manager,?,'department_admin','DT'),(@root,?,'super_admin',NULL);
      INSERT auth.AccountTasks(AccountId,TaskId,FieldCode) VALUES(@specialist,4,'DT');INSERT auth.AccountPermissions(AccountId,PermissionName)SELECT @specialist,PermissionName FROM auth.PermissionDefinitions WHERE TaskId=4 AND FieldCode='DT';
      IF NOT EXISTS(SELECT 1 FROM svc_demo.vQuyenHieuLuc WHERE MaHS=? AND MaQuyen='requests.receive') THROW 51990,'Missing specialist grant',1;
      IF EXISTS(SELECT 1 FROM svc_demo.vQuyenHieuLuc WHERE MaHS IN(?,?)) THROW 51990,'Administrator received workflow grants',1;
      UPDATE auth.LocalAccounts SET IsActive=0 WHERE Id=@specialist;
      IF EXISTS(SELECT 1 FROM svc_demo.vQuyenHieuLuc WHERE MaHS=?) THROW 51990,'Inactive specialist retained grants',1;
      SELECT COUNT(*) AS fields FROM auth.Fields WHERE FieldCode IN('KT','QC','SV','TTHL','TTTH','SSERC','DT','TC','PC');
      ROLLBACK TRANSACTION;
      END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;THROW;END CATCH;`,
    [...ids, ...usernames, ...staff, ...staff, staff[0], staff[1], staff[2], staff[0]]);
    assert.equal(result.first[0].fields, 9);
    await assert.rejects(() => transactionLocalDatabase(`${localDatabaseGuardSql}
      DECLARE @id uniqueidentifier=?;
      INSERT auth.LocalAccounts(Id,Username,DisplayName,PasswordHash,Channel) VALUES(@id,?,N'Fixture',N'fixture-only','admin');
      INSERT auth.AccountProfiles(AccountId,AccessLevel,FieldCode) VALUES(@id,'specialist','KT');
      INSERT auth.AccountTasks(AccountId,TaskId,FieldCode) VALUES(@id,1,'KT');`, [ids[0], usernames[0]]), /FOREIGN KEY|REFERENCE constraint/i);
    const remaining = await queryLocalDatabase('SELECT COUNT(*) AS n FROM auth.LocalAccounts WHERE Id IN(?,?,?)', ids);
    assert.equal(remaining.first[0].n, 0, 'all fixtures were rolled back');
  } finally { await disconnectLocalDatabase(); }
});

test('local provisioning, linked audiences, read-only monitoring and session revocation work together', {
  skip: process.env.AUTH_ORGANIZATION_DB_TEST !== '1',
}, async () => {
  assertLocalDemoTarget();
  const rootId = randomUUID(), rootName = 'org-root-' + randomUUID();
  const managerName = 'org-manager-' + randomUUID(), specialistName = 'Chuyên viên #' + randomUUID();
  const password = 'fixture-' + randomUUID(), replacement = 'fixture-' + randomUUID();
  const write = (sql, params) => queryLocalDatabase(localDatabaseGuardSql + sql, params);
  const repository = createOrganizationRepository(), authRepository = createAuthRepository();
  let clock = Date.now();
  const store = createAuthStore({ now: () => clock });
  const auth = createAuthService({ repository: authRepository, store, now: () => clock, config: {
    nodeEnv: 'test', jwt:{secret:'offline-app-key-with-at-least-32-bytes',shareSsoKey:false, issuer: 'org-test', studentAudience: 'student', staffAudience: 'staff', adminAudience: 'admin', expiresIn: '15m' },
    microsoftSso: { jwtSecret: 'organization-fixture-key-at-least-32-bytes' }, auth: { refreshTtlSeconds: 600 },
  } });
  const service = createOrganizationService(repository, createProgressRepository());
  try {
    await write(`INSERT auth.LocalAccounts(Id,Username,DisplayName,PasswordHash,Channel) VALUES(?,?,N'Fixture root',?,'admin');
      INSERT auth.AccountProfiles(AccountId,AccessLevel) VALUES(?,'super_admin');`, [rootId, rootName, await hashPassword(password), rootId]);
    const root = { authorizationStatus: 'active', organization: await repository.authorization(rootId) };
    const manager = await service.saveAccount(root, null, { username: managerName, password, displayName: 'Fixture manager', accessLevel: 'department_admin', fieldCode: 'DT' });
    assert(manager?.accountId, 'created manager is returned');
    const managerClaims = { authorizationStatus: 'active', organization: await repository.authorization(manager.accountId) };
    const specialist = await service.saveAccount(managerClaims, null, { username: specialistName, password, displayName: 'Fixture specialist', accessLevel: 'specialist', fieldCode: 'DT', permissions: ['work:DonSV01','work:certifications:3'] });
    assert(specialist?.accountId, 'created specialist is returned');
    assert.equal((await queryLocalDatabase('SELECT COUNT(*) AS n FROM svc_demo.DangNhapChuyenVien WHERE MaHS=?',[specialist.staffAccountId])).first[0].n,0,'provisioning must not create demo credentials');
    assert.equal(specialist.username, specialistName, 'Unicode, uppercase and punctuation are preserved in SQL');
    const admin = await auth.loginWithPassword('admin', { username: specialistName, password });
    const staff = await auth.loginWithPassword('staff', { username: specialistName, password });
    assert.deepEqual(admin.data.user.tags.taskIds, [1, 4]);
    assert.deepEqual(staff.data.user.tags.taskIds, [1, 4]);
    assert(staff.data.user.permissions.includes('requests.receive'));
    await assert.rejects(() => auth.verifyToken(admin.data.accessToken, 'staff'), e => e.statusCode === 401);
    for (const id of [1, 2, 3, 4]) assert(Array.isArray((await service.progress(managerClaims, id)).items));
    const changed = await service.saveAccount(managerClaims, specialist.accountId, { displayName: 'Fixture specialist', accessLevel: 'specialist', fieldCode: 'DT', permissions: ['work:academic-leave:leave'], revision: specialist.revision });
    for (const [bundle, channel] of [[admin, 'admin'], [staff, 'staff']])
      await assert.rejects(() => auth.verifyToken(bundle.data.accessToken, channel), e => e.statusCode === 401);
    for (const channel of ['admin', 'staff'])
      assert.deepEqual((await auth.loginWithPassword(channel, { username: specialistName, password })).data.user.tags.taskIds, [3]);
    clock += 900001; // Separate credential checks into a fresh login rate-limit window.
    await service.saveAccount(managerClaims, specialist.accountId, { displayName: 'Fixture specialist', accessLevel: 'specialist', fieldCode: 'DT', permissions: ['work:academic-leave:leave'], revision: changed.revision, password: replacement });
    for (const channel of ['admin', 'staff']) {
      await assert.rejects(() => auth.loginWithPassword(channel, { username: specialistName, password }), e => e.statusCode === 401);
      assert.deepEqual((await auth.loginWithPassword(channel, { username: specialistName, password: replacement })).data.user.tags.taskIds, [3]);
    }
    const selfPassword = 'fixture-' + randomUUID();
    const selfSession = await auth.loginWithPassword('staff', { username: specialistName, password: replacement });
    await auth.updateStaffPassword(await auth.verifyToken(selfSession.data.accessToken, 'staff'), { currentPassword: replacement, newPassword: selfPassword });
    for (const channel of ['admin', 'staff'])
      assert.deepEqual((await auth.loginWithPassword(channel, { username: specialistName, password: selfPassword })).data.user.tags.taskIds, [3]);
  } finally {
    // Only UUID-named fixtures from this test are removed, preserving application users/history.
    await transactionLocalDatabase(`${localDatabaseGuardSql}
      DECLARE @fixtures TABLE(Id uniqueidentifier,StaffId nvarchar(40));
      INSERT @fixtures SELECT a.Id,p.StaffAccountId FROM auth.LocalAccounts a LEFT JOIN auth.AccountProfiles p ON p.AccountId=a.Id WHERE a.Username IN(?,?,?);
      DELETE auth.AccountSecurityEvents WHERE ActorId IN(SELECT Id FROM @fixtures) OR TargetId IN(SELECT Id FROM @fixtures);
      DELETE auth.AccountPermissions WHERE AccountId IN(SELECT Id FROM @fixtures);DELETE auth.AccountRoles WHERE AccountId IN(SELECT Id FROM @fixtures);
      DELETE auth.AccountTasks WHERE AccountId IN(SELECT Id FROM @fixtures);
      DELETE auth.AccountProfiles WHERE AccountId IN(SELECT Id FROM @fixtures);
      DELETE svc_demo.LichSuRBAC WHERE MaTaiKhoan IN(SELECT StaffId FROM @fixtures);
      DELETE svc_demo.DangNhapChuyenVien WHERE MaHS IN(SELECT StaffId FROM @fixtures);
      DELETE svc_demo.TaiKhoan WHERE MaHS IN(SELECT StaffId FROM @fixtures);
      DELETE auth.LocalAccounts WHERE Id IN(SELECT Id FROM @fixtures);`, [rootName, managerName, specialistName]);
    store.close(); await disconnectLocalDatabase();
  }
});
