import { submitStudentApplication } from './upload.js';
import {isItPage,certificateApiBase,certificateView} from './certificate-view.js';
import {createCertificationRealtime} from './realtime.js';
import {evidenceContentType} from './image-validation.js';
import {configureWebAuth,getAccessToken,getAuthRevision,restoreWebSession,webAuthFetch,startSsoLogin,logoutWebSession,forgetWebAccessToken} from './web-auth.js';

const $ = id => document.getElementById(id);
const isIt=isItPage(location.search),apiBase=certificateApiBase(isIt);
const pendingKey=isIt?'certification.it.pending':'certification.pending';
import {workflowLabels as statusLabels,appendWorkflow} from './workflow.js';
let settings,catalog,busy=false,pendingId=null,activeStatus=null,finished=false;
let previews=[];
let realtime,currentApplicationId=null,livePending=false,liveApplicationId=null,refreshing=false;
let liveTimer=null;
const node=(tag,text,className) => {const item=document.createElement(tag);if(text!=null)item.textContent=text;if(className)item.className=className;return item;};
const token=getAccessToken;
function fillStudentInformation(student) {
  $('full-name').value=student.fullName ?? '';$('class-name').value=student.className ?? '';
  $('student-code').value=student.studentCode ?? '';$('student-cccd').value=student.cccd ?? '';
}
const selectedType=() => catalog?.languages.flatMap(language=>language.types).find(type=>type.id===Number($('certificate-type').value));
function notice(message,kind='info') {$('notice').hidden=!message;$('notice').textContent=message;$('notice').className='notice '+kind;}
function controls() {
  $('form-fields').disabled=busy || !catalog || finished;
  $('login').disabled=busy;$('logout').disabled=busy;$('reload').disabled=busy || !catalog;
  $('submit').disabled=busy || finished || (isIt ? !catalog?.catalog.some(type=>type.MaCC===$('it-MaCC')?.value) : !selectedType()?.eligible);
  $('submit').textContent=busy ? 'Đang nộp…' : activeStatus==='needs_changes' ? 'Nộp bổ sung' : pendingId ? 'Tiếp tục nộp hồ sơ' : 'Nộp hồ sơ';
  $('new-application').hidden=!finished;
  $('new-application').disabled=busy;
}
function clearIdentity() {
  realtime?.stop();clearTimeout(liveTimer);liveTimer=null;currentApplicationId=null;livePending=false;liveApplicationId=null;
  catalog=null;
  pendingId=null;activeStatus=null;finished=false;clearPreviews();
  $('application-form').reset();$('history').replaceChildren();$('application-detail').hidden=true;$('progress').hidden=true;
  $('identity').textContent='Đăng nhập để lấy danh mục theo khóa của bạn.';
  $('login').hidden=false;$('logout').hidden=true;
  controls();
}
async function api(path,{method='GET',body}={}) {
  const requestRevision=getAuthRevision();
  let response;
  try {
    response=await webAuthFetch(settings.apiBaseUrl+apiBase+path,{
      method,cache:'no-store',headers:{Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},
      ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(path.endsWith('/complete')?240000:60000),
    });
  } catch (error) {
    if(error.status===401){forgetWebAccessToken();clearIdentity();throw error;}
    if(error.name==='AbortError')throw error;
    throw new Error('Không kết nối được backend '+settings.apiBaseUrl+'. Kiểm tra npm.cmd start và cấu hình CORS.');
  }
  const result=await response.json().catch(()=>null);
  if(requestRevision!==getAuthRevision())throw new DOMException('Authentication changed.','AbortError');
  if (!response.ok || !result?.success) {
    if (response.status===401) {forgetWebAccessToken();clearIdentity();}
    let message=result?.message || 'Backend trả HTTP '+response.status+'.';
    if (result?.details?.code==='R2_PRIVATE_REQUIRED') message+=' Kiểm tra cấu hình R2 của backend.';
    if (result?.details?.reasons?.length) message+=' '+result.details.reasons.join('; ');
    throw new Error(message);
  }
  return result.data;
}
function renderItFields(values={}) {
  $('it-fields').replaceChildren();
  for(const field of catalog.fields){
    const label=node('label',field.label),input=node(field.type==='select'?'select':'input');
    input.id='it-'+field.key;input.dataset.itKey=field.key;input.required=field.required;
    if(field.maxLength)input.maxLength=field.maxLength;
    if(field.type==='select'){
      const placeholder=node('option','Chọn tên chứng chỉ');placeholder.value='';input.append(placeholder);
      for(const type of catalog.catalog){const option=node('option',type.TenCC??type.MaCC);option.value=type.MaCC;input.append(option);}
      input.onchange=controls;
    }else input.type=field.type;
    input.value=values[field.key]??'';label.append(input);$('it-fields').append(label);
  }
}
function renderResult(values={}) {
  $('result-fields').replaceChildren();
  const type=selectedType();
  $('issuing-organization').replaceChildren();
  const issuerPlaceholder=node('option','Chọn cơ sở cấp chứng chỉ');issuerPlaceholder.value='';$('issuing-organization').append(issuerPlaceholder);
  for(const issuer of type?.issuingOrganizations ?? []) {
    const option=node('option',issuer.displayName);option.value=issuer.id;$('issuing-organization').append(option);
  }
  $('eligibility').textContent=type ? type.eligible ? 'Được tiếp nhận cho khóa '+catalog.cohortYear+'.' : type.eligibilityMessage : '';
  for (const field of type?.formSchema.fields ?? []) {
    const label=node('label',field.label);
    let input;
    if (field.type==='select') {
      input=node('select');
      const placeholder=node('option','Chọn '+field.label.toLowerCase());placeholder.value='';input.append(placeholder);
      for (const option of field.options) {
        const item=node('option',typeof option==='string'?option:option.label);item.value=typeof option==='string'?option:option.value;input.append(item);
      }
    } else {
      input=node('input');input.type='number';input.min=field.min;input.max=field.max;input.step=field.step;
      input.placeholder=field.min+' – '+field.max;
    }
    input.required=field.required;input.dataset.resultKey=field.key;
    if (values[field.key]!=null) input.value=values[field.key];
    label.append(input);$('result-fields').append(label);
  }
  controls();
}
function renderTypes(typeId) {
  const language=catalog?.languages.find(item=>item.id===Number($('language').value));
  $('certificate-type').replaceChildren();
  for (const type of language?.types ?? []) {
    const option=node('option',type.displayName+(type.eligible?'':' · Chưa được tiếp nhận'));option.value=type.id;
    $('certificate-type').append(option);
  }
  if (typeId) $('certificate-type').value=typeId;
  else {
    const eligible=language?.types.find(type=>type.eligible);
    if (eligible) $('certificate-type').value=eligible.id;
  }
  renderResult();
}
async function loadCatalog() {
  const data=await api(isIt?'/form':'/catalog');
  if (!isIt && data.student?.source!=='auth') throw new Error('Backend chưa nhận token DUT SSO. Hãy dừng và chạy lại npm.cmd start sau khi cập nhật code.');
  catalog=data;
  $('identity').textContent=data.student.fullName+' · MSSV '+data.student.studentCode+(isIt?'':' · Khóa '+data.cohortYear);
  $('login').hidden=true;$('logout').hidden=false;
  fillStudentInformation(data.student);
  $('file-hint').textContent='Một file JPG/JPEG/PNG, tối đa '+(data.maxFileBytes/1024/1024)+' MiB. Khi bổ sung, file mới thay file hiện tại trên cùng hồ sơ.';
  if(isIt)renderItFields();
  else{
  $('language').replaceChildren();
  for (const language of data.languages) {const option=node('option',language.displayName);option.value=language.id;$('language').append(option);}
  const available=data.languages.find(language=>language.types.some(type=>type.eligible));
  if (available) $('language').value=available.id;
  renderTypes();
  }
  try {
    const pending=JSON.parse(sessionStorage.getItem(pendingKey)||'null');
    pendingId=pending?.studentCode===data.student.studentCode ? pending.applicationId : null;
    if (!pendingId) sessionStorage.removeItem(pendingKey);
  } catch {sessionStorage.removeItem(pendingKey);pendingId=null;}
  if (pendingId) {
    // Restore the actual form/status, not merely the ID over a new default form.
    let application;
    try {application=await api('/applications/'+pendingId);}
    catch(error) {clearIdentity();throw error;}
    if (['uploading','needs_changes'].includes(application.status)) openApplication(application,false);
    else submitted(application);
  } else notice('Đã đăng nhập. Điền kết quả, chọn ảnh và bấm Nộp hồ sơ.','success');
  controls();
  await reloadHistory();
  realtime.start();
}
function rememberPending(id,status=activeStatus==='needs_changes'?'needs_changes':'uploading') {
  pendingId=id;
  activeStatus=status;
  sessionStorage.setItem(pendingKey,JSON.stringify({applicationId:id,studentCode:catalog.student.studentCode}));
}
function clearPreviews() {for(const url of previews)URL.revokeObjectURL(url);previews=[];$('file-list').replaceChildren();}
function selectedFiles() {
  const files=Array.from($('evidence-files').files);
  if (files.length!==1) throw new Error('Chọn đúng một file minh chứng.');
  for (const file of files) {
    if (!['image/png','image/jpeg'].includes(evidenceContentType(file))) throw new Error(file.name+': chỉ nhận JPG, JPEG hoặc PNG.');
    if (!file.size || file.size>catalog.maxFileBytes) throw new Error(file.name+': dung lượng ảnh vượt giới hạn hoặc file rỗng.');
  }
  return files;
}
function renderFiles() {
  clearPreviews();
  if (!catalog) return;
  try {
    for (const file of selectedFiles()) {
      const item=node('li'),url=URL.createObjectURL(file);previews.push(url);
      const image=node('img');image.src=url;image.alt=file.name;
      const text=node('div');text.append(node('strong',file.name),node('span',new Intl.NumberFormat('vi-VN').format(file.size)+' byte'));
      item.append(image,text);$('file-list').append(item);
    }
    notice('Đã chọn ảnh. Tên file và dung lượng sẽ được lấy tự động.');
  } catch(error) {notice(error.message,'error');}
}
function setProgress(message,percent) {$('progress').hidden=false;$('progress-label').textContent=message;$('progress-bar').value=percent;}
function submitted(application) {
  pendingId=null;activeStatus=application.status;sessionStorage.removeItem(pendingKey);finished=true;
  setProgress(statusLabels[application.status]||'Đã nộp hồ sơ.',100);
  notice('Hồ sơ '+application.id+': '+(statusLabels[application.status]||application.status)+'. Bạn chỉ được bổ sung khi chuyên viên yêu cầu.','success');
  renderApplication(application);controls();
}
async function submit(event) {
  event.preventDefault();if(busy || finished)return;
  try {
    if (!isIt && !selectedType()?.eligible) throw new Error('Loại chứng chỉ chưa được tiếp nhận cho khóa của bạn.');
    const files=selectedFiles(),result={};
    for (const input of $('result-fields').querySelectorAll('[data-result-key]')) {
      if (input.value!=='') result[input.dataset.resultKey]=input.type==='number'?input.valueAsNumber:input.value;
    }
    const data=isIt ? Object.fromEntries(Array.from($('it-fields').querySelectorAll('[data-it-key]'),input=>[input.dataset.itKey,input.value.trim()||null]))
      : {fullName:$('full-name').value.trim(),className:$('class-name').value.trim(),
      certificateTypeId:Number($('certificate-type').value),issuingOrganizationId:Number($('issuing-organization').value),
      issuedOn:$('issued-on').value,result,notes:$('notes').value.trim()||null};
    busy=true;controls();notice('Đang gửi hồ sơ. Giữ trang này mở cho đến khi hoàn tất.');
    const application=await submitStudentApplication({api,data,files,applicationId:pendingId,
      limits:{maxFiles:catalog.maxFiles,maxFileBytes:catalog.maxFileBytes,...catalog.imageValidation},
      onPrepared:rememberPending,onProgress:setProgress});
    submitted(application);
  } catch(error) {
    // If completion committed but its response was lost, show the existing submission.
    let completed;
    if (pendingId && token()) {
      try {const app=await api('/applications/'+pendingId);if(['submitted','received','processing','verified','failed','rejected'].includes(app.status))completed=app;}catch{}
    }
    if (completed) submitted(completed);
    else notice(error.message,'error');
  } finally {
    busy=false;controls();
    if (token() && catalog) await reloadHistory();
    flushLive();
  }
}
function rowLabel(title,value) {const line=node('p');line.append(node('strong',title+': '),document.createTextNode(value??'—'));return line;}
function openApplication(application,scroll=true) {
  const source=certificateView(application,isIt,catalog?.catalog);
  if(isIt)renderItFields(source.data);
  else{
  const type=catalog.languages.flatMap(language=>language.types).find(type=>type.id===source.certificateTypeId);
  if (!type) return notice('Loại chứng chỉ này không còn được xuất bản. Liên hệ chuyên viên.','error');
  $('language').value=type.languageId;renderTypes(type.id);renderResult(source.result);
  $('issuing-organization').value=source.issuingOrganizationId ?? '';
  $('issued-on').value=source.issuedOn;$('notes').value=source.notes||'';
  }
  fillStudentInformation(catalog.student);
  rememberPending(application.id,application.status);finished=false;
  $('evidence-files').value='';clearPreviews();controls();
  notice(application.status==='needs_changes'
    ? 'Chuyên viên yêu cầu bổ sung. Kiểm tra lý do trong chi tiết, cập nhật thông tin/ảnh rồi bấm Nộp bổ sung.'
    : 'Hồ sơ này chưa nộp cho chuyên viên. Kiểm tra thông tin, chọn lại ảnh rồi bấm Tiếp tục nộp hồ sơ.');
  if(scroll)$('form-title').scrollIntoView({behavior:'smooth'});
}
function renderApplication(application) {
  currentApplicationId=application.id;
  const original=application;
  application=certificateView(application,isIt,catalog?.catalog);
  const area=$('application-detail');area.hidden=false;area.replaceChildren(node('h3','Chi tiết hồ sơ'),rowLabel('Mã hồ sơ',application.id),rowLabel('Trạng thái',statusLabels[application.status]||application.status));
  if(application.status==='uploading') area.append(node('p','Hồ sơ đã được khởi tạo để upload ảnh nhưng chưa hoàn tất bước nộp. Chuyên viên chưa nhận hồ sơ này.','hint'));
  {
    const section=node('section');
    section.append(node('h4',application.catalogSnapshot.type.displayName),rowLabel('Cập nhật gần nhất',new Date(application.updatedAt).toLocaleString('vi-VN')));
    const values=application.catalogSnapshot.type.formSchema.fields.map(field=>{
      const value=application.result[field.key];const option=field.options?.find(option=>(typeof option==='string'?option:option.value)===value);
      return field.label+': '+(typeof option==='object'?option.label:value??'—');
    });
    section.append(node('p',values.join(' · ')));
    if (application.review) section.append(rowLabel('Trạng thái xử lí',statusLabels[application.review.decision]||application.review.decision),rowLabel('Lí do / ghi chú',application.review.reason));
    appendWorkflow(section,application.workflowHistory);
    for (const file of application.files.filter(file=>file.status==='completed')) {
      const button=node('button','Xem '+file.fileName,'secondary');button.type='button';
      button.onclick=async()=>{
        const tab=window.open('about:blank','_blank');if(tab)tab.opener=null;
        try {const result=await api('/applications/'+application.id+'/files/'+file.id+'/download');if(tab)tab.location.replace(result.url);else notice('Trình duyệt đang chặn cửa sổ xem ảnh. Cho phép pop-up rồi thử lại.','error');}
        catch(error){tab?.close();notice(error.message,'error');}
      };
      section.append(button);
    }
    area.append(section);
  }
  if (['uploading','needs_changes'].includes(application.status)) {
    const edit=node('button',application.status==='needs_changes'?'Bổ sung hồ sơ':'Tiếp tục nộp hồ sơ');edit.type='button';
    edit.onclick=()=>openApplication(original);
    area.append(edit);
  }
}
async function reloadHistory() {
  const identity=getAuthRevision();
  try {
    const list=await api('/applications?page=1&pageSize=20');
    if(identity!==getAuthRevision())return;
    $('history').replaceChildren();
    if (!list.items.length) $('history').append(node('p','Bạn chưa có hồ sơ.','hint'));
    for (const item of list.items) {
      const row=node('div',null,'history-row'),info=node('div');
      info.append(node('strong',statusLabels[item.status]||item.status),node('small',item.id));
      const button=node('button','Xem chi tiết','secondary');button.type='button';
      button.onclick=async()=>{try{renderApplication(await api('/applications/'+item.id));}catch(error){notice(error.message,'error');}};
      row.append(info,button);$('history').append(row);
    }
  } catch(error) {if(identity===getAuthRevision()&&error.name!=='AbortError')$('history').replaceChildren(node('p',error.message,'error'));}
}
function queueLive(change){
  if(change&&change.kind!==(isIt?'it':'language'))return;
  if(!livePending)liveApplicationId=change?.applicationId??null;
  else if(!change||liveApplicationId!==change.applicationId)liveApplicationId=null;
  livePending=true;
  scheduleLive();
}
function scheduleLive(){if(liveTimer===null)liveTimer=setTimeout(()=>{liveTimer=null;flushLive();},150);}
async function flushLive(){
  if(!livePending||refreshing||busy||!catalog||!token()||document.hidden)return;
  const changed=liveApplicationId,identity=getAuthRevision();livePending=false;liveApplicationId=null;refreshing=true;
  try{
    await reloadHistory();
    const id=currentApplicationId??pendingId;
    if(id&&(!changed||changed.toLowerCase()===id.toLowerCase())){
      const application=await api('/applications/'+id);
      if(identity!==getAuthRevision()||busy){livePending=true;return;}
      renderApplication(application);if(pendingId===id||finished)activeStatus=application.status;
      if(['submitted','received','processing','verified','failed','rejected'].includes(application.status)&&pendingId===id){pendingId=null;sessionStorage.removeItem(pendingKey);finished=true;}
      controls();
      if(changed)notice('Hồ sơ đã cập nhật: '+(statusLabels[application.status]||application.status)+'.','success');
    }
  }catch(error){if(error.name!=='AbortError'&&identity===getAuthRevision())notice(error.message,'error');}
  finally{refreshing=false;if(livePending&&!busy)scheduleLive();}
}
function resetForm() {
  currentApplicationId=null;
  pendingId=null;activeStatus=null;finished=false;sessionStorage.removeItem(pendingKey);
  $('application-form').reset();clearPreviews();$('progress').hidden=true;
  fillStudentInformation(catalog.student);
  if(isIt)renderItFields();else renderTypes();
  controls();notice('Chọn chứng chỉ và ảnh để tạo hồ sơ mới.');
}
async function initialize() {
  $('language-fields').hidden=isIt;$('language-fields').disabled=isIt;
  $('it-fields').hidden=!isIt;$('it-fields').disabled=!isIt;
  $('page-title').textContent=isIt?'Nộp chứng chỉ tin học':'Nộp chứng chỉ ngoại ngữ';
  document.title=$('page-title').textContent+' · Sinh viên DUT';
  $(isIt?'it-tab':'language-tab').setAttribute('aria-current','page');
  $('issued-on').max=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
  settings=await fetch('/test-config.json',{cache:'no-store'}).then(response=>response.json());
  configureWebAuth(settings);
  realtime=createCertificationRealtime({url:settings.apiBaseUrl+'/api/certifications/events',
    fetchImpl:webAuthFetch,onSync:()=>queueLive(),onChange:queueLive,
    onAuthError:()=>{forgetWebAccessToken();clearIdentity();notice('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.','error');}});
  $('reviewer-link').href=settings.reviewerOrigin+'/?kind='+(isIt?'it':'language');
  $('connection').textContent='FE: '+location.origin+' · Backend: '+settings.apiBaseUrl;
  $('login').onclick=()=>startSsoLogin('/?kind='+(isIt?'it':'language'));
  $('logout').onclick=async()=>{
    if(busy)return;busy=true;controls();realtime.stop();
    try{await logoutWebSession();sessionStorage.removeItem('certification.pending');sessionStorage.removeItem('certification.it.pending');clearIdentity();notice('Đã đăng xuất.');}
    catch(error){clearIdentity();notice(error.message,'error');}
    finally{busy=false;controls();}
  };
  $('language').onchange=()=>renderTypes();$('certificate-type').onchange=()=>renderResult();
  $('evidence-files').onchange=renderFiles;$('application-form').onsubmit=submit;
  $('reload').onclick=reloadHistory;$('new-application').onclick=resetForm;
  const error=sessionStorage.getItem('certification.authError');sessionStorage.removeItem('certification.authError');
  if(error)notice(error,'error');
  await restoreWebSession();
  if(token()) {busy=true;controls();try{await loadCatalog();}catch(error){notice(error.message,'error');}finally{busy=false;controls();flushLive();}}
}
initialize().catch(error=>notice(error.message,'error'));
