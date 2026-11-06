import {readFileSync,writeFileSync} from 'node:fs';
const path='docs/CERTIFICATIONS_API.md';
const previous=readFileSync(path,'utf8');
const start=previous.indexOf('## Chứng chỉ tin học');
if(start<0)throw new Error('Missing original IT section');
writeFileSync(path,previous.slice(0,start)+readFileSync('.data/it-certifications-doc.md','utf8').replace(/^\uFEFF/,''));
const collectionPath='docs/data/certifications.postman_collection.json';
const collection=JSON.parse(readFileSync(collectionPath,'utf8'));
collection.info.description=collection.info.description.replace(/Tin học dùng base[\s\S]*$/,
 'Tin học dùng /api/it-certifications, catalog tmCNTTChungChi và data giữ nguyên cột tmCNTTChungChi_SV; bắt buộc CoSoCapCC.');
const removed=new Set(['itFullName','itClassName','itBirthDate','itTheoryScore','itPracticalScore','itExamSession']);
collection.variable=collection.variable.filter(v=>!removed.has(v.key));
for(const [key,value]of Object.entries({itMaCC:'CNTT01',itCoSoCapCC:'Trường Đại học Bách khoa',itSoHieu:'SH-001',itSoVaoSo:'VS-001',itNgayCC:'2026-10-01'}))
 collection.variable.push({key,value,type:'string'});
const studentGroup=collection.item.find(g=>g.name.startsWith('04 -'));
studentGroup.item[0].name='01 - Đọc danh mục gốc và form chứng chỉ tin học';
studentGroup.item[0].event[0].script.exec=[
 "if (pm.response.code === 200) {",
 "  const data = pm.response.json().data;",
 "  pm.collectionVariables.set('itStudentCode', data.student.studentCode);",
 "  const first = data.catalog.find(item => item.MaCC);",
 "  if (first) pm.collectionVariables.set('itMaCC', first.MaCC);",
 "}"];
const prepare=studentGroup.item[1];
prepare.request.body.raw=JSON.stringify({data:{MaHS:'{{itStudentCode}}',MaCC:'{{itMaCC}}',
 SoHieu:'{{itSoHieu}}',SoVaoSo:'{{itSoVaoSo}}',SoNgayQD:null,GhiChu:null,
 CoSoCapCC:'{{itCoSoCapCC}}',NgayCC:'{{itNgayCC}}',MaHS_SoVaoSo:null},
 files:[{purpose:'general',fileName:'{{fileName}}',contentType:'{{fileContentType}}',sizeBytes:'__FILE_BYTES__'}]},null,2)
 .replace('"__FILE_BYTES__"','{{fileBytes}}');
prepare.request.description='Nhập đúng cột DB gốc; MaHS khớp MSSV đăng nhập, MaCC từ catalog, CoSoCapCC bắt buộc. Xóa itApplicationId để tạo mới; giữ ID để tiếp tục upload/bổ sung.';
for(const [group,reviewer] of [[studentGroup,false],[collection.item.find(g=>g.name.startsWith('05 -')),true]]) {
 group.item.push({name:'Đọc chứng chỉ gốc (gồm dữ liệu import chưa có file)',request:{method:'GET',
  url:'{{baseUrl}}/api/it-certifications/'+(reviewer?'reviewer/':'')+'records?page=1&pageSize=20',
  auth:structuredClone(group.item[0].request.auth),header:[]}});
}
writeFileSync(collectionPath,JSON.stringify(collection,null,2)+'\n');
