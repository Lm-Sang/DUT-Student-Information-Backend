import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { createApp } from '../../../app.js';
test('personal academic read routes require authentication before any school read', async t => {
  const server=createServer(createApp());
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>{server.closeAllConnections();return new Promise(resolve=>server.close(resolve));});
  for(const path of ['profile','grades','curriculum','schedule','avatar']) {
    const response=await fetch(`http://127.0.0.1:${server.address().port}/api/students/me/${path}`);
    assert.equal(response.status,401,path);
  }
});
