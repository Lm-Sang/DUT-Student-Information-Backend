import {configureWebAuth,getAccessToken,restoreWebSession,webAuthFetch,getAuthRevision} from './web-auth.js';
const settings = await (await fetch('/test-config.json', {cache:'no-store'})).json();
configureWebAuth(settings);
await restoreWebSession().catch(() => null);
const $ = (id) => document.getElementById(id);
function node(tag, text) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  return element;
}
const unwrap = (body) => body?.data ?? body;
const value = (input) =>
  input === null || input === undefined || input === ""
    ? "Chưa có dữ liệu"
    : String(input);
function findIdentityFields(input, path = "", found = []) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return found;
  for (const [key, item] of Object.entries(input)) {
    const name = path ? path + "." + key : key;
    if (
      /cccd|cmnd|citizen|identity.*(card|number)|identification|idCard|nationalId/i.test(
        key,
      ) &&
      typeof item !== "object"
    )
      found.push([name, item]);
    else if (item && typeof item === "object")
      findIdentityFields(item, name, found);
  }
  return found;
}
function renderProfile(result, identityResult) {
  $("profile").replaceChildren();
  if (!result.ok) {
    $("profile").append(node("p", result.message));
    return;
  }
  const profile = unwrap(result.body);
  const identity = findIdentityFields(profile);
  const fields = [
    ["Họ và tên", profile?.fullName],
    ["MSSV", profile?.studentCardNumber],
    ["Ngày sinh", profile?.birthday],
    ["Điện thoại", profile?.phoneNumber],
    ["Lớp sinh hoạt", profile?.class?.name],
    ...identity.map(([key, item]) => ["CCCD/CMND · " + key, item]),
  ];
  if (!identity.length) {
    const fromDb = identityResult?.body?.data;
    const messages = {
      not_found: "Chưa tìm thấy hồ sơ trong DB trường.",
      ambiguous: "MSSV có nhiều bản ghi; cần đối chiếu hồ sơ.",
      missing: "Hồ sơ DB chưa có CCCD 12 chữ số hợp lệ.",
    };
    fields.push([
      "CCCD",
      fromDb?.status === "found"
        ? fromDb.cccd
        : (messages[fromDb?.status] ??
          identityResult?.message ??
          "Chưa có dữ liệu."),
    ]);
    if (fromDb?.status === "found") fields.push(["Nguồn CCCD", fromDb.source]);
  }
  for (const [label, item] of fields) {
    const row = node("div");
    row.append(node("dt", label), node("dd", value(item)));
    $("profile").append(row);
  }
}
function renderStats(result) {
  $("stats").replaceChildren();
  if (!result.ok) {
    $("stats").append(node("p", result.message));
    return;
  }
  const data = unwrap(result.body);
  const semesters =
    data?.semesters ?? data?.["Kỳ học"] ?? data?.kyHoc ?? data?.ky_hoc;
  const columns = [
    ["Học kỳ", semesters],
    [
      "Tín chỉ đăng ký",
      data?.creditsPerSemester ??
        data?.["Số tín chỉ đăng ký từng kì"] ??
        data?.tin_chi_tung_ky,
    ],
    [
      "GPA theo API",
      data?.gpaPerSemester ?? data?.["GPA từng kỳ"] ?? data?.gpa_tung_ky,
    ],
    [
      "Điểm rèn luyện",
      data?.conductPerSemester ??
        data?.["Điểm rèn luyện từng kỳ"] ??
        data?.drl_tung_ky,
    ],
  ];
  if (!Array.isArray(semesters)) {
    $("stats").append(
      node("p", "Chưa nhận diện được cấu trúc học kỳ. Xem JSON API bên dưới."),
    );
    return;
  }
  if (!semesters.length) {
    $("stats").append(node("p", "API chưa trả học kỳ nào."));
    return;
  }
  if (
    columns.some(
      ([, items]) => !Array.isArray(items) || items.length !== semesters.length,
    )
  )
    $("stats").append(
      node(
        "p",
        "Các mảng dữ liệu chưa khớp số học kỳ. Giữ nguyên ô thiếu và kiểm tra JSON trước khi sử dụng.",
      ),
    );
  const table = node("table"),
    head = node("thead"),
    header = node("tr"),
    body = node("tbody");
  columns.forEach(([label]) => header.append(node("th", label)));
  head.append(header);
  semesters.forEach((_, index) => {
    const row = node("tr");
    columns.forEach(([, items]) =>
      row.append(node("td", value(items?.[index]))),
    );
    body.append(row);
  });
  table.append(head, body);
  $("stats").append(table);
}
$("check").addEventListener("click", async () => {
  const token = getAccessToken(), revision = getAuthRevision();
  if (!token) {
    $("status").textContent =
      "Chưa có phiên trong tab này. Quay về trang chứng chỉ để đăng nhập, rồi mở lại trang kiểm tra trong cùng tab.";
    return;
  }
  $("check").disabled = true;
  $("status").textContent =
    "Đang đọc hồ sơ, tra CCCD từ DB trường và lấy bảng điểm…";
  $("profile").replaceChildren();
  $("stats").replaceChildren();
  $("responses").replaceChildren();
  try {
    const response = await webAuthFetch("/local-api/student-data-check", {
      headers: { Authorization: "Bearer " + token, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(90000),
    });
    if (getAuthRevision() !== revision)
      throw new Error("Phiên đăng nhập đã thay đổi; vui lòng kiểm tra lại.");
    const body = await response.json();
    if (!response.ok)
      throw new Error(body.message ?? "Không kiểm tra được dữ liệu.");
    renderProfile(body.endpoints.profile, body.endpoints.identity);
    renderStats(body.endpoints.stats);
    for (const [name, result] of Object.entries(body.endpoints)) {
      const details = node("details");
      details.append(
        node("summary", name + " · HTTP " + result.status + " · " + result.url),
        node(
          "pre",
          JSON.stringify(result.body ?? { message: result.message }, null, 2),
        ),
      );
      $("responses").append(details);
    }
    $("status").textContent = Object.values(body.endpoints).every(
      (result) => result.ok,
    )
      ? "Đã đọc được các API và kiểm tra CCCD từ DB trường."
      : "Đã kiểm tra; một số nguồn chưa trả dữ liệu thành công. Xem chi tiết bên dưới.";
  } catch (error) {
    $("status").textContent = error.message;
  } finally {
    $("check").disabled = false;
  }
});
