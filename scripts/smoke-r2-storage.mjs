// Run only after explicit permission to write a disposable image to the R2
// bucket configured in .env. This is deliberately separate from local tests.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {certificationConfig} from '../src/config/certifications.js';
import {createR2Storage} from '../src/infrastructure/storage/r2-storage.js';
if(process.argv.length!==3||process.argv[2]!=='--allow-cloud-fixture')throw Error('Cloud fixture approval required; use --allow-cloud-fixture only after approval.');
const storage=createR2Storage({config:certificationConfig.r2});
const key='integration-tests/rbac/'+randomUUID()+'/test-only.png';
const bytes=await sharp({create:{width:800,height:600,channels:3,background:'#174b87'}}).png().toBuffer();
let uploaded=false;
try{
 const upload=await storage.presignUpload(key,'image/png',120);
 const options=await fetch(upload.url,{method:'OPTIONS',headers:{Origin:'http://localhost:5173','Access-Control-Request-Method':'PUT','Access-Control-Request-Headers':'content-type,if-none-match'},signal:AbortSignal.timeout(20000)});
 assert(options.ok,'R2 CORS preflight failed');
 assert(['*','http://localhost:5173'].includes(options.headers.get('access-control-allow-origin')),'R2 CORS must allow the integrated frontend origin');
 const put=await fetch(upload.url,{method:'PUT',headers:upload.headers,body:bytes,signal:AbortSignal.timeout(20000)});
 assert(put.ok,'R2 PUT failed');uploaded=true;
 assert.equal((await storage.head(key)).sizeBytes,bytes.length);
 assert((await storage.read(key,bytes.length+1)).equals(bytes));
 const get=await fetch(await storage.download(key,120),{signal:AbortSignal.timeout(20000)});assert(get.ok,'R2 signed download failed');
 assert(Buffer.from(await get.arrayBuffer()).equals(bytes));
 console.log('R2 CORS, signed PUT, HEAD, read and signed GET passed with a synthetic image.');
}finally{if(uploaded){await storage.remove(key);console.log('Removed only this run’s synthetic R2 object.');}}
