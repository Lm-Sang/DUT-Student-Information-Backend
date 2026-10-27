import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mapSchoolAcademics,academicTermCode} from '../domain/student-academics.js';
import {createSchoolAcademicsReader} from '../repositories/school-academics.repository.js';
import {paperWordValues,paperTemplates,scholarshipReasonPrefix,scholarshipReason,renderPaperPdf} from '../services/paper-pdf.renderer.js';
import {createPaperFilesService} from '../services/paper-files.service.js';
import {paperFontFamily} from '../services/paper-fonts.js';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {mottoUnderline} from '../services/paper-layout.renderer.js';
import {readFileSync} from 'node:fs';
const term={IDCode:'252',HPDangky:21,SoTCHoclai:0,DiemTBHB:8.75,DiemTBHT:3.7,DiemTBTL:3.6,DiemRL:85,CourseCount:7,GradedCount:7,LowGradeCount:0};
test('academic mapping keeps grade scales, explicit zeros and exact term codes',()=>{
 const p=mapSchoolAcademics({summary:[{SoTC:150,HPTichluy:110,DiemTBTL:3.6,DiemRL:85}],terms:[term,{IDCode:'261'}],catalog:[{IDCode:'2520',ID:1,TenKH:'Học kỳ 2 năm học 2025-2026'},{IDCode:'2610',ID:2}]});
 assert.deepEqual(p.academic,{requiredCredits:150,earnedCredits:110,cumulativeGpa:3.6,conductAverage:85});
 assert.equal(p.semesterResults[0].termCode,'2520');assert.equal(p.semesterResults[0].repeatedCredits,0);assert.equal(p.semesterResults[0].scholarshipAverage,8.75);assert.equal(p.semesterResults[0].gpa,3.7);assert.equal(p.semesterResults[1].gpa,null);
 assert.equal(academicTermCode('2521'),'2521');assert.equal(academicTermCode('253'),'253');
});
test('duplicate terms/summaries fail closed and incomplete grades are not reported as no low grades',()=>{
 assert.throws(()=>mapSchoolAcademics({terms:[term,{...term,IDCode:'2520'}]}),e=>e.statusCode===409);
 assert.throws(()=>mapSchoolAcademics({summary:[{},{}]}),e=>e.statusCode===409);
 assert.equal(mapSchoolAcademics({terms:[{...term,GradedCount:6}]}).semesterResults[0].hasLowGrade,null);
 assert.equal(mapSchoolAcademics({terms:[{...term,GradedCount:6,LowGradeCount:1}]}).semesterResults[0].hasLowGrade,'Có');
 assert.equal(mapSchoolAcademics({terms:[{...term,DiemTBHT:8.75}]}).semesterResults[0].gpa,null);
});
test('academic reader uses SELECT only and requires the same student number and school ID',async()=>{
 let identities=[{MaHS:'qa',SoTheSV:'000000001'}];
 const read=createSchoolAcademicsReader({connect:async(account,db)=>{assert.equal(account,'secondary');assert.equal(db,'tmProxDUT');const r={input:()=>r,query:async sql=>{assert(!/\b(INSERT|UPDATE|DELETE|MERGE|EXEC)\b/i.test(sql));return{recordsets:[identities,[],[term],[]]};}};return{request:()=>r};}});
 assert.equal((await read({MaHS:'qa',SoTheSV:'000000001'})).semesterResults.length,1);
 for(const bad of [[{MaHS:'other',SoTheSV:'000000001'}],[],[...identities,...identities]]){identities=bad;await assert.rejects(()=>read({MaHS:'qa',SoTheSV:'000000001'}),e=>e.details.code==='STUDENT_PROFILE_MISMATCH');}
});
test('scholarship fixed text remains for blank, new and older full-paragraph requests without duplication',()=>{
 assert.equal(scholarshipReason('được miễn một số học phần'),scholarshipReasonPrefix+' được miễn một số học phần');
 assert.equal(scholarshipReason(scholarshipReasonPrefix+' lý do cũ'),scholarshipReasonPrefix+' lý do cũ');
 const template=paperTemplates.find(t=>t.code==='DonSV05');assert(paperWordValues({template,blank:true}).reason.startsWith(scholarshipReasonPrefix));
 const v=paperWordValues({template,snapshot:{createdAt:'2026-10-26',values:{reason:'lý do thử'},scholarship:{repeatedCredits:0,gpa:3.7}}});assert.equal(v.scholarship_repeatedCredits,0);assert.equal(v.scholarship_gpa,3.7);assert.equal(v.scholarship_credits,'Chưa có');
});
test('PDF service selects the requested semester and never substitutes latest results',async()=>{
 const row={Id:'qa',Status:'SUBMITTED',TypeCode:'DonSV05',StudentId:'student',StudentNumber:'000000001',Version:1,Payload:{reviewTerm:'2610'},CreatedAt:'2026-10-26'};
 const service=createPaperFilesService({get:async()=>row,catalogs:async()=>({programs:[],terms:[]})},{loadProfile:async()=>({name:'QA',studentNumber:'000000001',semesterResults:[{termCode:'2520',gpa:3.7}]}),renderer:async({snapshot})=>{assert.deepEqual(snapshot.scholarship,{});return{bytes:Buffer.from('%PDF-QA')};}});
 await service.download({role:'STUDENT',id:'student'},'qa');
});
test('school font is embedded with real Times New Roman on Windows',async()=>{
 if(process.platform!=='win32')return;
 assert.equal(paperFontFamily,'Times New Roman');
 const result=await renderPaperPdf({template:paperTemplates.find(t=>t.code==='DonSV05'),snapshot:{createdAt:'2026-10-26',profile:{name:'Sinh viên kiểm thử'},values:{reason:'lý do kiểm thử'}}});
 assert.match(result.bytes.toString('latin1'),/TimesNewRomanPS/);assert(!result.bytes.toString('latin1').includes('Tinos'));
});
test('wrapped personal rows move semester history below the header while keeping the original text size',async()=>{
 const template=paperTemplates.find(t=>t.code==='DonSV07');
 const file=await renderPaperPdf({template,snapshot:{createdAt:'2026-10-26',profile:{name:'Nguyễn Văn Kiểm Thử Rất Dài',studentNumber:'000000001',semesterResults:[{termName:'Kỳ kiểm thử',credits:123,gpa:3.5,cumulativeGpa:3.4,conductScore:85}]},values:{startTerm:'Kỳ kiểm thử',programName:'Ngành kiểm thử'}}});
 const task=getDocument({data:new Uint8Array(file.bytes),useSystemFonts:true});
 try{const pdf=await task.promise,items=(await(await pdf.getPage(1)).getTextContent()).items;const header=items.find(i=>i.str==='Số tín chỉ'),row=items.find(i=>i.str==='123.00');assert(header&&row);assert(header.transform[5]-row.transform[5]>12);assert(row.height>=11);assert(items.some(i=>i.str.includes('Rất Dài')));}finally{await task.destroy();}
});
test('current registered program replaces admission data and missing names never revert to the old program',async()=>{
 const identity={MaHS:'qa',SoTheSV:'000000001',MaNganh:'REGISTERED',MaNganh2:'SECOND',ProgramName:'CTĐT hiện tại'};
 const read=createSchoolAcademicsReader({connect:async()=>{const r={input:()=>r,query:async statement=>{assert.match(statement,/WHERE MaNganh=h\.MaNganh/);assert(!/MaNganh2/.test(statement));return{recordsets:[[identity],[],[],[]]};}};return{request:()=>r};}});
 assert.equal((await read(identity)).ProgramName,'CTĐT hiện tại');
 identity.ProgramName=null;assert.equal((await read(identity)).ProgramName,'');
});
test('motto rule is 0.45 pt in all seven forms and unrelated table/receipt rules are unchanged',()=>{
 for(const template of paperTemplates)for(const suffix of template.code==='DonSV01'?['','-thay-doi-thong-tin']:['']){
  const layout=JSON.parse(readFileSync(new URL('../../../../assets/request-forms/layouts/'+template.code+'-'+template.slug+suffix+'.json',import.meta.url)));
  let thinned=0;
  for(const page of layout.pages)for(const rect of page.rects){const result=mottoUnderline(page,rect);if(result!==rect){assert.equal(result[3],0.45);assert.equal(result[0],rect[0]);assert.equal(result[2],rect[2]);thinned++;}else assert.deepEqual(result,rect);}
  assert(thinned>0,template.code);
 }
});
