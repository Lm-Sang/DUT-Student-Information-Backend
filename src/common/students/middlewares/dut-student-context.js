import { AppError } from "../../../shared/errors/app-error.js";
import jwt from 'jsonwebtoken';
import { resolveSsoAccessToken } from '../../auth/index.js';
import { env } from '../../../config/env.js';
import { citizenId } from '../index.js';

// The profile service validates the token. Never trust JWT payloads decoded in the browser.
export function createDutStudentContext({ fetchImpl = fetch, ssoTokenResolver = resolveSsoAccessToken, ssoConfig = env.microsoftSso } = {}) {
  return async function studentContext(req) {
    const token = await ssoTokenResolver(req);
    if (!token || token.length > 16384)
      throw new AppError("Cần đăng nhập DUT SSO.", 401);
    let response, body;
    try {
      response = await fetchImpl("https://profile.dut.udn.vn/api/profile", {
        headers: {
          Authorization: "Bearer " + token,
          Accept: "application/json",
        },
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      });
      if ([401, 403].includes(response.status))
        throw new AppError(
          "Phiên DUT SSO đã hết hạn hoặc không có quyền xem hồ sơ.",
          401,
          { code: 'SSO_REAUTH_REQUIRED' },
        );
      if (!response.ok)
        throw new AppError("Dịch vụ hồ sơ DUT chưa sẵn sàng.", 502);
      body = await response.json();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Không kết nối được dịch vụ hồ sơ DUT. Vui lòng thử lại.",
        502,
      );
    }
    if (
      body?.success === false ||
      body?.isSuccess === false ||
      Number(body?.statusCode) >= 400
    )
      throw new AppError("DUT từ chối xác thực hồ sơ sinh viên.", 401);
    const profile = body?.data;
    const studentCode = String(profile?.studentCardNumber ?? "");
    if (
      !/^\d{9}$/.test(studentCode)
    )
      throw new AppError("Tài khoản chưa có hồ sơ sinh viên DUT hợp lệ.", 403);
    // Read token fields only after cryptographic verification. If this gateway's
    // signing config is unavailable, use the profile service's verified data.
    let claims = {};
    try {
      const verified = jwt.verify(token, ssoConfig.jwtSecret, { algorithms:['HS256'],
        ...(ssoConfig.jwtIssuer ? {issuer:ssoConfig.jwtIssuer} : {}),
        ...(ssoConfig.jwtAudience ? {audience:ssoConfig.jwtAudience} : {}) });
      if (verified && typeof verified === 'object' && Number.isFinite(verified.exp)) claims = verified;
    } catch { /* The authenticated profile remains the authority for this token. */ }
    const tokenStudentCode = claims.studentCardNumber ?? claims.studentCode;
    if (tokenStudentCode != null && String(tokenStudentCode) !== studentCode)
      throw new AppError('MSSV trong token không khớp hồ sơ DUT.',403);
    const firstText = (...values) => values.find(value => typeof value === 'string' && value.trim())?.trim() ?? null;
    // DUT's nine-digit student code embeds the admission year at positions 4–5,
    // No cohort boundary is fixed in code.
    const cohortYear = 2000 + Number(studentCode.slice(3, 5));
    return {
      role: "student",
      source: "auth",
      reference: "dut-student:" + studentCode,
      permissions: [],
      name: firstText(claims.fullName, claims.name, profile.fullName),
      studentCode,
      cohortYear,
      birthday: typeof profile.birthday === 'string' ? profile.birthday : '',
      phoneNumber: typeof profile.phoneNumber === 'string' ? profile.phoneNumber : '',
      className: firstText(claims.className, claims.class?.name, profile.class?.name, profile.className),
      cccd: citizenId(claims.cccd) || citizenId(claims.citizenId) || citizenId(claims.identityCardNumber)
        || citizenId(profile.cccd) || citizenId(profile.citizenId) || citizenId(profile.identityCardNumber),
    };
  };
}
