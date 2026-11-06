# Nguồn dữ liệu điền đơn sinh viên

Đối chiếu ngày 26/10/2026 với `D:\Ddut\d_dut\auth-web-test` và service/model Flutter
trong `D:\Ddut\d_dut\lib`, sau đó kiểm tra bằng phiên DUT SSO thật trên FE local.

## Kết quả kiểm tra thực tế

Lần kiểm tra lúc 16:33:29 ngày 26/10/2026 (Asia/Bangkok), theo bản tóm tắt local:

- Cả profile, stats và results đều trả HTTP 200, thành công.
- Profile có giá trị cho `fullName`, `studentCardNumber`, `birthday`, `phoneNumber`
  và `class.name`. Phản hồi này không có trường CCCD/CMND hoặc trường định danh
  công dân dưới tên khác; `data.id` là ID hệ thống, không dùng thay CCCD.
- Stats trả 10 mục học kỳ; các mảng GPA, điểm rèn luyện và tín chỉ đăng ký đều có
  10 phần tử. Định nghĩa GPA học kỳ/tích lũy vẫn cần đối chiếu nguồn.
- Results trả 56 dòng kết quả học phần. Bản tóm tắt lấy cấu trúc phần tử đầu để
  kiểm tra schema, không kết luận mọi dòng đều đã có điểm.

Kết luận không có CCCD chỉ áp dụng cho phản hồi API profile, không áp dụng cho DB.
Đã đối chiếu chỉ đọc bằng MSSV `102230377` trong mẫu:

- `tmProxDUT`, `DHBK_CDS`, `DATA_SV2`: `dbo.tmHoSoSV.SoCMND` của sinh viên này đang trống.
- `DATA_SV1.dbo.NhanThan`: `MaHS` khớp đúng một bản ghi; `CCCD_So` là số 12 chữ số,
  đuôi `4306`, trùng với số trong cột `cmnd` và khớp mẫu người dùng gửi.
- `NhanThan.MaHS` có kiểu `char(9)` và index không unique `IX_NhanThan_MaHS`.
  Repository bind `sql.Char(9)` và lấy tối đa hai dòng để phát hiện MSSV trùng.

Trang kiểm tra đã bổ sung nguồn DB này sau bước xác thực profile. Ưu tiên
`CCCD_So`; chỉ dùng `cmnd` dự phòng nếu là chuỗi đúng 12 chữ số. Không dùng CMND
9 chữ số thay CCCD. Trường hợp không có dữ liệu hoặc trùng MSSV được hiển thị rõ.

## API và trường dữ liệu

Cả ba API dùng `Authorization: Bearer <DUT SSO token>`, đọc sinh viên hiện tại từ
phiên đăng nhập, không cần truyền MSSV. Không dùng JWT riêng của Student Information
thay DUT SSO token và không cần đổi sang Course Registration JWT.

| Nội dung trong mẫu | API | Trường được client hiện tại sử dụng |
| --- | --- | --- |
| Họ và tên | `GET https://profile.dut.udn.vn/api/profile` | `data.fullName` |
| MSSV | Như trên | `data.studentCardNumber` |
| Ngày sinh | Như trên | `data.birthday` |
| Điện thoại | Như trên | `data.phoneNumber` |
| Lớp sinh hoạt | Như trên | `data.class.name` |
| CCCD | DB trường: `DATA_SV1.dbo.NhanThan` | `MaHS` từ profile → `CCCD_So`; dự phòng `cmnd` nếu đúng 12 chữ số |
| Học kỳ | `GET https://xemdiem.dut.udn.vn/api/stats` | `semesters` hoặc `Kỳ học`/`kyHoc`/`ky_hoc` |
| Tín chỉ đăng ký từng kỳ | Như trên | `creditsPerSemester` hoặc `Số tín chỉ đăng ký từng kì`/`tin_chi_tung_ky` |
| GPA theo kỳ trả về | Như trên | `gpaPerSemester` hoặc `GPA từng kỳ`/`gpa_tung_ky` |
| Điểm rèn luyện | Như trên | `conductPerSemester` hoặc `Điểm rèn luyện từng kỳ`/`drl_tung_ky` |
| Bảng điểm từng học phần | `GET https://xemdiem.dut.udn.vn/api/results` | `semesterCode`, `subjectCode`, `classCode`, `credits`, `score10`, `score4`, `scoreChar`, `subjectTitle`; client cũng hỗ trợ key tiếng Việt |

