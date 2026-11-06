import {configureWebAuth,getAccessToken,getAuthRevision,restoreWebSession,webAuthFetch,startSsoLogin,passwordWebLogin,getWebSession,logoutWebSession,forgetWebAccessToken} from './web-auth.js';
import {workflowLabels as labels,actions,actionOptions,actionLabels} from './workflow.js';
const $=id=>document.getElementById(id);
const node=(tag,text)=>{const item=document.createElement(tag);if(text!=null)item.textContent=text;return item;};
const formatDate=value=>value?new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Bangkok',dateStyle:'short',timeStyle:'short'}).format(new Date(value)):'—';
let settings,isReviewer=false,form,current=null,page=1,totalPages=1,busy=false;
const token=getAccessToken;
function notice(text,error=false){$('notice').textContent=text;$('notice').className='notice'+(error?' error':'');}
async function request(path,{method='GET',body,rowVersion,html=false,auth=false,cookie=false}={}) {
  if(auth){if(path==='/login')return passwordWebLogin(body.username,body.password);if(path==='/session')return getWebSession();if(path==='/logout')return logoutWebSession();}
  const revision=getAuthRevision();
  const base='/api/academic-leave'+(isReviewer?'/reviewer':'');
  let response;
  try{response=await webAuthFetch(settings.apiBaseUrl+base+path,{method,cache:'no-store',credentials:isReviewer||cookie?'include':'omit',
    signal:AbortSignal.timeout(90000),headers:{Accept:html?'text/html':'application/json',
      ...(body?{'Content-Type':'application/json'}:{}),...(rowVersion?{'If-Match':'"'+rowVersion+'"'}:{})},
    ...(body?{body:JSON.stringify(body)}:{})});}
  catch(error){if(error.status===401){forgetWebAccessToken();current=null;$('detail-card').hidden=true;$('list-card').hidden=true;
    if(isReviewer)$('reviewer-auth').hidden=false;else{$('student-auth').hidden=false;$('login').hidden=false;$('editor').hidden=true;}}
    throw error;}
  if(revision!==getAuthRevision())throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng tải lại trang.');
  if(html&&response.ok)return response.text();
  const result=await response.json().catch(()=>null);
  if(!response.ok||!result?.success){
    if(response.status===401){current=null;$('detail-card').hidden=true;$('list-card').hidden=true;
      if(isReviewer)$('reviewer-auth').hidden=false;
      else{form=null;$('editor').hidden=true;$('login').hidden=false;$('student-name').textContent='Phiên DUT đã hết hạn. Vui lòng đăng nhập lại.';}}
    const error=new Error(result?.message??'API trả HTTP '+response.status);error.status=response.status;throw error;}
  return result.data;
}
async function action(callback){if(busy)return;busy=true;document.querySelectorAll('button').forEach(item=>item.disabled=true);
  try{await callback();}catch(error){notice(error.message,true);}finally{busy=false;document.querySelectorAll('button').forEach(item=>item.disabled=false);controls();}}
function controls(){
  $('fields').disabled=busy||!form||Boolean(current&&!current.canEdit);
  $('new').disabled=busy||!form;
  $('parent').required=$('kind').value!=='leave';$('parent-label').hidden=$('kind').value==='leave';
  $('print').hidden=!current?.canPrint;$('cancel').hidden=isReviewer||!current?.canEdit;
  $('review-form').hidden=!isReviewer||!actions(current).length;
  $('previous').disabled=busy||page<=1;$('next').disabled=busy||page>=totalPages;
}
function info(container,fields){container.replaceChildren();for(const [label,value]of fields){const row=node('div');row.append(node('strong',label+': '),node('span',value??'Chưa có dữ liệu'));container.append(row);}}
function renderPrefill(){const student=form.prefill.student;info($('prefill'),[['Họ tên',student.fullName],['MSSV',student.studentCode],['Ngày sinh',student.birthday],['CCCD',student.cccd],['Điện thoại',student.phoneNumber],['Lớp',student.className]]);}
async function loadForm(){form=await request('/form');
  $('semester').replaceChildren(...form.semesters.map(item=>{const option=node('option',item.label);option.value=item.code;option.selected=item.position==='current';return option;}));
  $('reason').replaceChildren(node('option','Chọn lý do'),...form.reasons.map(item=>{const option=node('option',item.label);option.value=item.code;return option;}));$('reason').firstChild.value='';
  parentOptions();
  renderPrefill();$('editor').hidden=false;controls();}
