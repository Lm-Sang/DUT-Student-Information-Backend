import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {historyTerm,paperWordValues,paperTemplates,renderPaperPdf} from '../services/paper-pdf.renderer.js';

const profile={name:'Nguyễn Văn Kiểm Thử',className:'23T_KT1',studentNumber:'000000001',phone:'0900000000',identityNumber:'000000000001',dateOfBirth:'01/01/2004',programName:'Công nghệ thông tin K2023 Đặc thù'};
function snapshot(count){return {createdAt:'2026-10-27T03:00:00Z',profile:{...profile,semesterResults:Array.from({length:count},(_,i)=>({termName:`Học kỳ ${i%2+1} năm học ${2023+Math.floor(i/2)}-${2024+Math.floor(i/2)}`,credits:18+i,gpa:3.7,cumulativeGpa:3.6,conductScore:85}))},values:{programName:'ĐH_Kỹ thuật Cơ điện tử',startTerm:'Học kỳ 2 năm học 2026-2027',withdrawalReason:'Nguyện vọng cá nhân',reasonDetail:''}};}

test('history terms use the school notation without inventing a year or changing summer terms',()=>{
 for(const [input,expected] of [
  ['Học kỳ 1 năm học 2023-2024','1 /2023 - 2024'],
  ['Học kỳ 2 năm học 2024 - 2025','2 /2024 - 2025'],
  ['1 / 2023-2024','1 /2023 - 2024'],
  ['1 /2023 - 2024','1 /2023 - 2024'],
  ['Học kỳ hè năm học 2023–2024','hè /2023 - 2024'],
  ['2421','2421'],['Học kỳ bổ sung','Học kỳ bổ sung'],[null,'']
 ])assert.equal(historyTerm(input),expected);
});

test('history values match original decimal precision and keep blank/missing and zero distinct',()=>{
 const template=paperTemplates.find(t=>t.code==='DonSV07');
 const input=snapshot(1);input.profile.semesterResults.push({termName:'2 /2023-2024',credits:0,gpa:null,cumulativeGpa:0,conductScore:0});
 const values=paperWordValues({template,snapshot:input});
 assert.equal(values.history_0_termName,'1 /2023 - 2024');
 assert.equal(values.history_0_credits,'18.00');assert.equal(values.history_0_gpa,'3.70');assert.equal(values.history_0_cumulativeGpa,'3.60');assert.equal(values.history_0_conductScore,'85.0');
 assert.equal(values.history_1_credits,'0.00');assert.equal(values.history_1_gpa,'');assert.equal(values.history_1_cumulativeGpa,'0.00');assert.equal(values.history_1_conductScore,'0.0');assert.equal(values.history_2_credits,'');
 assert.equal(values.startTerm,input.values.startTerm,'the separate Kể từ paragraph keeps the source wording');
});

test('withdrawal and second-program history stays compact, centred and inside its source columns',async()=>{
 for(const code of ['DonSV06','DonSV07'])for(const count of [7,10]){
  const template=paperTemplates.find(t=>t.code===code),input=snapshot(count);
  const layout=JSON.parse(readFileSync(new URL(`../../../../assets/request-forms/layouts/${code}-${template.slug}.json`,import.meta.url)));
  const rowFields=layout.fields.filter(f=>f.text.startsWith('{{history_0_')).sort((a,b)=>a.left-b.left);
  const result=await renderPaperPdf({template,snapshot:input});
  assert.equal(result.pageCount,code==='DonSV06'?2:1,`${code}, ${count} rows: unnecessary overflow`);
  const task=getDocument({data:new Uint8Array(result.bytes),useSystemFonts:true});
  try{
   const doc=await task.promise,page=await doc.getPage(1),items=(await page.getTextContent()).items;
   const name=items.find(i=>i.str===profile.name);assert(name,'a name that fits before the next label must stay on one line');
   const values=paperWordValues({template,snapshot:input});
   for(let i=0;i<count;i++){
    const term=items.find(item=>item.str===values[`history_${i}_termName`]);assert(term,`missing compact term ${i}`);
    const row=items.filter(item=>Math.abs(item.transform[5]-term.transform[5])<0.2&&item.str.trim()).sort((a,b)=>a.transform[4]-b.transform[4]);
    assert.equal(row.length,6,`row ${i} must have six separate, single-line cells`);
    const keys=['index','termName','credits','gpa','cumulativeGpa','conductScore'];
    for(let col=0;col<row.length;col++){
     const item=row[col],field=rowFields[col];
     assert.equal(item.str,String(values[`history_${i}_${keys[col]}`]));
     assert(item.transform[4]>=field.left-0.25&&item.transform[4]+item.width<=field.right+0.25,'text crosses a column border');
     assert(Math.abs(item.transform[4]+item.width/2-(field.left+field.right)/2)<0.3,'cell is not centred');
     assert(item.height>=11,'original font size must remain readable');
    }
    if(i){const previous=items.find(item=>item.str===values[`history_${i-1}_termName`]);assert(Math.abs(previous.transform[5]-term.transform[5]-15.96)<0.3,'short terms must keep the original row height');}
   }
  }finally{await task.destroy();}
 }
});
