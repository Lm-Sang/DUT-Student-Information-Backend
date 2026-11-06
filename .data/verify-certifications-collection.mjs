import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,createContext} from 'node:vm';
import {createServer} from 'node:http';
import sharp from 'sharp';
import {createApp} from '../src/app.js';
import {createCertificationsModule} from '../src/modules/certifications/index.js';
import {certificationConfig} from '../src/config/certifications.js';
import {MemoryRepository,MemoryStorage} from '../src/modules/certifications/__tests__/support.js';

const collection=JSON.parse(readFileSync('docs/collections/certifications.postman_collection.json','utf8'));
assert.equal(collection.info.schema,'https://schema.getpostman.com/json/collection/v2.1.0/collection.json');
const variables=new Map(collection.variable.map(v=>[v.key,v.value]));
for(const entry of collection.item)for(const event of entry.event ?? [])new Script(event.script.exec.join('\n'));
const repository=new MemoryRepository(),storage=new MemoryStorage();
const module=createCertificationsModule({repository,storage,config:{...certificationConfig,devMode:true,nodeEnv:'test'}});
const server=createServer(createApp({certificationsModule:module}));
const pattern=Array.from({length:15},(_,y)=>Array.from({length:20},(_,x)=>`<rect x="${50+x*40}" y="${50+y*40}" width="18" height="6"/>`).join('')).join('');
const bytes=await sharp(Buffer.from(`<svg width="1000" height="800"><rect width="100%" height="100%" fill="white"/>${pattern}</svg>`)).png().toBuffer();
variables.set('fileBytes',String(bytes.length));
let assertions=0,requests=0;
const replace=s=>s.replace(/\{\{(\w+)\}\}/g,(_,key)=>{
  assert.ok(variables.has(key)&&String(variables.get(key)).length,`Unresolved ${key}`);return String(variables.get(key));
});
const pm={collectionVariables:{get:key=>variables.get(key),set:(key,v)=>variables.set(key,String(v)),unset:key=>variables.delete(key)},
  variables:{get:key=>variables.get(key)},test(_name,fn){fn();assertions++;},expect(actual){return {to:{eql(expected){assert.deepEqual(actual,expected);}}};}};
const context=createContext({pm,console});
async function run(entry) {
  for(const event of entry.event ?? [])if(event.listen==='prerequest')new Script(event.script.exec.join('\n')).runInContext(context);
  const url=replace(entry.request.url);
  let status,body;
  if(entry.request.body?.mode==='file') {
    const key=new URL(url).pathname.slice(1);storage.objects.set(key,bytes);status=200;
  } else if(entry.request.url==='{{downloadUrl}}') {
    const key=new URL(url).pathname.slice('/private/'.length);assert.deepEqual(storage.objects.get(key),bytes);status=200;
  } else {
    const headers=Object.fromEntries(entry.request.header.map(h=>[h.key,replace(h.value)]));
    const response=await fetch(url,{method:entry.request.method,headers,body:entry.request.body?.mode==='raw'?replace(entry.request.body.raw):undefined});
    status=response.status;body=await response.json();
  }
  pm.response={code:status,json:()=>body};
  for(const event of entry.event ?? [])if(event.listen==='test')new Script(event.script.exec.join('\n')).runInContext(context);
  requests++;
}
try {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  variables.set('baseUrl',`http://127.0.0.1:${server.address().port}`);
  for(const entry of collection.item.filter(e=>/^\d/.test(e.name)))await run(entry);
  assert.equal(repository.applications.get(variables.get('applicationId')).Versions[0].Status,'verified');
  for(const entry of collection.item.filter(e=>e.name.startsWith('N')))await run(entry);
  // Check the alternative review branch on a fresh application.
  for(const entry of collection.item.filter(e=>/^(04|06|07|08|09) /.test(e.name)))await run(entry);
  for(const prefix of ['A01','A02'])await run(collection.item.find(e=>e.name.startsWith(prefix)));
  assert.equal(repository.applications.get(variables.get('applicationId')).Versions[0].VersionNumber,2);
  assert.equal(variables.get('fileId'),'');
  console.log(JSON.stringify({requestsInCollection:collection.item.length,requestExecutions:requests,scriptAssertions:assertions,verifiedMainFlow:true,verifiedNegativeCases:true,verifiedRevisionFlow:true,sqlOrR2Writes:false}));
} finally {await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});}
