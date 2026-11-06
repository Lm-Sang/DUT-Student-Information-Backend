import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,createContext} from 'node:vm';
const collection=JSON.parse(readFileSync('docs/collections/certifications.postman_collection.json','utf8'));
const variables=new Map(collection.variable.map(v=>[v.key,v.value]));
assert.equal(collection.info.schema,'https://schema.getpostman.com/json/collection/v2.1.0/collection.json');
assert.equal(new Set(collection.item.map(e=>e.name)).size,collection.item.length);
let compiled=0,assertions=0,executions=0,serial=0;
for(const entry of collection.item)for(const event of entry.event ?? []){new Script(event.script.exec.join('\n'));compiled++;}
const pm={collectionVariables:{get:key=>variables.get(key),set:(key,v)=>variables.set(key,String(v)),unset:key=>variables.delete(key)},
  variables:{get:key=>variables.get(key)},test(_name,fn){fn();assertions++;},expect(actual){return {to:{eql(expected){assert.deepEqual(actual,expected);}}};}};
const context=createContext({pm,console});
function hooks(entry,listen){for(const event of entry.event ?? [])if(event.listen===listen)new Script(event.script.exec.join('\n')).runInContext(createContext({pm,console}));}
function replace(s){return s.replace(/\{\{(\w+)\}\}/g,(_,key)=>{assert.ok(variables.has(key)&&String(variables.get(key)).length,`Unresolved ${key}`);return String(variables.get(key));});}
const app={id:'11111111-1111-4111-8111-111111111111',currentVersion:{id:'22222222-2222-4222-8222-222222222222',rowVersion:'0000000000000001',files:[]}};
function post(entry,status,data){pm.response={code:status,json:()=>({success:status<300,data})};hooks(entry,'test');executions++;}
for(const entry of collection.item.filter(e=>/^\d/.test(e.name))){
  if(entry.name.startsWith('06')){
    assert.throws(()=>hooks(entry,'prerequest'),/fileBytes/);
    variables.set('fileBytes','1234');
  }
  hooks(entry,'prerequest');replace(entry.request.url);
  for(const header of entry.request.header)replace(header.value);
  if(entry.request.body?.mode==='raw')JSON.parse(replace(entry.request.body.raw));
  const prefix=entry.name.slice(0,2);
  let data=app,status=200;
  if(prefix==='00')data={r2PrivateConfirmed:false};
  if(prefix==='01')data=[];
  if(prefix==='02'){data={id:13,scoreMode:'toeic_four'};status=201;}
  if(prefix==='03'){data={id:14,scoreMode:'toeic_lr'};status=201;}
  if(prefix==='04')status=201;
  if(prefix==='06'){
    status=201;data={application:app,upload:{id:'33333333-3333-4333-8333-333333333333',url:'https://r2.example/temporary',headers:{'Content-Type':'image/png'}}};
  }
  if(prefix==='07'||prefix==='14')data=null;
  if(prefix==='08')app.currentVersion.files=[{id:'44444444-4444-4444-8444-444444444444',uploadSessionId:variables.get('uploadId'),status:'active',quality:{status:'needs_review'}}];
  if(prefix==='10')data={items:[]};
  if(prefix==='13')data={url:'https://r2.example/download'};
  app.currentVersion.rowVersion=(++serial).toString(16).padStart(16,'0').toUpperCase();
  post(entry,status,data);
}
assert.equal(variables.get('applicationId'),app.id);
assert.equal(variables.get('fileId'),app.currentVersion.files[0].id);
for(const entry of collection.item.filter(e=>e.name.startsWith('N'))){
  hooks(entry,'prerequest');replace(entry.request.url);
  for(const header of entry.request.header)replace(header.value);
  if(entry.request.body?.mode==='raw')JSON.parse(replace(entry.request.body.raw));
  const expected=Number(/HTTP (\d+)/.exec(entry.event.find(e=>e.listen==='test').script.exec.join('\n'))[1]);
  post(entry,expected,entry.name.startsWith('N05') ? structuredClone(app) : null);
}
assert.equal(variables.get('applicationId'),app.id,'Negative tests must not overwrite the main application variables.');
assert.equal(variables.get('negativeVersionId'),app.currentVersion.id);
for(const prefix of ['A01','A02']){
  const entry=collection.item.find(e=>e.name.startsWith(prefix));hooks(entry,'prerequest');
  if(prefix==='A02'){app.currentVersion={...app.currentVersion,id:'55555555-5555-4555-8555-555555555555',files:[]};}
  post(entry,prefix==='A02'?201:200,app);
}
assert.equal(variables.get('fileId'),'');
assert.equal(variables.get('versionId'),app.currentVersion.id);
assert.equal(collection.variable.find(v=>v.key==='uploadUrl').value,'');
console.log(JSON.stringify({requests:collection.item.length,compiledHooks:compiled,postprocessorExecutions:executions,assertions,validJsonBodiesAfterSubstitution:true,variablesAndRowVersionUpdated:true,sqlOrR2Writes:false}));
