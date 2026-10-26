const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search);
const token = params.get('accessToken')?.trim();
window.history.replaceState({},document.title,window.location.pathname);
try {
  sessionStorage.removeItem('ddut.ssoToken');
  if (token && !params.get('error') && !params.has('logout')) sessionStorage.setItem('ddut.ssoToken',token);
  else if (!params.has('logout')) sessionStorage.setItem('certification.authError',params.get('error') || 'Đăng nhập chưa thành công.');
  const target=sessionStorage.getItem('certification.returnTo');
  sessionStorage.removeItem('certification.returnTo');
  window.location.replace(target==='/?kind=it'?'/?kind=it':'/?kind=language');
} catch {
  document.querySelector('#message').textContent='Trình duyệt đang chặn sessionStorage. Hãy cho phép lưu phiên rồi đăng nhập lại.';
}
