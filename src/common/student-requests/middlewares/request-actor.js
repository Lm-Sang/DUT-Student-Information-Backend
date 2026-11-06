import { authService } from '../../auth/index.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { studentNumberFromIdentity } from '../rules/student-identity.js';

export function createRequestActorResolver({ channel, service, school, auth = authService }) {
  return async req => {
    const token = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '')?.[1];
    if (!token) throw new AppError('Cần đăng nhập trước khi sử dụng dịch vụ sinh viên.', 401);
    const claims = await auth.verifyToken(token, channel);
    let id;
    if (channel === 'student') {
      if (claims.authMethod !== 'sso') throw new AppError('Sinh viên phải đăng nhập DUT SSO.', 403);
      id = await school.signIn(claims);
    } else {
      if (claims.authMethod !== 'password' || !claims.identity?.requestActorId) throw new AppError('Cần tài khoản chuyên viên trong DB.', 403);
      id = claims.identity.requestActorId;
    }
    const actor = await service.sessionActor(id);
    if (actor.role !== (channel === 'student' ? 'STUDENT' : 'STAFF')) throw new AppError('Tài khoản không đúng vai trò của API.', 403);
    if (channel === 'student' && (actor.identitySource !== 'SSO'
      || actor.studentNumber !== studentNumberFromIdentity(claims.identity))) {
      throw new AppError('Liên kết hồ sơ không còn khớp tài khoản SSO.', 403);
    }
    // Roles and scope always come from SQL on this request, never SSO claims.
    return actor;
  };
}
