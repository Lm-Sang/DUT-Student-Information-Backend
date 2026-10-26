import {isItPage,certificateApiBase,certificateView} from './certificate-view.js';
import {createCertificationRealtime} from './realtime.js';
const $=id=>document.getElementById(id);
const isIt=isItPage(location.search),apiBase=certificateApiBase(isIt);
const labels={uploading:'Chưa nộp',submitted:'Chờ xét duyệt',needs_changes:'Cần bổ sung',verified:'Đã xác nhận',rejected:'Đã từ chối'};
const methods={document_comparison:'Đối chiếu minh chứng',issuer_lookup:'Tra cứu đơn vị cấp',other:'Phương pháp khác'};
const node=(tag,text,className)=>{const element=document.createElement(tag);if(text!=null)element.textContent=text;if(className)element.className=className;return element;};
let settings,session,current=null,page=1,pages=1,busy=false,loadingQueue=false,loadingDetail=false,detailSequence=0;
let realtime,livePending=false,liveApplicationId=null,refreshing=false;
let liveTimer=null;
function notice(message,kind='info'){$('reviewer-notice').hidden=!message;$('reviewer-notice').textContent=message;$('reviewer-notice').className='notice '+kind;}
function controls(){
  $('reviewer-login').disabled=busy;$('reviewer-logout').disabled=busy;
  $('queue-status').disabled=busy||loadingQueue;$('queue-reload').disabled=busy||loadingQueue;
  $('queue-prev').disabled=busy||loadingQueue||page<=1;$('queue-next').disabled=busy||loadingQueue||page>=pages;
  $('detail-reload').disabled=busy||loadingDetail;
  $('review-fields').disabled=busy||loadingDetail||current?.status!=='submitted';
  $('review-submit').textContent=busy?'Đang lưu kết quả…':'Lưu kết quả xét duyệt';
}
function setSession(value){
  session=value;$('reviewer-login-card').hidden=Boolean(value);$('reviewer-session').hidden=!value;$('queue-card').hidden=!value;
  if(value){$('reviewer-name').textContent=value.user.displayName;realtime?.start();}
  else{realtime?.stop();clearTimeout(liveTimer);liveTimer=null;livePending=false;current=null;detailSequence++;$('reviewer-detail').hidden=true;$('reviewer-submissions').replaceChildren();$('queue-items').replaceChildren();$('review-form').hidden=true;}
  controls();
}
async function api(path,{method='GET',body,rowVersion}={}){
  let response;
  try{
    const base=path.startsWith('/auth/')?'/api/certifications':apiBase;
    response=await fetch(settings.apiBaseUrl+base+'/reviewer'+path,{
      method,credentials:'include',cache:'no-store',signal:AbortSignal.timeout(30000),
      headers:{Accept:'application/json',...(body?{'Content-Type':'application/json'}:{}),...(rowVersion?{'If-Match':'"'+rowVersion+'"'}:{})},
      ...(body?{body:JSON.stringify(body)}:{}),
    });
  }catch{throw new Error('Không kết nối được backend '+settings.apiBaseUrl+'. Kiểm tra backend và cấu hình CORS.');}
  const result=await response.json().catch(()=>null);
  if(!response.ok||!result?.success){
    if(response.status===401)setSession(null);
    const error=new Error(result?.message||'API trả HTTP '+response.status+'.');error.status=response.status;throw error;
  }
  return result.data;
}
async function loadQueue(){
  if(!session)return;
  loadingQueue=true;controls();
  try{
    const data=await api('/applications?status='+encodeURIComponent($('queue-status').value)+'&page='+page+'&pageSize=20');
    pages=Math.max(1,data.totalPages);
    if(page>pages){page=pages;return await loadQueue();}
    $('queue-items').replaceChildren();$('queue-empty').hidden=Boolean(data.items.length);
    $('queue-empty').textContent=$('queue-status').value==='submitted'
      ?'Chưa có hồ sơ chờ xét duyệt. Hồ sơ “Chưa nộp” cần sinh viên hoàn tất upload và nộp trước.'
      :'Không có hồ sơ ở trạng thái này.';
    $('queue-page').textContent='Trang '+page+'/'+pages+' · '+data.totalRecords+' hồ sơ';
    for(const item of data.items){
      const row=node('tr'),student=node('td');student.append(node('strong',item.fullName||'Sinh viên'),node('small',item.studentCode));
      const action=node('td'),button=node('button','Mở hồ sơ','secondary');button.type='button';button.onclick=()=>openApplication(item.id);
      action.append(button);row.append(student);
      if(!isIt)row.append(node('td','K'+String(item.cohortYear).slice(-2)));
      row.append(node('td',item.certificateTypeName||(isIt?item.data?.MaCC:'Chứng chỉ ngoại ngữ')),node('td',labels[item.status]||item.status),action);
      $('queue-items').append(row);
    }
  }catch(error){notice(error.message,'error');}
  finally{loadingQueue=false;controls();flushLive();}
}
function queueLive(change){
  if(change&&change.kind!==(isIt?'it':'language'))return;
  if(!livePending)liveApplicationId=change?.applicationId??null;
  else if(!change||liveApplicationId!==change.applicationId)liveApplicationId=null;
  livePending=true;scheduleLive();
}
function scheduleLive(){if(liveTimer===null)liveTimer=setTimeout(()=>{liveTimer=null;flushLive();},150);}
async function flushLive(){
  if(!livePending||refreshing||busy||loadingQueue||loadingDetail||!session||document.hidden)return;
  const changed=liveApplicationId;livePending=false;liveApplicationId=null;refreshing=true;
  try{
    await loadQueue();
    if(current&&(!changed||changed.toLowerCase()===current.id.toLowerCase())){
      const id=current.id,application=await api('/applications/'+id);
      if(!busy&&current?.id===id&&current.rowVersion!==application.rowVersion)renderApplication(application);
      else if(busy)livePending=true;
    }
  }catch(error){notice(error.message,'error');}
  finally{refreshing=false;if(livePending&&!busy)scheduleLive();}
}
function info(title,value){const item=node('div');item.append(node('dt',title),node('dd',value??'—'));return item;}
function date(value,withTime=false){return value?new Date(value).toLocaleString('vi-VN',withTime?{}:{year:'numeric',month:'2-digit',day:'2-digit'}):'—';}
function resultLabel(field,value){
  const option=field.options?.find(option=>(typeof option==='string'?option:option.value)===value);
  return typeof option==='object'?option.label:value??'—';
}
function evidenceCard(applicationId,file){
  const card=node('article',null,'evidence-card'),image=node('img'),message=node('p','Đang tải ảnh…','hint');
  const title=node('strong',file.fileName),buttons=node('div',null,'actions');
  image.alt=file.fileName;image.hidden=true;image.referrerPolicy='no-referrer';
  const refresh=node('button','Tải lại ảnh','secondary'),zoom=node('button','Mở ảnh lớn','secondary');refresh.type=zoom.type='button';zoom.disabled=true;
  image.onload=()=>{message.textContent='';image.hidden=false;zoom.disabled=false;};
  image.onerror=()=>{image.hidden=true;zoom.disabled=true;message.textContent='Ảnh chưa tải được hoặc URL đã hết hạn. Bấm Tải lại ảnh.';};
  const show=()=>{$('large-evidence').src=image.src;$('large-evidence').alt=file.fileName;$('image-dialog').showModal();};
  zoom.onclick=show;image.onclick=show;
  async function load(){
    refresh.disabled=true;zoom.disabled=true;message.textContent='Đang tải ảnh…';
    try{const data=await api('/applications/'+applicationId+'/files/'+file.id+'/download');image.src=data.url;}
    catch(error){message.textContent=error.message;}
    finally{refresh.disabled=false;}
  }
  refresh.onclick=load;buttons.append(zoom,refresh);card.append(title,image,message,buttons);
  if(file.quality)card.append(node('p',file.quality.status==='passed'?'Ảnh đã qua kiểm tra chất lượng.':'Ảnh cần chuyên viên đối chiếu trực tiếp.','hint'));
  return {card,load};
}
function renderApplication(application){
  current=application;$('reviewer-detail').hidden=false;
  const latest=certificateView(application,isIt);
  application=latest;
  const identity=node('dl',null,'info-grid');
  const identityFields=[['Mã hồ sơ',application.id],['Trạng thái',labels[application.status]],['MSSV',application.studentCode]];
  if(!isIt)identityFields.push(['Sinh viên',latest.fullName],['Khóa tuyển sinh',application.cohortYear],['Lớp',latest.className]);
  for(const [label,value] of identityFields)identity.append(info(label,value));
  $('reviewer-identity').replaceChildren(identity);$('reviewer-submissions').replaceChildren();
  {
    const submission=application;
    const section=node('section');
    section.append(node('h3',submission.catalogSnapshot.type.displayName));
    const values=node('dl',null,'info-grid');
    if(!isIt)values.append(info('Ngày cấp',date(submission.issuedOn)));
    values.append(info('Nộp lúc',date(submission.submittedAt,true)));
    values.append(info('Cập nhật gần nhất',date(submission.updatedAt,true)));
    for(const field of submission.catalogSnapshot.type.formSchema.fields)values.append(info(field.label,resultLabel(field,submission.result[field.key])));
    if(submission.notes)values.append(info('Ghi chú sinh viên',submission.notes));section.append(values);
    if(submission.review){const review=submission.review;section.append(node('p','Kết quả: '+labels[review.decision]+' · '+review.reviewerName+' · '+date(review.reviewedAt,true)));
      section.append(node('p','Cách xác minh: '+methods[review.verificationMethod]));if(review.reason)section.append(node('p','Lý do: '+review.reason));}
    const gallery=node('div',null,'evidence-grid');const images=submission.files.filter(file=>file.status==='completed').map(file=>evidenceCard(application.id,file));
    for(const {card}of images)gallery.append(card);section.append(gallery);$('reviewer-submissions').append(section);
    for(const image of images)image.load();
  }
  if(application.status==='uploading')$('reviewer-submissions').append(node('p','Sinh viên mới khởi tạo hồ sơ để upload ảnh, chưa nộp hoàn tất. Hồ sơ này chưa được xét duyệt.','notice'));
  $('review-form').reset();$('review-reason').required=false;
  $('review-form').hidden=application.status!=='submitted';$('review-locked').hidden=application.status==='submitted';
  $('review-locked').textContent=application.status==='needs_changes'?'Đã yêu cầu bổ sung. Chờ sinh viên nộp lại.':application.status==='uploading'?'Chưa có lần nộp để xét duyệt.':'Hồ sơ đã có kết quả; không ghi đè quyết định cũ.';
  controls();
}
async function openApplication(id){
  if(busy)return;
  const sequence=++detailSequence;loadingDetail=true;controls();
  try{const application=await api('/applications/'+id);if(sequence!==detailSequence)return;renderApplication(application);$('reviewer-detail').scrollIntoView({behavior:'smooth'});}
  catch(error){notice(error.message,'error');}
  finally{if(sequence===detailSequence){loadingDetail=false;controls();flushLive();}}
}
async function review(event){
  event.preventDefault();if(busy||current?.status!=='submitted')return;
  const decision=$('review-decision').value,reason=$('review-reason').value.trim();
  if(decision!=='verified'&&!reason)return notice('Ghi rõ lý do yêu cầu bổ sung hoặc từ chối.','error');
  const applicationId=current.id;busy=true;controls();
  try{
    const application=await api('/applications/'+applicationId+'/review',{method:'POST',rowVersion:current.rowVersion,
      body:{decision,reason:reason||null,verificationMethod:$('review-method').value}});
    renderApplication(application);notice('Đã lưu kết quả: '+labels[application.status]+'.','success');await loadQueue();
  }catch(error){
    notice(error.message,'error');
    if(error.status===409){try{renderApplication(await api('/applications/'+applicationId));}catch{}}
  }finally{busy=false;controls();flushLive();}
}
async function initialize(){
  $(isIt?'it-tab':'language-tab').setAttribute('aria-current','page');
  $('cohort-column').hidden=isIt;
  settings=await fetch('/test-config.json',{cache:'no-store'}).then(response=>response.json());
  realtime=createCertificationRealtime({url:settings.apiBaseUrl+'/api/certifications/reviewer/events',credentials:'include',
    onSync:()=>queueLive(),onChange:queueLive,onAuthError:()=>{setSession(null);notice('Phiên chuyên viên đã hết hạn. Vui lòng đăng nhập lại.','error');}});
  $('student-link').href=settings.studentOrigin+'/?kind='+(isIt?'it':'language');$('reviewer-connection').textContent='Chuyên viên: '+location.origin+' · Backend: '+settings.apiBaseUrl;
  $('reviewer-login-form').onsubmit=async event=>{
    event.preventDefault();if(busy)return;busy=true;controls();
    try{const value=await api('/auth/login',{method:'POST',body:{username:$('reviewer-username').value.trim(),password:$('reviewer-password').value}});
      $('reviewer-password').value='';setSession(value);notice('Đã đăng nhập chuyên viên. Chọn hồ sơ để xét duyệt.','success');page=1;await loadQueue();}
    catch(error){notice(error.message,'error');}finally{busy=false;controls();flushLive();}
  };
  $('reviewer-logout').onclick=async()=>{if(busy)return;busy=true;controls();try{await api('/auth/logout',{method:'POST',body:{}});setSession(null);notice('Đã đăng xuất.');}catch(error){notice(error.message,'error');}finally{busy=false;controls();}};
  $('queue-status').onchange=()=>{page=1;current=null;detailSequence++;$('reviewer-detail').hidden=true;loadQueue();};
  $('queue-reload').onclick=loadQueue;$('queue-prev').onclick=()=>{page--;loadQueue();};$('queue-next').onclick=()=>{page++;loadQueue();};
  $('detail-reload').onclick=()=>{if(current)openApplication(current.id);};
  $('review-decision').onchange=()=>{$('review-reason').required=['needs_changes','rejected'].includes($('review-decision').value);};
  $('review-form').onsubmit=review;$('close-image').onclick=()=>{$('image-dialog').close();$('large-evidence').removeAttribute('src');};
  try{setSession(await api('/auth/session'));await loadQueue();}catch(error){if(error.status!==401)notice(error.message,'error');}
}
initialize().catch(error=>notice(error.message,'error'));