function parentOptions(){const selected=$('parent').value;
  const parents=$('kind').value==='return'?(form.eligibleReturns??[]):form.eligibleParents;
  $('parent').replaceChildren(node('option','Chọn đơn trước'),...parents.map(item=>{const option=node('option',item.requestCode+' · đến '+item.endSemester.label);option.value=String(item.id);return option;}));
  $('parent').firstChild.value='';$('parent').value=selected;}
function period(){const kind=$('kind').value,returning=kind==='return';
  $('parent-label').hidden=kind==='leave';$('parent').required=kind!=='leave';
  $('semester').value=form.semesters.find(item=>item.position==='current').code;$('semester').disabled=true;
  $('reason').required=!returning;$('reason').disabled=returning;
  const previous=Number($('semester-count').value),max=returning?0:$('reason').value==='military'?4:1;
  $('semester-count').replaceChildren(...Array.from({length:returning?1:max},(_,i)=>{const count=returning?0:i+1;
    const option=node('option',returning?'Không có thời lượng ngừng học':count+' học kỳ');option.value=String(count);return option;}));
  $('semester-count').value=String(returning?0:Math.max(1,Math.min(previous||1,max)));$('semester-count').disabled=returning;
  $('period-hint').textContent=returning?'Chọn đơn ngừng học/gia hạn gần nhất trong lịch sử để trở lại học kỳ hiện tại.':
    kind==='extension'?'Chỉ gia hạn ở kỳ nối tiếp từ đơn trước đã hậu kiểm thành công.':'Ngừng học trong kỳ hiện tại, mỗi lần 1 kỳ; nghĩa vụ quân sự tối đa 4 kỳ.';}
function data(){const returning=$('kind').value==='return';return{kind:$('kind').value,parentApplicationId:$('kind').value!=='leave'?Number($('parent').value)||null:null,
  ...(!returning?{reasonCode:$('reason').value}:{}),startSemesterCode:$('semester').value,semesterCount:returning?0:Number($('semester-count').value),content:$('content').value.trim()};}
