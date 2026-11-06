export const workflowLabels={uploading:'Chưa nộp',draft:'Bản nháp',submitted:'Chờ chuyên viên tiếp nhận',received:'Đã tiếp nhận',
  processing:'Đang xử lí',verified:'Hậu kiểm thành công',failed:'Hậu kiểm thất bại',rejected:'Đã từ chối',needs_changes:'Cần bổ sung',cancelled:'Đã hủy',
  approved:'Đã duyệt online (dữ liệu cũ)',paper_received:'Đã nhận đơn giấy (dữ liệu cũ)'};
export const actionLabels={received:'Xác nhận đã tiếp nhận',processing:'Chuyển sang đang xử lí',verified:'Hậu kiểm thành công',
  failed:'Hậu kiểm thất bại',rejected:'Từ chối hồ sơ',needs_changes:'Yêu cầu bổ sung'};
export const actions=row=>row?.allowedActions??({submitted:['received','rejected','needs_changes'],received:['processing','rejected','needs_changes'],processing:['verified','failed']}[row?.status]??[]);
export function actionOptions(select,row){select.replaceChildren(...actions(row).map(value=>{
  const option=document.createElement('option');option.value=value;option.textContent=actionLabels[value];return option;
}));}
export function appendWorkflow(container,history){if(!history?.length)return;
  const title=document.createElement('h4');title.textContent='Tiến trình xử lí';container.append(title);
  for(const item of history){const line=document.createElement('p');
    const date=item.reviewedAt?new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Bangkok',dateStyle:'short',timeStyle:'short'}).format(new Date(item.reviewedAt)):'';
    line.textContent=[date,workflowLabels[item.status]??item.status,item.reviewerName,item.reason].filter(Boolean).join(' · ');container.append(line);
  }
}
