import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const urls=JSON.parse(await readFile('.data/leave-preview-urls.json','utf8'));
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function attach(target){
 const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let next=0;const pending=new Map(),errors=[];
 socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);
  if(message.id){const handler=pending.get(message.id);pending.delete(message.id);if(message.error)handler.reject(new Error(JSON.stringify(message.error)));else handler.resolve(message.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});
  if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
 const wait=async expression=>{const deadline=Date.now()+20000;while(Date.now()<deadline){if(await evaluate(expression))return;await delay(100);}throw new Error('Timed out '+expression+'\n'+await evaluate('document.body.innerText'));};
 await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1100,deviceScaleFactor:1,mobile:false});
 return{send,evaluate,wait,errors,close:()=>socket.close(),screenshot:async path=>{const {data}=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(path,Buffer.from(data,'base64'));}};
}
async function page(url){const target=await(await fetch('http://127.0.0.1:9231/json/new?about:blank',{method:'PUT'})).json();const p=await attach(target);await p.send('Page.navigate',{url});return p;}
const student=await page(urls.student+'/academic-leave.html');let reviewer,printed;
try{
 await student.wait("document.getElementById('login') && document.getElementById('notice').textContent.includes('Đăng nhập')");
 await student.evaluate("sessionStorage.setItem('ddut.ssoToken','fixture-token');location.reload();true");
 await student.wait("document.querySelectorAll('#semester option').length===3 && !document.getElementById('fields').disabled");
 assert.equal(await student.evaluate("document.querySelectorAll('#reason option').length"),5);
 assert.equal(await student.evaluate("document.querySelectorAll('#semester-count option').length"),4);
 await student.screenshot('.data/leave-student-form.png');
 await student.evaluate("document.getElementById('reason').value='medical';document.getElementById('semester').value='2610';document.getElementById('content').value='Nội dung kiểm thử';document.getElementById('application-form').requestSubmit();true");
 await student.wait("document.getElementById('notice').textContent.includes('Đã lưu bản nháp') && !document.getElementById('confirm').disabled");
 await student.evaluate("document.getElementById('confirm').click();true");
 await student.wait("document.getElementById('notice').textContent.includes('Đã xác nhận lập đơn') && !document.getElementById('reload').disabled");
 assert.equal(await student.evaluate("document.getElementById('fields').disabled"),true);
 const targets=await(await fetch('http://127.0.0.1:9231/json/list')).json();const target=targets.find(item=>item.url.startsWith('blob:'));
 assert.ok(target,'Print window should open');printed=await attach(target);await printed.wait("document.body.innerText.includes('ĐƠN ĐỀ NGHỊ NGỪNG HỌC')");
 assert.equal(await printed.evaluate("document.querySelectorAll('script').length"),0);await printed.screenshot('.data/leave-print.png');
 reviewer=await page(urls.reviewer+'/academic-leave.html');await reviewer.wait("!document.getElementById('reviewer-auth').hidden");
 await reviewer.evaluate("document.getElementById('password').value='123';document.getElementById('login-form').requestSubmit();true");
 await reviewer.wait("document.querySelector('#applications button') && !document.getElementById('reload').disabled");
 await reviewer.evaluate("document.querySelector('#applications button').click();true");await reviewer.wait("!document.getElementById('review-form').hidden");
 await reviewer.evaluate("document.getElementById('review-note').value='Đã đối chiếu';document.getElementById('review-form').requestSubmit();true");
 await reviewer.wait("!document.getElementById('receive').hidden && !document.getElementById('receive').disabled");await reviewer.screenshot('.data/leave-reviewer-approved.png');
 await reviewer.evaluate("document.getElementById('receive').click();true");await reviewer.wait("document.getElementById('notice').textContent.includes('Đã xác nhận nhận bản giấy')");
 await student.evaluate("document.getElementById('reload').click();true");await student.wait("document.getElementById('detail').textContent.includes('Đã nhận đơn giấy')");
 await student.evaluate("document.getElementById('new').click();true");await student.wait("document.querySelectorAll('#parent option').length===2 && !document.getElementById('fields').disabled");
 await student.evaluate("document.getElementById('kind').value='extension';document.getElementById('kind').dispatchEvent(new Event('change'));document.getElementById('parent').value=document.getElementById('parent').options[1].value;document.getElementById('parent').dispatchEvent(new Event('change'));document.getElementById('semester-count').value='4';document.getElementById('reason').value='military';true");
 assert.equal(await student.evaluate("document.getElementById('semester').value"),'2620');
 await student.evaluate("document.getElementById('confirm').click();true");await student.wait("document.getElementById('detail').textContent.includes('Gia hạn ngừng học') && document.getElementById('detail').textContent.includes('Chờ xét duyệt') && !document.getElementById('reload').disabled");
 await student.screenshot('.data/leave-extension.png');
 assert.deepEqual(student.errors,[]);assert.deepEqual(reviewer.errors,[]);assert.deepEqual(printed.errors,[]);
 console.log(JSON.stringify({studentForm:'passed',threeSemesters:true,fourReasons:true,oneToFourTerms:true,confirmAndPrint:'passed',reviewAndReceivePaper:'passed',extensionFourTerms:'passed',javascriptErrors:0}));
}finally{student.close();reviewer?.close();printed?.close();}
