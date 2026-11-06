// Access tokens live in memory. Only the backend can read the refresh cookie.
let settings, accessToken = null, expiresAt = 0, refreshing = null, channel = 'student';
let revision = 0;

export function configureWebAuth(value, authChannel = 'student') {
  settings = value;
  channel = authChannel;
  sessionStorage.removeItem('ddut.ssoToken');
}

export const getAccessToken = () => accessToken;
export const getAuthRevision = () => revision;
export function forgetWebAccessToken() {
  revision++;
  accessToken = null;
  expiresAt = 0;
}

export function authReturnTo(value) {
  return ['/', '/?kind=language', '/?kind=it', '/academic-leave.html', '/student-data-check.html'].includes(value)
    ? value : '/?kind=language';
}
const withAuthLock = execute => navigator.locks
  ? navigator.locks.request(`dut-web-${channel}-refresh`, execute) : execute();

async function parseSession(response, expectedRevision) {
  const body = await response.json().catch(() => null);
  if (expectedRevision !== revision) throw new DOMException('Authentication changed.', 'AbortError');
  if (!response.ok || !body?.success || typeof body.data?.accessToken !== 'string') {
    const error = new Error(response.status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : body?.message || 'Cần đăng nhập lại.');
    error.status = response.status;
    throw error;
  }
  accessToken = body.data.accessToken;
  expiresAt = Date.parse(body.data.expiresAt);
  return accessToken;
}

export async function completeSsoLogin(code) {
  if (!/^[a-f0-9]{64}$/.test(code ?? '')) throw new Error('Thiếu mã đăng nhập hợp lệ. Vui lòng đăng nhập DUT SSO lại.');
  const expectedRevision = ++revision;
  return withAuthLock(async () => {
    const response = await fetch(settings.apiBaseUrl + '/api/student/auth/session', {
      method:'POST', credentials:'include', cache:'no-store', signal:AbortSignal.timeout(15000),
      headers:{'Content-Type':'application/json'}, body:JSON.stringify({code}),
    });
    return parseSession(response, expectedRevision);
  });
}

async function refresh() {
  if (refreshing) return refreshing;
  const expectedRevision = revision;
  const execute = async () => {
    if (revision !== expectedRevision) throw new Error('Phiên đăng nhập đã thay đổi.');
    const response = await fetch(settings.apiBaseUrl + `/api/${channel}/auth/refresh`, {
      method: 'POST', credentials: 'include', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(15000),
    });
    if (revision !== expectedRevision) throw new Error('Phiên đăng nhập đã thay đổi.');
    return parseSession(response, expectedRevision);
  };
  // Serialize refreshes across tabs so rotation does not look like token replay.
  refreshing = withAuthLock(execute)
    .catch(error => { if (revision === expectedRevision) { accessToken = null; expiresAt = 0; } throw error; })
    .finally(() => { refreshing = null; });
  return refreshing;
}

export async function restoreWebSession() {
  try { return await refresh(); }
  catch (error) { if (error.status === 401) return null; throw error; }
}

export async function webAuthFetch(url, options = {}) {
  const target = new URL(url, location.origin);
  if (target.username || target.password || ![location.origin, new URL(settings.apiBaseUrl).origin].includes(target.origin)) {
    throw new Error('Không gửi thông tin đăng nhập ra ngoài ứng dụng.');
  }
  if (!accessToken || expiresAt <= Date.now() + 15000) await refresh();
  const expectedRevision = revision;
  const request = () => {
    const headers = new Headers(options.headers);
    headers.set('Authorization', 'Bearer ' + accessToken);
    return fetch(url, { ...options, headers });
  };
  let response = await request();
  if (revision !== expectedRevision) throw new DOMException('Authentication changed.', 'AbortError');
  if (response.status === 401) {
    const body = await response.clone().json().catch(() => null);
    if (body?.details?.code !== 'SSO_REAUTH_REQUIRED') {
      await refresh();
      if (revision !== expectedRevision) throw new DOMException('Authentication changed.', 'AbortError');
      response = await request();
    }
  }
  return response;
}

export function startSsoLogin(returnTo = '/?kind=language') {
  sessionStorage.setItem('certification.returnTo', authReturnTo(returnTo));
  location.assign(settings.apiBaseUrl + '/api/student/auth/microsoft/login');
}

export async function logoutWebSession() {
  forgetWebAccessToken();
  await withAuthLock(async () => {
    const response = await fetch(settings.apiBaseUrl + `/api/${channel}/auth/logout`, {
      method: 'POST', credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    if (!response.ok && response.status !== 401) throw new Error('Chưa đăng xuất được. Vui lòng thử lại.');
  });
}

export async function passwordWebLogin(username, password) {
  const expectedRevision = ++revision;
  return withAuthLock(async () => {
    const response = await fetch(settings.apiBaseUrl + `/api/${channel}/auth/login`, {
      method: 'POST', credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
    });
    const copy = response.clone();
    await parseSession(response, expectedRevision);
    return (await copy.json()).data;
  });
}

export async function getWebSession() {
  const response = await webAuthFetch(settings.apiBaseUrl + `/api/${channel}/auth/me`, { cache: 'no-store' });
  const body = await response.json();
  if (!response.ok) { const error = new Error(body.message || 'Cần đăng nhập lại.'); error.status = response.status; throw error; }
  return body.data;
}
