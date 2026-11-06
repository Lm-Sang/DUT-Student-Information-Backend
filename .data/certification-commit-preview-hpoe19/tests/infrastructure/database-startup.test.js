import assert from 'node:assert/strict';
import { test } from 'node:test';

import { initializeDatabases } from '../../src/infrastructure/database/index.js';

test('startup opens both database instances concurrently', async () => {
  const started = [];
  const releases = [];
  const connect = (instance) => () => {
    started.push(instance);
    return new Promise((resolve) => releases.push(resolve));
  };
  const pending = initializeDatabases({ school: connect('school'), local: connect('local') });
  await Promise.resolve();
  assert.deepEqual(started, ['school', 'local']);
  releases.forEach((resolve) => resolve({}));
  assert.deepEqual(await pending, [
    { instance: 'school', connected: true },
    { instance: 'local', connected: true },
  ]);
});

test('a failing instance is reported while the other instance can still connect', async () => {
  for (const failing of ['school', 'local']) {
    const error = new Error(`${failing} is unavailable`);
    const connect = (instance) => () => {
      if (instance === failing) throw error;
      return Promise.resolve({});
    };
    const results = await initializeDatabases({ school: connect('school'), local: connect('local') });
    assert.deepEqual(results.find(({ instance }) => instance === failing), { instance: failing, connected: false, error });
    assert.equal(results.find(({ instance }) => instance !== failing).connected, true);
  }
});
