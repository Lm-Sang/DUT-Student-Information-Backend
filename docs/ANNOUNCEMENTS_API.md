# API thông báo

API chỉ đọc từ `DATA_SV1.dbo.ThongBao` bằng tài khoản SQL `secondary`.

| Method | Route | Mục đích |
| --- | --- | --- |
| GET | `/api/public/announcements?pageIndex=1&pageSize=20` | Danh sách thông báo phân trang |
| GET | `/api/public/announcements/:id` | Nội dung một thông báo |

`pageIndex` mặc định 1. `pageSize` mặc định 20, tối đa 100. Danh sách sắp xếp theo `Ngaydang DESC, ID DESC`; trả `items`, `totalRecords`, `pageIndex`, `pageSize`, `totalPages`. Danh sách không tải `Noidung`.

Chỉ trả thông báo có `Hide` bằng `NULL` hoặc `0` và `Ngaydang` không ở tương lai. Cùng điều kiện được dùng cho cả danh sách và chi tiết; thông báo ẩn hoặc không tồn tại trả `404` khi tra theo ID.

Mỗi item có `id`, `code`, `title`, `postedAt`, `author`, `category`, `subcategory`. Chi tiết thêm `contentHtml`. `Tieude` và `Noidung` trong SQL được lưu dưới dạng URL encoded, nên API giải mã trước khi trả JSON. `contentHtml` là HTML nguồn; giao diện cần làm sạch HTML trước khi chèn vào DOM.

Query hoặc ID sai trả `400`; lỗi SQL/SSH trả `503` với thông báo đã lược bỏ thông tin kết nối. API không có route ghi dữ liệu.
