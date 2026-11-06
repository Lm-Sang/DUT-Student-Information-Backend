const params = new URLSearchParams(window.location.hash.slice(1));
window.history.replaceState({}, document.title, window.location.pathname);

async function finishLogin() {
  const {configureWebAuth, completeSsoLogin, authReturnTo} = await import('./web-auth.js');
  const target = authReturnTo(sessionStorage.getItem('certification.returnTo'));
  sessionStorage.removeItem('certification.returnTo');
  sessionStorage.removeItem('ddut.ssoToken');
  try {
    if (params.has('error') || params.has('accessToken'))
      throw new Error('Luồng đăng nhập cũ đã hết hiệu lực. Bấm Đăng nhập DUT SSO để tạo phiên mới.');
    const settings = await fetch('/test-config.json', {cache:'no-store'}).then(response => response.json());
    configureWebAuth(settings);
    await completeSsoLogin(params.get('code'));
  } catch (error) {
    sessionStorage.setItem('certification.authError', error.message);
  }
  window.location.replace(target);
}

finishLogin().catch(() => {
  document.querySelector('#message').textContent = 'Chưa hoàn tất đăng nhập. Kiểm tra kết nối và cho phép trình duyệt lưu phiên, rồi đăng nhập lại.';
});
