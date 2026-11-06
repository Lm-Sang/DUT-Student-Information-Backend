# Ngừng học, gia hạn và trở lại học

Khởi tạo/nâng cấp DB local bằng `npm run academic-leave:db:init` trước khi chạy
backend (Node >=24, SQL Server dùng cấu hình `LOCAL_DB_*`). Migration chạy lại
được, giữ mã đơn, nội dung và snapshot cũ. Các đơn cũ được ghi một mốc `migrated`
trong lịch sử; các thao tác sau nâng cấp được lưu đầy đủ trong cùng transaction.
Không suy diễn lại những lần xử lý trước khi có lịch sử.

## Quy tắc

- Đơn mới chỉ lập cho học kỳ chính hiện tại do cấu hình trường cung cấp.
- Ngừng học/gia hạn mặc định 1 kỳ. Chỉ lý do `military` được chọn 1–4 kỳ.
- Gia hạn khi sang kỳ nối tiếp, liên kết đơn ngừng học/gia hạn đã duyệt gần nhất
  của chính sinh viên. Không gia hạn trước cho kỳ tương lai hoặc bỏ qua kỳ.
- Trở lại học từ kỳ kết thúc ngừng học trở đi, liên kết đơn đã duyệt gần nhất.
  `semesterCount=0`; lý do lấy từ đơn trước, không nhập lại. Hiện chưa có quy
  trình trở lại sớm trước kỳ kết thúc đã đăng ký.
- Một đơn trước chỉ có một đơn kế tiếp chưa bị từ chối/hủy, bao gồm cả gia hạn
  và trở lại học. Không mở đợt ngừng học mới khi đợt trước chưa có đơn trở lại
  học được duyệt. Không tự coi sinh viên đã trở lại chỉ vì hết số kỳ.
- `approved` là duyệt hồ sơ online; bản giấy phải nộp trong 72 giờ. Đây chưa phải
  thao tác đồng bộ quyết định hay trạng thái học tập sang hệ thống trường.
- Chỉnh sửa, xác nhận, duyệt, nhận giấy và hủy đều giữ lịch sử riêng, gồm người
  xử lý, thời điểm và dữ liệu đơn tại thời điểm đó. Không xóa đơn khi hoàn tất.
- `If-Match` với `rowVersion` bắt buộc cho mọi thay đổi đơn đã tạo; sai phiên
  bản hoặc vi phạm chuỗi lịch sử trả `409`. Sai dữ liệu đầu vào trả `400`.

## API

Base: `/api/academic-leave`. Sinh viên dùng ngữ cảnh DUT đã xác thực. Chuyên
viên dùng tài khoản có quyền `academic-leave:review`.

| Method | Path | Chức năng |
| --- | --- | --- |
| GET | `/form` | Hồ sơ, kỳ hiện tại, giới hạn từng lý do, `eligibleParents` để gia hạn và `eligibleReturns` để trở lại học |
| GET/POST | `/applications` | Danh sách/lập nháp (`kind`: `leave`, `extension`, `return`) |
| GET/PUT | `/applications/:id` | Xem/sửa nháp hoặc đơn cần bổ sung |
| POST | `/applications/:id/confirm` | Chốt snapshot, gửi chuyên viên |
| POST | `/applications/:id/cancel` | Hủy nháp/đơn cần bổ sung |
| GET | `/history?page=1` | Lịch sử toàn bộ đơn của sinh viên, mới nhất trước, 20 mốc/trang |
| GET | `/applications/:id/history?page=1` | Lịch sử riêng đơn; người khác nhận `404` |
| GET | `/reviewer/applications` | Chuyên viên xem danh sách, lọc `status`, `page` |
| GET | `/reviewer/applications/:id` | Chuyên viên xem đơn |
| GET | `/reviewer/applications/:id/history?page=1` | Chuyên viên xem lịch sử xử lý |
| POST | `/reviewer/applications/:id/review` | `decision`: `approved`, `needs_changes`, `rejected`; yêu cầu ghi chú nếu không duyệt |
| POST | `/reviewer/applications/:id/receive-paper` | Xác nhận nhận giấy trong hạn |
| POST | `/print-session`, `/reviewer/print-session` | Cấp cookie in 5 phút với body `{ "MADN": "NH9992600011" }` |
| GET | `/print?MADN=NH9992600011` | PDF xác thực bằng Bearer hoặc cookie in, không truyền token trong URL |

Nháp ngừng học (bỏ `semesterCount` sẽ mặc định 1):

```json
{"kind":"leave","reasonCode":"medical","startSemesterCode":"2610","semesterCount":1,"content":""}
```

Sang kỳ `2620`, gia hạn theo đơn `id=1` đã duyệt:

```json
{"kind":"extension","parentApplicationId":1,"reasonCode":"medical","startSemesterCode":"2620","semesterCount":1,"content":""}
```

Hoặc trở lại học từ kỳ `2620` nếu chưa gia hạn đơn đó:

```json
{"kind":"return","parentApplicationId":1,"startSemesterCode":"2620","content":""}
```

Nếu đã gia hạn, đơn trở lại học phải trỏ đến đơn gia hạn cuối cùng và đợi kỳ
kết thúc tương ứng. Các ví dụ mã kỳ trên chỉ để minh họa; FE lấy kỳ từ `/form`.

`/history` trả `{page,pageSize,totalRecords,items}`; mỗi mốc gồm `applicationId`,
`requestCode`, `action`, `status`, `actorName`, `createdAt`, `data` (bản dữ liệu
đơn tại thời điểm xử lý). Các action: `migrated`, `created`, `updated`,
`confirmed`, `reviewed`, `paper_received`, `cancelled`.

## PDF và kiểm thử

Bộ sinh PDF dùng `src/infrastructure/pdf/chromium-pdf.js`, giấy A4, dùng snapshot
lúc xác nhận. Ngừng học/gia hạn có bảng học tập và biên nhận. Đơn trở lại học
dùng mẫu **ĐƠN XIN TRỞ LẠI HỌC TẬP**, tên Trường Đại học Bách khoa - Đại học
Đà Nẵng; có nơi ký của phụ huynh, người làm đơn và Ban Chủ nhiệm Khoa. Số/ngày
quyết định ngừng học chưa có trong dữ liệu được để chấm để điền trên bản giấy,
không thay bằng mã đơn online. Email lấy từ snapshot nếu có, thiếu thì để trống.
Máy chủ cần Chrome/Edge/Chromium;
cấu hình `PDF_BROWSER_EXECUTABLE` nếu không tự tìm thấy. Có thể cấu hình
`LEAVE_PRINT_COOKIE_SECRET` để chia sẻ cookie in giữa các instance.

Test tích hợp và dữ liệu giả thuộc [tests/](../../../tests/) và được version hóa.
Hai frontend chạy từ dự án riêng; server không phụ thuộc giao diện thử nghiệm local.
Route/controller riêng của sinh viên và chuyên viên lần lượt ở
[student](../../student/modules/academic-leave/) và [admin](../../admin/modules/academic-leave/).
