import { validateEvidenceFiles, evidenceContentType } from './image-validation.js';

// Browser File supplies name/type/size and bytes; users never enter upload metadata.
export function buildApplicationPayload({data,files,applicationId = null,contentTypes}) {
  if (files.length !== 1) throw new Error('Chọn đúng một file minh chứng.');
  return {...(applicationId ? {applicationId} : {}),data,
    files:files.map((file,index) => ({purpose:'general',fileName:file.name,contentType:contentTypes?.[index] ?? evidenceContentType(file),sizeBytes:file.size}))};
}

export function putFile(upload,file,onProgress = () => {}) {
  return new Promise((resolve,reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT',upload.url);
    // This request goes to R2: no backend Authorization header or credentials.
    for (const [key,value] of Object.entries(upload.headers)) xhr.setRequestHeader(key,value);
    xhr.timeout=180000;
    xhr.upload.onprogress = event => {if (event.lengthComputable) onProgress(event.loaded/event.total);};
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve()
      : reject(new Error('Upload ảnh thất bại (HTTP '+xhr.status+'). Bấm Nộp hồ sơ để xin URL mới và thử lại.'));
    xhr.onerror = () => reject(new Error('Không upload được ảnh. Kiểm tra kết nối và CORS của bucket R2 cho '+location.origin+'.'));
    xhr.ontimeout = () => reject(new Error('Upload ảnh quá thời gian. Bấm Nộp hồ sơ để thử lại.'));
    xhr.send(file);
  });
}

export async function submitStudentApplication({api,data,files,applicationId,limits,
  validateFiles = validateEvidenceFiles,upload = putFile,onPrepared = () => {},onProgress = () => {}}) {
  onProgress('Đang kiểm tra ảnh trên thiết bị…',0);
  const contentTypes=await validateFiles(files,limits);
  const body=buildApplicationPayload({data,files,applicationId,contentTypes});
  onProgress('Đang chuẩn bị hồ sơ…',0);
  const prepared = await api('/applications',{method:'POST',body});
  onPrepared(prepared.applicationId);
  if (prepared.uploads.length !== files.length) throw new Error('Số URL upload không khớp số ảnh đã chọn.');
  await upload(prepared.uploads[0],files[0],ratio => onProgress('Đang tải file minh chứng…',Math.round(5+85*ratio)));
  onProgress('Đang xác nhận minh chứng và nộp hồ sơ…',95);
  const application = await api('/applications/'+prepared.applicationId+'/complete',{method:'POST',body:{}});
  onProgress('Đã nộp hồ sơ, đang chờ chuyên viên xét duyệt.',100);
  return application;
}
