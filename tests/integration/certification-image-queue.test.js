import assert from 'node:assert/strict';
import {setImmediate as tick} from 'node:timers/promises';
import test from 'node:test';
import {createImageInspectionQueue} from '../../src/modules/certifications/queues/image-inspection-queue.js';
import {inspectEvidenceFiles} from '../../src/modules/certifications/services/evidence-inspection.service.js';

const file={Id:'file',ObjectKey:'file',OriginalFileName:'file.png',DeclaredSizeBytes:4,DeclaredContentType:'image/png'};
test('shared inspection queue bounds all requests before R2 reads and rejects overflow without removing evidence',async()=>{
  const queue=createImageInspectionQueue({concurrency:1,maxQueued:1,waitTimeoutMs:1000});
  const gate=Promise.withResolvers(),started=Promise.withResolvers(),reads=[],removed=[];
  let inspecting=0,peak=0;
  const options={inspectionQueue:queue,config:{maxFileBytes:10},storage:{async head(key){reads.push(key);return{sizeBytes:4};},
    async read(){return Buffer.from('test');},async remove(key){removed.push(key);}},
    inspectImage:async()=>{inspecting++;peak=Math.max(peak,inspecting);started.resolve();await gate.promise;inspecting--;return{status:'needs_review'};}};
  const first=inspectEvidenceFiles([{...file,ObjectKey:'language'}],options);await started.promise;
  const second=inspectEvidenceFiles([{...file,ObjectKey:'it'}],options);
  const overflow=assert.rejects(inspectEvidenceFiles([{...file,ObjectKey:'overflow'}],options),e=>e.statusCode===503&&e.details.code==='CERT_IMAGE_QUEUE_FULL');
  await tick();assert.deepEqual(reads,['language']);assert.deepEqual(queue.stats,{active:1,queued:1,concurrency:1,maxQueued:1});
  gate.resolve();await Promise.all([first,second,overflow]);await tick();
  assert.equal(peak,1);assert.deepEqual(reads,['language','it']);assert.deepEqual(removed,[]);assert.equal(queue.stats.active,0);
});

test('inspection queue removes timed-out waiters and recovers after active task failures',async()=>{
  const queue=createImageInspectionQueue({concurrency:1,maxQueued:1,waitTimeoutMs:25});
  const gate=Promise.withResolvers();
  const first=assert.rejects(queue.run(()=>gate.promise),/inspection failure/);
  let ran=false;
  await assert.rejects(queue.run(()=>{ran=true;}),e=>e.statusCode===503&&e.details.code==='CERT_IMAGE_QUEUE_TIMEOUT');
  assert.equal(ran,false);assert.equal(queue.stats.queued,0);
  gate.reject(new Error('inspection failure'));await first;await tick();
  assert.equal(await queue.run(()=>42),42);
});

test('a burst of 150 submissions queues metadata while only two image reads/inspections run',async()=>{
  const queue=createImageInspectionQueue();
  const gate=Promise.withResolvers(),started=Promise.withResolvers();
  let reads=0,active=0,peak=0;
  const options={inspectionQueue:queue,config:{maxFileBytes:10},storage:{
    async head(){reads++;return{sizeBytes:4};},async read(){return Buffer.from('test');},
    async remove(){assert.fail('Valid images must not be removed');}},
    inspectImage:async()=>{active++;peak=Math.max(peak,active);if(active===2)started.resolve();
      await gate.promise;active--;return{status:'needs_review'};}};
  const submissions=Array.from({length:150},(_,i)=>inspectEvidenceFiles([{...file,Id:'file-'+i,ObjectKey:'proof-'+i}],options));
  try{
    await started.promise;
    assert.equal(reads,2);assert.equal(queue.stats.active,2);assert.equal(queue.stats.queued,148);
  }finally{gate.resolve();}
  const results=await Promise.all(submissions);await tick();
  assert.equal(results.length,150);assert.equal(reads,150);assert.equal(peak,2);
  assert.equal(queue.stats.active,0);assert.equal(queue.stats.queued,0);
});
