import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AppError } from '../../../src/shared/errors/app-error.js';
import { createLocalPermissionContext } from '../../../src/common/auth/index.js';
import { createCertificationEvents } from '../../../src/common/certifications/events/certification-events.js';
import { createCertificationsModule, createItCertificationsModule } from '../../../src/bootstrap/modules/certifications.module.js';
import { isolatedApp, listen, studentContext, headers } from '../../support/frontend-areas.js';

test('each certificate stream enforces its own local task and emits only that certificate kind on both URL layouts', async t => {
  const events = createCertificationEvents();
  t.after(() => events.closeAll());
  const auth = { verifyToken: async (token, channel) => {
    assert.equal(channel, 'admin');
    if (!['language', 'it', 'department', 'wrong-task'].includes(token)) throw new AppError('Invalid token', 401);
    return { authMethod: 'password', localUserId: token, identity: { displayName: token },
      organization: { active: true, fieldActive: true, fieldCode: 'DT',
        accessLevel: token === 'department' ? 'department_admin' : 'specialist',
        taskIds: token === 'language' ? [1] : token === 'it' ? [2] : [] }, permissions: ['certifications:review'] };
  } };
  const options = task => ({ config: { r2: {} }, storage: {}, inspectImage: async () => ({}), repository: {}, events,
    studentContextProvider: studentContext,
    reviewerAuthentication: { actor: createLocalPermissionContext('certifications:review', auth, task) } });
  const base = await listen(t, isolatedApp({ certificationsModule: createCertificationsModule(options(1)),
    itCertificationsModule: createItCertificationsModule(options(2)) }));
  for (const [module, kind, token] of [['certifications', 'language', 'language'], ['it-certifications', 'it', 'it']]) {
    for (const prefix of [`/api/admin/${module}`, `/api/${module}/reviewer`]) {
      assert.equal((await fetch(base + prefix + '/events')).status, 401);
      for (const denied of ['student', 'wrong-task', kind === 'language' ? 'it' : 'language']) {
        const response = await fetch(base + prefix + '/events', { headers: headers(denied) });
        assert.equal(response.status, denied === 'student' ? 401 : 403);
      }
      for (const allowed of [token, 'department']) {
        const response = await fetch(base + prefix + '/events', { headers: headers(allowed) });
        assert.equal(response.status, 200);
        const reader = response.body.getReader();
        try {
          await reader.read(); // Initial connected event.
          for (const eventKind of [kind === 'language' ? 'it' : 'language', kind]) events.publish({
            owner: { source: 'auth', reference: 'student:one' }, kind: eventKind,
            applicationId: '00000000-0000-4000-8000-000000000001', status: 'submitted', rowVersion: '0000000000000001' });
          const update = new TextDecoder().decode((await reader.read()).value);
          assert.match(update, new RegExp('"kind":"' + kind + '"'));
          assert.doesNotMatch(update, new RegExp('"kind":"' + (kind === 'language' ? 'it' : 'language') + '"'));
        } finally { await reader.cancel(); }
      }
    }
  }
});