function renderDetail(row){current=row;$('detail-card').hidden=false;
  $('history-events').replaceChildren();
  info($('detail'),[['Mã đơn',row.requestCode],['Loại đơn',row.kind==='return'?'Trở lại học':row.kind==='extension'?'Gia hạn ngừng học':'Ngừng học'],['MSSV',row.studentCode],
    ['Trạng thái',labels[row.status]],['Bắt đầu',row.startSemester.label],['Số kỳ',row.semesterCount],['Đến hết',row.endSemester?.label??'—'],
    ['Lý do',row.reasonLabel],['Nội dung bổ sung',row.content||'—'],['SV xác nhận lập đơn',formatDate(row.studentConfirmedAt)],
    ['Chuyên viên xử lí gần nhất',row.reviewerName||'—'],['Lí do / ghi chú',row.reviewNote||'—'],['Đã tiếp nhận lúc',formatDate(row.receivedAt)],
    ['Thời gian hẹn nhận bản giấy',formatDate(row.appointmentAt)],['Đang xử lí từ',formatDate(row.paperReceivedAt)],['Hoàn tất hậu kiểm lúc',formatDate(row.completedAt)]]);
  if(row.snapshot){const student=row.snapshot.student;const identity=node('div');identity.className='info-grid';
    info(identity,[['Họ tên',student.fullName],['Ngày sinh',student.birthday],['CCCD',student.cccd],['Điện thoại',student.phoneNumber],['Lớp',student.className]]);$('detail').append(identity);
    const table=node('table'),head=node('tr');['Học kỳ','Tín chỉ','Điểm TBC học tập','Điểm RL'].forEach(label=>head.append(node('th',label)));table.append(head);
    row.snapshot.academicRows.forEach(item=>{const line=node('tr');[item.semester,item.credits,item.gpa,item.conduct].forEach(value=>line.append(node('td',value??'—')));table.append(line);});
    const wrap=node('div');wrap.className='table-wrap';wrap.append(table);$('detail').append(wrap);
  }
  if(!isReviewer&&form){$('kind').value=row.kind;parentOptions();$('parent').value=String(row.parentApplicationId??'');
    if(row.parentApplicationId&&!Array.from($('parent').options).some(option=>option.value===String(row.parentApplicationId))){const option=node('option','Đơn trước #'+row.parentApplicationId);option.value=String(row.parentApplicationId);$('parent').append(option);$('parent').value=option.value;}
    $('reason').value=row.reasonCode;period();$('semester-count').value=String(row.semesterCount);$('content').value=row.content;
    if(!form.semesters.some(item=>item.code===row.startSemesterCode)){const option=node('option',row.startSemester.label+' (cần chọn lại khi bổ sung)');option.value=row.startSemesterCode;$('semester').append(option);}
    $('semester').value=row.startSemesterCode;$('parent-label').hidden=row.kind==='leave';$('semester').disabled=true;
  }
  $('review-note').value='';actionOptions($('decision'),row);$('review-note').required=['failed','rejected','needs_changes'].includes($('decision').value);controls();
}
async function reload(){const query=new URLSearchParams({page:String(page)});if($('status').value)query.set('status',$('status').value);
  const result=await request('/applications?'+query);totalPages=Math.max(1,Math.ceil(result.totalRecords/result.pageSize));
  $('applications').replaceChildren();if(!result.items.length)$('applications').append(node('p','Chưa có đơn ở trạng thái này.'));
  for(const row of result.items){const line=node('div');line.className='history-row';const text=node('div');text.append(node('strong',row.requestCode+' · '+row.studentCode),
    node('p',(row.kind==='return'?'Trở lại học':row.kind==='extension'?'Gia hạn':'Ngừng học')+' · '+row.semesterCount+' kỳ · '+labels[row.status]));
    const open=node('button','Chi tiết');open.className='secondary';open.onclick=()=>action(async()=>{renderDetail(await request('/applications/'+row.id));});line.append(text,open);$('applications').append(line);}
  $('paging').textContent='Trang '+page+'/'+totalPages+' · '+result.totalRecords+' đơn';$('list-card').hidden=false;controls();}
async function save({reloadList=true}={}){if(!$('application-form').reportValidity())throw new Error('Điền đủ các lựa chọn trước khi lưu.');
  const row=await request('/applications'+(current?'/'+current.id:''),{method:current?'PUT':'POST',body:data(),rowVersion:current?.rowVersion});
  renderDetail(row);if(reloadList)await reload();notice('Đã lưu bản nháp. Bấm Xác nhận lập đơn và in để gửi chuyên viên.');return row;}
async function printRow(windowRef,row){
  if(!windowRef){notice('Trình duyệt đang chặn cửa sổ in. Cho phép popup rồi bấm In đơn.',true);return;}
  const access=await request('/print-session',{method:'POST',body:{MADN:row.requestCode},cookie:true});
  windowRef.location.replace(new URL(access.url,settings.apiBaseUrl).href);}
function printWindow(){const popup=window.open('about:blank','_blank');if(popup){popup.opener=null;popup.document.body.textContent='Đang chuẩn bị đơn để in…';}return popup;}
$('application-form').onsubmit=event=>{event.preventDefault();action(save);};
$('confirm').onclick=()=>{if(busy||!$('application-form').reportValidity())return;const popup=printWindow();action(async()=>{
  try{const draft=await save({reloadList:false});const row=await request('/applications/'+draft.id+'/confirm',{method:'POST',body:{},rowVersion:draft.rowVersion});
    renderDetail(row);reload().catch(error=>notice(error.message,true));notice('Đã xác nhận lập đơn và gửi chuyên viên. PDF được mở trong tab mới để tải hoặc in.');await printRow(popup,row);
  }catch(error){if(popup)popup.document.body.textContent=error.message;throw error;}
});};
$('print').onclick=()=>{if(busy||!current)return;const popup=printWindow();action(async()=>{try{await printRow(popup,current);}catch(error){if(popup)popup.document.body.textContent=error.message;throw error;}});};
$('new').onclick=()=>action(async()=>{current=null;await loadForm();$('application-form').reset();$('semester').value=form.semesters.find(item=>item.position==='current').code;$('detail-card').hidden=true;period();controls();});
$('cancel').onclick=()=>action(async()=>{renderDetail(await request('/applications/'+current.id+'/cancel',{method:'POST',body:{},rowVersion:current.rowVersion}));await reload();notice('Đã hủy bản nháp.');});
$('review-form').onsubmit=event=>{event.preventDefault();action(async()=>{renderDetail(await request('/applications/'+current.id+'/review',{method:'POST',rowVersion:current.rowVersion,
  body:{decision:$('decision').value,note:$('review-note').value.trim()}}));await reload();notice(current.status==='received'?'Đã tiếp nhận. Thời gian hẹn nhận bản giấy: '+formatDate(current.appointmentAt):'Đã lưu: '+labels[current.status]);});};
