import {mkdirSync,writeFileSync} from 'node:fs';

const vars={baseUrl:'http://localhost:3003',typeFourId:'',typeLrId:'',applicationId:'',versionId:'',rowVersion:'',uploadId:'',uploadUrl:'',uploadContentType:'',fileId:'',downloadUrl:'',
  studentCode:'102240377',className:'24T_TEST',issuedOn:'2026-01-01',fileName:'certificate.png',fileContentType:'image/png',fileBytes:'0',filePurpose:'combined',
  negativeApplicationId:'',negativeVersionId:'',negativeRowVersion:''};
const base='{{baseUrl}}/api/certifications';
const version='/applications/{{applicationId}}/versions/{{versionId}}';
const expectStatus=status=>`pm.test('HTTP ${status}', function () { pm.expect(pm.response.code).to.eql(${status}); });`;
const saveApplication=`if (pm.response.code >= 200 && pm.response.code < 300) {
  const data = pm.response.json().data;
  const app = data.application || (data.currentVersion ? data : null);
  const v = app ? app.currentVersion : (data.rowVersion ? data : null);
  if (app) pm.collectionVariables.set('applicationId', app.id);
  if (v) {
    pm.collectionVariables.set('versionId', v.id);
    pm.collectionVariables.set('rowVersion', v.rowVersion);
    const files = (v.files || []).filter(function (file) { return file.status === 'active'; });
    pm.collectionVariables.set('fileId', files.length ? files[files.length - 1].id : '');
  }
  if (data.upload) {
    pm.collectionVariables.set('uploadId', data.upload.id);
    pm.collectionVariables.set('uploadUrl', data.upload.url);
    pm.collectionVariables.set('uploadContentType', data.upload.headers['Content-Type']);
  }
}`;
const guard=keys=>keys.map(key=>`if (!pm.collectionVariables.get('${key}')) throw new Error('Thiếu biến ${key}. Hãy chạy request trước theo thứ tự.');`).join('\n');
const initGuard=guard(['typeFourId'])+`\n['applicationId','versionId','rowVersion','uploadId','uploadUrl','uploadContentType','fileId','downloadUrl'].forEach(function (key) { pm.collectionVariables.unset(key); });`;
function request(name,method,path,{body,status=200,save=false,script='',pre='',match=false,description='',rawUrl=false,binary=false}={}) {
  const headers=[];
  if(body!==undefined)headers.push({key:'Content-Type',value:'application/json'});
  if(binary)headers.push({key:'Content-Type',value:'{{uploadContentType}}'});
  if(match)headers.push({key:'If-Match',value:'"{{rowVersion}}"'});
  const entry={name,request:{method,header:headers,auth:{type:'noauth'},url:rawUrl?path:base+path,description},response:[]};
  if(body!==undefined)entry.request.body={mode:'raw',raw:typeof body==='string'?body:JSON.stringify(body,null,2),options:{raw:{language:'json'}}};
  if(binary)entry.request.body={mode:'file',file:{src:''}};
  const tests=[expectStatus(status),save?saveApplication:'',script].filter(Boolean).join('\n');
  entry.event=[...(pre?[{listen:'prerequest',script:{type:'text/javascript',exec:pre.split('\n')}}]:[]),{listen:'test',script:{type:'text/javascript',exec:tests.split('\n')}}];
  return entry;
}
const fourBody=`{
  "fullName": "Sinh viên kiểm thử Apidog",
  "studentCode": "{{studentCode}}",
  "className": "{{className}}",
  "certificateTypeId": {{typeFourId}},
  "scores": { "lrTotal": 650, "speaking": 130, "writing": 140 },
  "issuedOn": "{{issuedOn}}",
  "notes": "Dữ liệu thử từ Apidog"
}`;
const ids=guard(['applicationId','versionId']);
const mutation=guard(['applicationId','versionId','rowVersion']);
const items=[
  request('00 - Kiểm tra cấu hình backend','GET','/capabilities',{description:'Chạy đầu tiên. Chưa cần auth. r2PrivateConfirmed=false thì test được DB/validation nhưng chưa cấp URL upload.'}),
  request('01 - Đọc danh mục và tự lấy ID nếu đã có','GET','/types?studentCode={{studentCode}}',{script:`if (pm.response.code === 200) pm.response.json().data.forEach(function (type) {
  if (type.code === 'TOEIC_FOUR') pm.collectionVariables.set('typeFourId', type.id);
  if (type.code === 'TOEIC_LR') pm.collectionVariables.set('typeLrId', type.id);
});`,description:'Nếu danh mục đã có TOEIC_FOUR/TOEIC_LR thì bỏ qua request 02/03. Không mặc định ID=1.'}),
  request('02 - Tạo loại TOEIC bốn kỹ năng (chỉ chạy một lần)','POST','/reviewer/types',{status:201,body:{code:'TOEIC_FOUR',displayName:'TOEIC 4 kỹ năng — Nghe, Đọc, Nói, Viết',family:'TOEIC',languageCode:'en',scoreMode:'toeic_four'},script:`if (pm.response.code === 201) pm.collectionVariables.set('typeFourId', pm.response.json().data.id);`,description:'Gửi request này sẽ thêm danh mục vào SQL local. Nếu 409 do mã đã có, chạy lại request 01 để lấy ID.'}),
  request('03 - Tạo loại TOEIC hai kỹ năng để thử quy tắc K24','POST','/reviewer/types',{status:201,body:{code:'TOEIC_LR',displayName:'TOEIC 2 kỹ năng — Nghe, Đọc',family:'TOEIC',languageCode:'en',scoreMode:'toeic_lr'},script:`if (pm.response.code === 201) pm.collectionVariables.set('typeLrId', pm.response.json().data.id);`,description:'Chỉ cần cho test N05/N06. Nếu mã đã có, chạy request 01 thay vì tạo lại.'}),
  request('04 - Tạo hồ sơ nháp K24 TOEIC bốn kỹ năng','POST','/applications',{status:201,body:fourBody,save:true,pre:initGuard,description:'Tạo dữ liệu thử thật trong Studentpage. Script lưu applicationId, versionId, rowVersion. Có thể bỏ request 03 nếu chỉ chạy luồng chính.'}),
  request('05 - Sửa ghi chú bản nháp','PATCH',version,{body:{notes:'Đã cập nhật từ Apidog'},match:true,save:true,pre:mutation,description:'Sau mỗi lần sửa, script thay rowVersion bằng token mới.'}),
  request('06 - Xin presigned URL upload (khai báo đúng fileBytes)','POST',version+'/uploads',{status:201,body:`{
  "purpose": "{{filePurpose}}",
  "fileName": "{{fileName}}",
  "contentType": "{{fileContentType}}",
  "sizeBytes": {{fileBytes}}
}`,match:true,save:true,pre:mutation+`\nconst size = Number(pm.variables.get('fileBytes'));
if (!Number.isSafeInteger(size) || size <= 0) throw new Error('Đặt fileBytes bằng kích thước thực của ảnh, đơn vị byte.');
['uploadId','uploadUrl','uploadContentType'].forEach(function (key) { pm.collectionVariables.unset(key); });`,description:'Set fileBytes/fileName/fileContentType theo đúng ảnh sẽ chọn ở request 07. Mặc định purpose=combined: ảnh phải chứa đủ kết quả bốn kỹ năng. Nếu 503 R2_PRIVATE_REQUIRED, hoàn tất cấu hình private; không tiếp tục dùng URL cũ.'}),
  request('07 - PUT file trực tiếp lên R2: chọn Body binary','PUT','{{uploadUrl}}',{rawUrl:true,binary:true,pre:guard(['uploadUrl','uploadContentType']),description:'Trong Apidog chọn Body → binary và chọn đúng file đã khai ở 06. Giữ Content-Type={{uploadContentType}}. Không multipart, không Bearer, không If-Match, không thêm baseUrl vào URL R2. Gửi trước khi URL hết hạn (mặc định 5 phút).'}),
  request('08 - Báo upload xong, backend kiểm tra ảnh','POST',version+'/uploads/{{uploadId}}/complete',{body:{issuedOn:'{{issuedOn}}'},save:true,pre:guard(['applicationId','versionId','uploadId']),script:`if (pm.response.code === 200) pm.test('Ảnh có thể nộp hoặc chờ chuyên viên xem', function () {
  const app = pm.response.json().data;
  const uploadId = pm.collectionVariables.get('uploadId');
  const file = app.currentVersion.files.find(function (f) { return f.uploadSessionId === uploadId; });
  pm.expect(Boolean(file && file.quality && ['passed','needs_review'].indexOf(file.quality.status) >= 0)).to.eql(true);
});`,description:'HTTP 200 chỉ là xử lý xong; kiểm tra files[].quality.status/reasons. failed thì gỡ file bằng A03 rồi tải lại. needs_review là bình thường khi chưa hiệu chỉnh ngưỡng mờ.'}),
  request('09 - Nộp hồ sơ','POST',version+'/submit',{body:{},match:true,save:true,pre:mutation,description:'Nếu có hai ảnh LR/SW: lặp 06→07→08 với filePurpose=lr rồi sw, chọn lại file/size tương ứng; chỉ chạy 09 khi cả hai file đạt.'}),
  request('10 - Chuyên viên xem hàng đợi','GET','/reviewer/applications?status=submitted&page=1&pageSize=20'),
  request('11 - Chuyên viên xác thực hồ sơ','POST','/reviewer'+version+'/review',{body:{decision:'verified',verificationMethod:'document_comparison',reason:'Xác nhận dữ liệu kiểm thử từ Apidog'},match:true,save:true,pre:mutation,description:'Đây là quyết định của chuyên viên giả lập trong local. Nếu muốn thử bổ sung, dùng A01 thay request này. Sau verified không sửa bản đó.'}),
  request('12 - Xem hồ sơ và lịch sử','GET','/applications/{{applicationId}}',{save:true,pre:guard(['applicationId'])}),
  request('13 - Xin URL xem file có hạn','GET',version+'/files/{{fileId}}/download',{pre:guard(['applicationId','versionId','fileId']),script:`if (pm.response.code === 200) pm.collectionVariables.set('downloadUrl', pm.response.json().data.url);`}),
  request('14 - Xem ảnh từ URL tải có ký','GET','{{downloadUrl}}',{rawUrl:true,pre:guard(['downloadUrl']),description:'Response là ảnh, không phải JSON. URL hết hạn sau 120 giây; chạy lại 13 để lấy URL mới.'}),
  request('A01 - Yêu cầu bổ sung (thay bước 11, trước khi verified)','POST','/reviewer'+version+'/review',{body:{decision:'needs_changes',reason:'Cần tải lại minh chứng rõ hơn.',verificationMethod:'document_comparison'},match:true,save:true,pre:mutation}),
  request('A02 - Tạo phiên bản nháp bổ sung sau A01','POST',version+'/revisions',{status:201,body:{},match:true,save:true,pre:mutation,description:'Script chuyển versionId/rowVersion sang phiên bản mới. Bản mới chưa có file: lặp lại 06→07→08→09. Lịch sử bản cũ giữ nguyên.'}),
  request('A03 - Gỡ file không đạt khỏi bản nháp','DELETE',version+'/files/{{fileId}}',{match:true,save:true,pre:guard(['applicationId','versionId','rowVersion','fileId'])}),
  request('A04 - Hủy phiên upload chưa complete','POST',version+'/uploads/{{uploadId}}/cancel',{body:{},match:true,save:true,pre:guard(['applicationId','versionId','rowVersion','uploadId'])}),
  request('A05 - Đọc lại phiên bản và làm mới rowVersion','GET',version,{save:true,pre:ids}),
  request('N01 - MSSV sai cấu trúc → 400','POST','/applications',{status:400,body:{studentCode:'10223X377'}}),
  request('N02 - Thiếu If-Match → 428','PATCH',version,{status:428,body:{notes:'Không được ghi'},pre:ids}),
  request('N03 - Điểm Nói 210 → 422','POST','/applications',{status:422,body:fourBody.replace('"speaking": 130','"speaking": 210'),pre:guard(['typeFourId'])}),
  request('N04 - Tự gửi role → 400','POST','/applications',{status:400,body:{role:'reviewer'}}),
  request('N05 - Tạo nháp riêng K24 TOEIC hai kỹ năng','POST','/applications',{status:201,body:`{
  "fullName": "Sinh viên kiểm thử quy tắc K24",
  "studentCode": "102240377",
  "className": "24T_TEST",
  "certificateTypeId": {{typeLrId}},
  "scores": { "lrTotal": 650 },
  "issuedOn": "{{issuedOn}}"
}`,pre:guard(['typeLrId']),script:`if (pm.response.code === 201) {
  const d = pm.response.json().data;
  pm.collectionVariables.set('negativeApplicationId', d.id);
  pm.collectionVariables.set('negativeVersionId', d.currentVersion.id);
  pm.collectionVariables.set('negativeRowVersion', d.currentVersion.rowVersion);
}`,description:'Nháp được phép giữ để sửa. Request này dùng ID/token negative riêng, không thay biến hồ sơ chính.'}),
  request('N06 - Nộp K24 TOEIC hai kỹ năng → 422','POST','/applications/{{negativeApplicationId}}/versions/{{negativeVersionId}}/submit',{status:422,body:{},pre:guard(['negativeApplicationId','negativeVersionId','negativeRowVersion']),description:'Kết quả phải nêu từ K24 cần bốn kỹ năng. Không cần file để kiểm tra quy tắc này.'}),
];
items[items.length-1].request.header.push({key:'If-Match',value:'"{{negativeRowVersion}}"'});
const collection={info:{name:'DUT - Certifications Local - Apidog',description:'Import dưới dạng Postman v2.1 vào Apidog, giữ URL đầy đủ. Gửi từng request theo số; chọn file thủ công ở bước 07. Không có auth hoặc secret trong collection. POST tạo dữ liệu thật trong DB local; không tự rollback. R2 cần private trước khi xin URL upload. Hướng dẫn đầy đủ trong docs/CERTIFICATION_DATABASE_TRACE.md, phần Test bằng Apidog.',schema:'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'},auth:{type:'noauth'},variable:Object.entries(vars).map(([key,value])=>({key,value,type:'string'})),item:items};
mkdirSync('docs/collections',{recursive:true});
writeFileSync('docs/collections/certifications.postman_collection.json',JSON.stringify(collection,null,2)+'\n');
console.log(JSON.stringify({requests:items.length,variables:Object.keys(vars).length,file:'docs/collections/certifications.postman_collection.json'}));
