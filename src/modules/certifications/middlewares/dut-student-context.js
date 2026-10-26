import { AppError } from "../../../shared/errors/app-error.js";

// The profile service validates the token. Never trust JWT payloads decoded in the browser.
export function createDutStudentContext({ fetchImpl = fetch } = {}) {
  return async function studentContext(req) {
    const token = /^Bearer ([^\s]+)$/i.exec(
      req.headers.authorization ?? "",
    )?.[1];
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
      !/^\d{9}$/.test(studentCode) ||
      typeof profile?.fullName !== "string" ||
      !profile.fullName.trim()
    )
      throw new AppError("Tài khoản chưa có hồ sơ sinh viên DUT hợp lệ.", 403);
    // DUT's nine-digit student code embeds the admission year at positions 4–5,
    // No cohort boundary is fixed in code.
    const cohortYear = 2000 + Number(studentCode.slice(3, 5));
    return {
      role: "student",
      source: "auth",
      reference: "dut-student:" + studentCode,
      permissions: [],
      name: profile.fullName.trim(),
      studentCode,
      cohortYear,
      className:
        typeof profile.class?.name === "string" ? profile.class.name : "",
    };
  };
}
