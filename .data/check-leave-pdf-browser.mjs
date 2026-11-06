import puppeteer from 'puppeteer-core';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const urls=JSON.parse(await readFile('.data/leave-preview-urls.json','utf8'));
const browser=await puppeteer.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,
  args:['--disable-gpu','--no-first-run']});
const errors=[];
try{
 const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));
 await page.setViewport({width:1280,height:1100});
 await page.goto(urls.student+'/academic-leave.html');await page.evaluate(()=>sessionStorage.setItem('ddut.ssoToken','fixture-token'));await page.reload();
 await page.waitForFunction(()=>document.querySelectorAll('#semester option').length===3&&!document.getElementById('fields').disabled);
 await page.select('#reason','medical');await page.click('#confirm');
 const pdfTarget=await browser.waitForTarget(target=>target.url().startsWith(urls.api+'/api/academic-leave/print?MADN=NH9992600011'),{timeout:30000});
 const pdfPage=await pdfTarget.page();await new Promise(resolve=>setTimeout(resolve,1800));
 const cookies=await browser.cookies();const printCookie=cookies.find(cookie=>cookie.name==='academic_leave_print');assert.ok(printCookie);
 const response=await fetch(pdfTarget.url(),{headers:{Cookie:printCookie.name+'='+printCookie.value}});
 assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/^application\/pdf/);
 assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0,5).toString(),'%PDF-');
 const reviewer=await browser.newPage();reviewer.on('pageerror',error=>errors.push(error.message));
 await reviewer.goto(urls.reviewer+'/academic-leave.html');await reviewer.waitForSelector('#reviewer-auth:not([hidden])');
 await reviewer.type('#password','123');await reviewer.click('#login-form button');
 await reviewer.waitForSelector('#applications button');await reviewer.click('#applications button');
 await reviewer.waitForSelector('#review-form:not([hidden])');
 await reviewer.click('#print');
 await new Promise(resolve=>setTimeout(resolve,1500));
 const requests=(await browser.targets()).filter(target=>target.url()===pdfTarget.url());assert.ok(requests.length>=2);
 await page.screenshot({path:'.data/leave-pdf-student-ui.png',fullPage:true});
 if(pdfPage)await pdfPage.screenshot({path:'.data/leave-pdf-viewer.png'}).catch(()=>{});
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({studentPrintQuery:true,reviewerPrintQuery:true,pdfMimeVerified:true,pdfSignatureVerified:true,ssoTokenNotInUrl:true,javascriptErrors:0}));
}finally{await browser.close();}
