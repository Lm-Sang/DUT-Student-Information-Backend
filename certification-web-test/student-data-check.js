// Local diagnostic only. Use the current student's SSO token for these three
// fixed, read-only endpoints; never exchange a Course Registration token.
import { studentService } from "../src/modules/students/index.js";
import { resolveSsoAccessToken } from '../src/modules/auth/index.js';

export const studentDataEndpoints = Object.freeze({
  profile: "https://profile.dut.udn.vn/api/profile",
  stats: "https://xemdiem.dut.udn.vn/api/stats",
  results: "https://xemdiem.dut.udn.vn/api/results",
});

function redact(value, token) {
  if (typeof value === "string")
    return value
      .split(token)
      .join("[redacted]")
      .replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
  if (Array.isArray(value)) return value.map((item) => redact(item, token));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        /token|secret|password|authorization|api.?key/i.test(key)
          ? "[redacted]"
          : redact(item, token),
      ]),
    );
  return value;
}

async function readJson(response) {
  const maxBytes = 2 * 1024 * 1024;
  if (
    !response.headers.get("content-type")?.includes("json") ||
    Number(response.headers.get("content-length")) > maxBytes
  ) {
    await response.body?.cancel();
    throw new Error("invalid response");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("empty response");
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error("response too large");
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

// Summary contains field paths/types and counts, without personal field values.
function shape(value, path = "", output = []) {
  if (Array.isArray(value)) {
    output.push({ path, type: "array", count: value.length });
    if (value.length) shape(value[0], path + "[]", output);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value))
      shape(item, path ? path + "." + key : key, output);
  } else
    output.push({
      path,
      type: value === null ? "null" : typeof value,
      present: value !== null && value !== "",
    });
  return output;
}

export function createStudentDataCheckHandler({
  fetchImpl = fetch,
  ssoTokenResolver = resolveSsoAccessToken,
  onSummary = () => {},
  identityLookup = (actor) =>
    studentService.getIdentityForAuthenticatedStudent(actor),
} = {}) {
  return async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (
      Object.keys(req.query).length ||
      req.headers["transfer-encoding"] ||
      Number(req.headers["content-length"]) > 0
    )
      return res.status(400).json({
        message:
          "Không gửi tham số hoặc body; API lấy sinh viên từ phiên đăng nhập.",
      });
    let token;
    try { token = await ssoTokenResolver(req); }
    catch (error) {
      return res.status(error.statusCode === 403 ? 403 : 401).json({ message: 'Cần đăng nhập DUT SSO qua backend để kiểm tra dữ liệu.' });
    }
    if (!token || token.length > 16384)
      return res
        .status(401)
        .json({ message: "Mở trang trong tab đang đăng nhập DUT SSO." });
    const endpoints = Object.fromEntries(
      await Promise.all(
        Object.entries(studentDataEndpoints).map(async ([name, url]) => {
          try {
            const response = await fetchImpl(url, {
              method: "GET",
              redirect: "error",
              headers: {
                Authorization: "Bearer " + token,
                Accept: "application/json",
              },
              signal: AbortSignal.timeout(15000),
            });
            if (!response.ok) {
              await response.body?.cancel();
              return [
                name,
                {
                  url,
                  ok: false,
                  status: response.status,
                  message: "API trả HTTP " + response.status + ".",
                },
              ];
            }
            const body = await readJson(response);
            if (
              body?.success === false ||
              body?.isSuccess === false ||
              Number(body?.statusCode) >= 400
            )
              return [
                name,
                {
                  url,
                  ok: false,
                  status:
                    Number(body?.statusCode) >= 400
                      ? Number(body.statusCode)
                      : 502,
                  message: "API từ chối trả dữ liệu.",
                },
              ];
            return [
              name,
              {
                url,
                ok: true,
                status: response.status,
                body: redact(body, token),
              },
            ];
          } catch {
            return [
              name,
              {
                url,
                ok: false,
                status: 502,
                message:
                  "Không đọc được JSON từ API hoặc kết nối quá thời gian.",
              },
            ];
          }
        }),
      ),
    );
    // Use only the student code returned by the authenticated profile API.
    // Query/body student codes were rejected above; no JWT decoding is used.
    const profile = endpoints.profile.ok ? endpoints.profile.body?.data : null;
    const identitySource = "DATA_SV1.dbo.NhanThan";
    if (
      !profile ||
      typeof profile.studentCardNumber !== "string" ||
      !/^\d{9}$/.test(profile.studentCardNumber) ||
      typeof profile.fullName !== "string" ||
      !profile.fullName.trim()
    ) {
      endpoints.identity = {
        url: identitySource,
        ok: false,
        status: endpoints.profile.ok ? 403 : endpoints.profile.status,
        message: "Chưa xác thực được hồ sơ sinh viên; không thực hiện tra DB.",
      };
    } else {
      try {
        const identity = await identityLookup({
          role: "student",
          studentCode: profile.studentCardNumber,
        });
        endpoints.identity = {
          url: identitySource,
          ok: true,
          status: 200,
          body: { data: identity },
        };
      } catch {
        endpoints.identity = {
          url: identitySource,
          ok: false,
          status: 503,
          message: "Chưa đọc được CCCD từ DB trường. Vui lòng thử lại.",
        };
      }
    }
    const summary = {
      checkedAt: new Date().toISOString(),
      endpoints: Object.fromEntries(
        Object.entries(endpoints).map(([name, result]) => [
          name,
          {
            url: result.url,
            ok: result.ok,
            status: result.status,
            fields: result.ok ? shape(result.body) : [],
          },
        ]),
      ),
    };
    try {
      await onSummary(summary);
    } catch {
      /* Diagnostics must still render if writing the summary fails. */
    }
    return res.json({ endpoints });
  };
}
