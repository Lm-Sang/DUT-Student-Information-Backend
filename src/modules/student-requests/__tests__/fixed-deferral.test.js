import assert from 'node:assert/strict';
import {test} from 'node:test';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {paperTemplates,paperWordValues,renderPaperPdf} from '../services/paper-pdf.renderer.js';
import {fillPaperDocx} from '../services/paper-docx.templates.js';
import {parsePayload} from '../dto/requests.dto.js';
import PizZip from 'pizzip';
import {DOMParser} from '@xmldom/xmldom';

const template=paperTemplates.find(t=>t.code==='DonSV04');
const profile={name:'Sinh viên kiểm thử',studentNumber:'000000001',dateOfBirth:'01/01/2004',birthPlace:'Tỉnh Thừa Thiên Huế',className:'23T_KT1',phone:'0900000000',identityNumber:'000000000001',gender:'Nam',ethnicity:'Kinh',academic:{requiredCredits:130,earnedCredits:95,cumulativeGpa:3.6,conductAverage:85}};
const snapshot={createdAt:'2026-10-27T03:00:00Z',profile};
const variants=[{}, {reason:'GHI_CHU_KHONG_IN',targetTerm:'Học kỳ 2 năm học 2098-2099'}, {reason:'GHI_CHU_DAI '.repeat(150),targetTerm:'Học kỳ 1 năm học 1900-1901'}];
async function read(bytes){
 const task=getDocument({data:new Uint8Array(bytes),useSystemFonts:true});
 try{const pdf=await task.promise,result=[];for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n);result.push((await page.getTextContent()).items.map(i=>({text:i.str,x:i.transform[4],y:i.transform[5],width:i.width})));}return result;}finally{await task.destroy();}
}

test('deferral accepts an empty or optional note while scholarship still requires its reason',()=>{
 assert.deepEqual(parsePayload('DonSV04',{}),{targetTerm:'',reason:''});
 assert.equal(parsePayload('DonSV04',{reason:'Ghi chú chuyên viên'}).reason,'Ghi chú chuyên viên');
 assert.equal(parsePayload('DonSV04',{targetTerm:'2610',reason:'Dữ liệu cũ'}).targetTerm,'2610');
 assert.throws(()=>parsePayload('DonSV04',{studentNumber:'other'}),e=>e.statusCode===400);
 assert.throws(()=>parsePayload('DonSV05',{reviewTerm:'2610'}),e=>e.statusCode===400);
});

test('deferral PDF text and every anchor stay identical regardless of notes or legacy term selections',async()=>{
 let baseline;
 for(const values of variants){
  const result=await renderPaperPdf({template,snapshot:{...snapshot,values}});
  const pages=await read(result.bytes),text=pages.flat().map(i=>i.text).join(' ').replace(/\s+/g,' ');
  assert(text.includes(template.body));assert(!text.includes('GHI_CHU'));assert(!text.includes('2098'));assert(!text.includes('1900'));
  assert(text.includes(profile.name));assert(text.includes(profile.studentNumber));assert(text.includes(profile.className));
  assert.equal(pages.length,1);
  if(baseline)assert.deepEqual(pages,baseline,'an internal note must not change any printed text or position');else baseline=pages;
 }
});

test('blank and Word exports keep the same fixed deferral paragraph',()=>{
 for(const blank of [false,true])for(const values of variants){
  const mapped=paperWordValues({template,snapshot:{...snapshot,values},blank});
  const bytes=fillPaperDocx({template,values:mapped});
  const xml=new PizZip(bytes).file('word/document.xml').asText();
  const document=new DOMParser().parseFromString(xml,'application/xml');
  const text=Array.from(document.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main','t')).map(t=>t.textContent).join(' ');
  assert(text.includes(mapped.reason));assert(text.includes('học kỳ này'));assert(!text.includes('GHI_CHU'));assert(!text.includes('2098'));assert(!text.includes('1900'));
 }
});
