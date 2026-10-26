export const isItPage = search => new URLSearchParams(search).get('kind') === 'it';
export const certificateApiBase = isIt => isIt ? '/api/it-certifications' : '/api/certifications';
export const itFields = [
  {key:'SoHieu',label:'Số hiệu'}, {key:'CoSoCapCC',label:'Cơ sở cấp chứng chỉ'},
  {key:'SoVaoSo',label:'Số vào sổ'}, {key:'MaCC',label:'Tên chứng chỉ'}, {key:'NgayCC',label:'Ngày cấp'},
];

// Give the existing student/reviewer screens a common view without changing either API contract.
export function certificateView(application, isIt, catalog = []) {
  if (!isIt) return application;
  const source = application.pendingSubmission ?? application.currentSubmission;
  const data = source?.data ?? {};
  const name = source?.certificateTypeName ?? catalog.find(type => type.MaCC === data.MaCC)?.TenCC ?? data.MaCC ?? 'Chứng chỉ tin học';
  return {...application, certificateTypeId:data.MaCC, data, result:data, issuedOn:data.NgayCC ?? null, notes:null,
    files:source?.files ?? [], submittedAt:source?.submittedAt ?? null, processing:source?.processing ?? false,
    review:application.currentSubmission?.review ?? source?.review ?? null,
    catalogSnapshot:{type:{displayName:name,formSchema:{fields:itFields.map(field => field.key === 'MaCC'
      ? {...field,options:[{value:data.MaCC,label:name}]} : field)}}}};
}