$('decision').onchange=()=>{$('review-note').required=['failed','rejected','needs_changes'].includes($('decision').value);};
$('kind').onchange=()=>{parentOptions();period();};$('parent').onchange=period;$('reason').onchange=period;
$('history').onclick=()=>action(async()=>{const events=await request('/applications/'+current.id+'/history');
  const names={...actionLabels,migrated:'Dữ liệu trước nâng cấp',created:'Lập nháp',updated:'Sửa đơn',confirmed:'Sinh viên xác nhận',reviewed:'Xét duyệt cũ',paper_received:'Nhận giấy (cũ)',cancelled:'Hủy đơn'};
  $('history-events').replaceChildren(node('h3','Lịch sử xử lý'));
  for(const event of events.items)$('history-events').append(node('p',formatDate(event.createdAt)+' · '+(names[event.action]??event.action)+' · '+labels[event.status]+(event.actorName?' · '+event.actorName:'')));
  $('history-events').append(node('p','Hiển thị '+events.items.length+'/'+events.totalRecords+' mốc mới nhất.'));});
$('reload').onclick=()=>action(async()=>{await reload();if(current)renderDetail(await request('/applications/'+current.id));});
$('status').onchange=()=>action(async()=>{page=1;await reload();});
$('previous').onclick=()=>action(async()=>{if(page>1){page--;await reload();}});$('next').onclick=()=>action(async()=>{if(page<totalPages){page++;await reload();}});
$('login').onclick=()=>startSsoLogin('/academic-leave.html');
$('login-form').onsubmit=event=>{event.preventDefault();action(async()=>{await request('/login',{auth:true,method:'POST',body:{username:$('username').value,password:$('password').value}});
  $('password').value='';$('reviewer-auth').hidden=true;await reload();notice('Đã đăng nhập chuyên viên.');});};
async function start(){settings=await(await fetch('/test-config.json',{cache:'no-store'})).json();isReviewer=settings.mode==='reviewer';
  configureWebAuth(settings,isReviewer?'admin':'student');
  if(isReviewer)$('reviewer-auth').hidden=false;else $('student-auth').hidden=false;
  const authError=sessionStorage.getItem('certification.authError');sessionStorage.removeItem('certification.authError');
  await restoreWebSession();
  if(isReviewer){$('title').textContent='Xét duyệt đơn ngừng học và gia hạn';$('status').value='submitted';
    try{await request('/session',{auth:true});await reload();notice('Chọn đơn để xét duyệt hoặc nhận bản giấy.');}catch(error){if(error.status===401){$('reviewer-auth').hidden=false;notice('Đăng nhập chuyên viên để xử lý đơn.');}else throw error;}}
  else{$('student-auth').hidden=false;$('student-name').textContent=token()?'Đang dùng phiên DUT SSO của tab này.':'Đăng nhập để lấy dữ liệu lập đơn.';$('login').hidden=Boolean(token());
    if(!token()){notice(authError||'Đăng nhập DUT SSO để lập đơn.',Boolean(authError));return;}
    $('editor').hidden=false;$('prefill').textContent='Đang tải thông tin cá nhân và học kỳ…';controls();
    const [formResult,listResult]=await Promise.allSettled([loadForm(),reload()]);
    if(formResult.status==='rejected')throw formResult.reason;
    period();notice(listResult.status==='rejected'?listResult.reason.message:'Chọn kỳ bắt đầu, số kỳ và lý do. Thống kê học tập chỉ được lấy khi xác nhận và in đơn.',listResult.status==='rejected');}}
start().catch(error=>notice(error.message,true));