Phần thống kê/kết quả có thể nằm trong envelope `data`. `results` phục vụ bảng
điểm chi tiết; bảng trong mẫu là tổng hợp theo học kỳ, nên ưu tiên `stats` nếu
đúng định nghĩa nghiệp vụ.

Nguồn đối chiếu:

- `auth-web-test/src/dut-api.js`: endpoint profile/stats/results.
- `auth-web-test/vite.config.js`: ánh xạ host profile và academic.
- `lib/features/profile/data/data_sources/remote_data_source/profile_service.dart`: ánh xạ họ tên, MSSV, ngày sinh, điện thoại, lớp.
- `lib/features/academic/data/stats_repository.dart`: chuẩn hóa các key thống kê tiếng Việt/Anh.
- `lib/features/academic/models/stats_model.dart`: các mảng GPA, tín chỉ, rèn luyện theo kỳ.
- `lib/features/academic/data/results_repository.dart`: bảng điểm chi tiết học phần.

## Những điểm cần xác nhận trước khi điền đơn

- Chú thích Flutter gọi `gpaPerSemester` là `DiemTBTL`. Chưa đủ bằng chứng kết
  luận đây là trung bình học kỳ hay trung bình tích lũy tại mỗi kỳ; cần đối chiếu
  định nghĩa nguồn trước khi gắn nhãn “Điểm TBC học tập”.
- Tín chỉ trong thống kê được client chú thích là `HPDangky`/tín chỉ đăng ký;
  không tự coi là tín chỉ đã đạt hoặc tích lũy.
- Ghép các mảng thống kê đúng vị trí học kỳ. Không lọc bỏ `null` từng mảng rồi
  ghép lại vì có thể đẩy điểm sang kỳ khác. Giữ `0` khác với chưa có điểm.
- Trong dữ liệu lập đơn, kỳ hè `XX21` đã được tính trong kỳ 2 `XX20`; bộ validate
  giữ dòng kỳ chính và loại bản ghi hè trùng, không cộng lại tín chỉ/điểm. JSON
  ở trang kiểm tra API vẫn là phản hồi thô để đối chiếu nguồn.
- Thiếu CCCD hoặc điểm thì để trạng thái chưa có dữ liệu. Giữ CCCD và điện thoại
  dạng chuỗi để không mất số 0 đầu.
- DUT SSO xác định tài khoản; profile và academic API mới là nguồn điền đơn.
  Auth mapper của backend hiện chỉ có định danh Microsoft; context chứng chỉ
  hiện lấy thêm tên/MSSV/lớp từ profile. Luồng tra CCCD chỉ sử dụng MSSV profile
  trả về thành công, không nhận MSSV từ query/body/header tự khai hoặc JWT chưa xác minh.

## Kiểm tra bằng phiên FE đang đăng nhập

Mở `http://localhost:5173/student-data-check.html` trong cùng tab đã đăng nhập và
bấm **Kiểm tra dữ liệu**, hoặc dùng liên kết kiểm tra ở phần tài khoản trên FE chứng chỉ.

Trang gọi `GET /local-api/student-data-check` trên server FE local. Server chỉ
gọi ba GET cố định trên, giữ kết quả/lỗi riêng cho từng API và hiển thị JSON để
đối chiếu những trường client chưa sử dụng. Sau khi profile hợp lệ, gọi service
students để bổ sung CCCD bằng truy vấn tham số hóa, chỉ đọc `MaHS`, `CCCD_So`,
`cmnd` của sinh viên đó. Không đổi Course token hoặc cập nhật dữ liệu DUT.
API kiểm tra không mở trên cổng reviewer. Lỗi DB không làm mất dữ liệu các API còn lại.

Server FE ghi bản tóm tắt tên trường, kiểu dữ liệu, trạng thái có/thiếu, số dòng
và HTTP status tại `.data/student-data-check-summary.json`; không ghi token hay
giá trị hồ sơ/điểm vào bản tóm tắt. Dữ liệu đầy đủ chỉ trả về tab gửi Bearer token.
Mở tab mới từ thanh địa chỉ có thể không có `sessionStorage` của tab cũ.

Test tự động dùng API mô phỏng cho auth, allowlist endpoint, lỗi và lọc
credential; không thay thế việc kiểm tra bằng phiên đăng nhập thật.
