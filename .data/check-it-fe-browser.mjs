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
try{
 await student.wait("document.querySelector('#connection')?.textContent.includes('Backend:')");
 await student.evaluate("sessionStorage.setItem('certification.returnTo','/?kind=it');location.href='/auth-callback.html#accessToken=preview-token'");
 await student.wait("location.search==='?kind=it' && document.querySelector('#it-MaCC')?.options.length===3");
 assert.equal(await student.evaluate("document.querySelector('#language-fields').disabled"),true);
 assert.equal(await student.evaluate("document.querySelectorAll('[data-it-key]').length"),5);
 await student.evaluate("document.querySelector('#it-SoHieu').value='SH-001';document.querySelector('#it-CoSoCapCC').value='Trung tâm kiểm thử';document.querySelector('#it-SoVaoSo').value='VS-001';document.querySelector('#it-NgayCC').value='2026-10-01';const select=document.querySelector('#it-MaCC');select.value='CNTT01';select.dispatchEvent(new Event('change',{bubbles:true}));");
 await student.file();await student.screenshot('.data/it-fe-form.png');
 await student.evaluate("document.querySelector('#application-form').requestSubmit()");
 await student.wait("document.querySelector('#notice').textContent.includes('Chờ xét duyệt')");
 await student.screenshot('.data/it-fe-submitted.png');
 reviewer=await page(urls.reviewerUrl+'/?kind=it');
 await reviewer.wait("!document.querySelector('#reviewer-login').disabled");
 await reviewer.evaluate("document.querySelector('#reviewer-password').value='123';document.querySelector('#reviewer-login-form').requestSubmit()");
 await reviewer.wait("document.querySelectorAll('#queue-items tr').length===1");
 await reviewer.evaluate("document.querySelector('#queue-items button').click()");
 await reviewer.wait("!document.querySelector('#review-form').hidden && document.querySelector('.evidence-card img')?.naturalWidth>0");
 await reviewer.screenshot('.data/it-fe-reviewer.png');
 await reviewer.evaluate("document.querySelector('#review-decision').value='needs_changes';document.querySelector('#review-reason').value='Chụp rõ số hiệu';document.querySelector('#review-form').requestSubmit()");
 await reviewer.wait("document.querySelector('#reviewer-notice').textContent.includes('Cần bổ sung')");
 await student.send('Page.reload',{ignoreCache:true});
 await student.wait("document.querySelectorAll('#history .history-row').length===1");
 await student.evaluate("document.querySelector('#history button').click()");
 await student.wait("Array.from(document.querySelectorAll('#application-detail button')).some(b=>b.textContent==='Bổ sung hồ sơ')");
 await student.evaluate("Array.from(document.querySelectorAll('#application-detail button')).find(b=>b.textContent==='Bổ sung hồ sơ').click();document.querySelector('#it-SoHieu').value='SH-002'");
 await student.file();await student.evaluate("document.querySelector('#application-form').requestSubmit()");
 await student.wait("document.querySelector('#notice').textContent.includes('Chờ xét duyệt')");
 const summary=await(await fetch(urls.apiBaseUrl+'/fixture-summary')).json();
 assert.equal(summary.applications,1);assert.equal(summary.records[0].SoHieu,'SH-002');assert.equal(summary.records[0].files,1);
 assert.deepEqual(student.errors,[]);assert.deepEqual(reviewer.errors,[]);
 await student.send('Page.navigate',{url:urls.studentUrl+'/?kind=language'});
 await student.wait("document.querySelector('#certificate-type')?.options[0]?.textContent.includes('IELTS')");
 assert.equal(await student.evaluate("document.querySelector('#it-fields').disabled"),true);
 console.log(JSON.stringify({browser:'Edge',itFormFields:5,callbackReturnsToIt:true,submitAndReview:true,supplementKeepsApplication:true,
  latestFileCount:1,languageTabWorks:true,javascriptErrors:0}));
}finally{student.close();reviewer?.close();}
