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
      const profile=claims.organization??claims.identity.organization;
      if(!profile?.active||!profile.fieldActive||profile.accessLevel!=='specialist'||!profile.taskIds.includes(4))
        throw new AppError('Auth specialist task assignment required',403);
      id = claims.identity.requestActorId;
    }
    const actor = await service.sessionActor(id);
    if (actor.role !== (channel === 'student' ? 'STUDENT' : 'STAFF')) throw new AppError('Tài khoản không đúng vai trò của API.', 403);
    if (channel === 'student' && (actor.identitySource !== 'SSO'
      || actor.studentNumber !== studentNumberFromIdentity(claims.identity))) {
      throw new AppError('Liên kết hồ sơ không còn khớp tài khoản SSO.', 403);
    }
    if(channel!=='student') {
      actor.permissions=[...claims.permissions];
      actor.workPermissions=claims.permissions.filter(permission=>permission.startsWith('work:')).map(permission=>permission.slice(5));
    }
    // The workflow identity preserves history; auth owns current permissions.
    return actor;
  };
}
