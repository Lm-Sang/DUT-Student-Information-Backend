import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const urls=JSON.parse(await readFile('.data/it-fe-preview-urls.json','utf8'));
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function page(url){
 const target=await(await fetch('http://127.0.0.1:9231/json/new?about:blank',{method:'PUT'})).json();
 const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});
 let next=0;const pending=new Map(),errors=[];
 socket.onmessage=event=>{const msg=JSON.parse(event.data);if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.text);
  if(msg.id){const p=pending.get(msg.id);pending.delete(msg.id);if(msg.error)p.reject(new Error(JSON.stringify(msg.error)));else p.resolve(msg.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
 const wait=async expression=>{const deadline=Date.now()+20000;while(Date.now()<deadline){if(await evaluate(expression))return;await delay(100);}
  throw new Error('Timed out: '+expression+'\n'+await evaluate('document.body.innerText'));};
 await send('Page.enable');await send('Runtime.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1050,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url});
 const file=async()=>{const {root}=await send('DOM.getDocument');const {nodeId}=await send('DOM.querySelector',{nodeId:root.nodeId,selector:'#evidence-files'});
  await send('DOM.setFileInputFiles',{nodeId,files:[resolve('.data/it-fe-fixture.png')]});};
 const screenshot=async path=>{const {data}=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(path,Buffer.from(data,'base64'));};
 return{send,evaluate,wait,file,screenshot,errors,close:()=>socket.close()};
}
const student=await page(urls.studentUrl+'/?kind=it');let reviewer;
async function request(path,{method='GET',body,cookie,version,auth=true}={}){
 const response=await fetch(urls.apiBaseUrl+path,{method,headers:{...(auth?{Authorization:'Bearer preview-token'}:{}),...(body?{'Content-Type':'application/json'}:{}),
  ...(cookie?{cookie}:{}),...(version?{'If-Match':'"'+version+'"'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const result=await response.json();assert.ok(response.ok,JSON.stringify(result));return{response,data:result.data};
}
try{
 await student.send('Page.bringToFront');
 await student.wait("document.querySelector('#connection')?.textContent.includes('Backend:')");
 await student.evaluate("sessionStorage.setItem('certification.returnTo','/?kind=it');location.href='/auth-callback.html#accessToken=preview-token'");
 await student.wait("document.querySelector('#it-MaCC')?.options.length===3");
 await student.wait("fetch("+JSON.stringify(urls.apiBaseUrl+'/fixture-summary')+").then(r=>r.json()).then(s=>s.eventConnections>=1)");
 await student.evaluate("document.querySelector('#it-SoHieu').value='SSE-001';document.querySelector('#it-CoSoCapCC').value='Cơ sở kiểm thử SSE';document.querySelector('#it-SoVaoSo').value='VS-001';document.querySelector('#it-NgayCC').value='2026-10-01';const select=document.querySelector('#it-MaCC');select.value='CNTT01';select.dispatchEvent(new Event('change',{bubbles:true}));");
 await student.file();await student.evaluate("document.querySelector('#application-form').requestSubmit()");
 await student.wait("document.querySelector('#notice').textContent.includes('Chờ xét duyệt')");
 const summary=await(await fetch(urls.apiBaseUrl+'/fixture-summary')).json();const id=summary.records[0].id;
 const login=await request('/api/certifications/reviewer/auth/login',{method:'POST',auth:false,body:{username:'admin',password:'123'}});
 const cookie=login.response.headers.get('set-cookie').split(';')[0];
 const current=(await request('/api/it-certifications/applications/'+id)).data;
 await request('/api/it-certifications/reviewer/applications/'+id+'/review',{method:'POST',auth:false,cookie,version:current.rowVersion,
  body:{decision:'needs_changes',reason:'Cần ảnh rõ số hiệu SSE',verificationMethod:'document_comparison'}});
 // No page reload or refresh button: the open student page must receive SSE.
 await student.wait("document.querySelector('#application-detail').textContent.includes('Cần ảnh rõ số hiệu SSE')");
 await student.screenshot('.data/sse-student-update.png');
 await student.evaluate("Array.from(document.querySelectorAll('#application-detail button')).find(b=>b.textContent==='Bổ sung hồ sơ').click();document.querySelector('#it-SoHieu').value='SSE-002'");
 await student.file();await student.evaluate("document.querySelector('#application-form').requestSubmit()");
 await student.wait("document.querySelector('#notice').textContent.includes('Chờ xét duyệt')");
 reviewer=await page(urls.reviewerUrl+'/?kind=it');await reviewer.send('Page.bringToFront');
 await reviewer.wait("!document.querySelector('#reviewer-login').disabled");
 await reviewer.evaluate("document.querySelector('#reviewer-password').value='123';document.querySelector('#reviewer-login-form').requestSubmit()");
 await reviewer.wait("document.querySelectorAll('#queue-items tr').length===1");
 await reviewer.evaluate("document.querySelector('#queue-items button').click()");
 await reviewer.wait("!document.querySelector('#review-form').hidden");
 await student.wait("document.hidden===true");
 await reviewer.evaluate("document.querySelector('#review-decision').value='verified';document.querySelector('#review-form').requestSubmit()");
 await reviewer.wait("document.querySelector('#reviewer-notice').textContent.includes('Đã xác nhận')");
 await student.send('Page.bringToFront');
 await student.wait("document.querySelector('#application-detail').textContent.includes('Đã xác nhận')");
 const final=await(await fetch(urls.apiBaseUrl+'/fixture-summary')).json();
 assert.equal(final.applications,1);assert.equal(final.records[0].id,id);assert.equal(final.records[0].SoHieu,'SSE-002');
 assert.deepEqual(student.errors,[]);assert.deepEqual(reviewer.errors,[]);
 console.log(JSON.stringify({browser:'Edge',studentUpdatesWithoutReload:true,supplementKeepsId:true,
  reconnectResyncsAfterHiddenTab:true,reviewerReceivesUpdates:true,javascriptErrors:0}));
}finally{student.close();reviewer?.close();}
