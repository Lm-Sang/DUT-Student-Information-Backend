# Quy tắc thời hạn chứng chỉ và học vụ

Thời gian tính theo ngày lịch, mỗi ngày 24 giờ, timestamp UTC. Đúng mốc hạn chưa tính trễ; quá mốc mới tính trễ.

| Hồ sơ | Tiếp nhận | Xử lý | Kết quả |
| --- | --- | --- | --- |
| Chứng chỉ ngoại ngữ, tin học | 1 ngày từ lần gửi thành công hiện tại | 13 ngày (1 tuần 6 ngày) từ lúc chuyển `processing` | Không quá 14 ngày từ lần gửi hiện tại, kể cả tiếp nhận trễ |
| Ngừng học, gia hạn, trở lại học | 1 ngày từ lần sinh viên xác nhận gửi hiện tại | 5 ngày từ lúc xác nhận nhận giấy tại quầy (`paperReceivedAt`) | Kết thúc bằng `approved`/`rejected` |

Chờ sinh viên nộp giấy (`received`) không tính vào 5 ngày xử lý. Mốc nộp giấy +3 ngày đã có được giữ nguyên. Gửi lại sau yêu cầu bổ sung bắt đầu lại kỳ tính hạn từ lần gửi mới. Đơn nháp, đang bổ sung, đã kết thúc hoặc hủy không hiển thị trễ đang chờ xử lý. Đây là cảnh báo hiện tại, không phải thống kê lịch sử vi phạm SLA.

API danh sách và chi tiết trả thêm:

```json
{
  "status": "processing",
  "deadlineStatus": "overdue",
  "overdue": true,
  "overdueTags": ["processing", "result"],
  "deadlines": {
    "intakeAt": "2026-11-02T08:00:00.000Z",
    "processingAt": "2026-11-15T08:00:00.000Z",
    "resultAt": "2026-11-15T08:00:00.000Z",
    "paperSubmissionAt": null
  }
}
```

`deadlineStatus`: `on_time` hoặc `overdue`. `overdueTags`: `intake` (trễ tiếp nhận), `processing` (trễ xử lý), `result` (chứng chỉ quá tổng 14 ngày), `paper_submission` (sinh viên trễ nộp giấy). Có thể có nhiều tag. Timestamp chưa tồn tại trả `null`; không suy đoán hạn từ thời điểm tạo nháp hoặc cập nhật gần nhất.

Frontend hiển thị badge **Trễ** khi `deadlineStatus=overdue`, gắn nhãn theo `overdueTags`. `status`, bộ lọc trạng thái, `allowedActions`, phân quyền và optimistic concurrency giữ nguyên để đơn trễ vẫn được tiếp nhận/xử lý. Không có cron ghi trạng thái trễ xuống DB; API tính tại thời điểm đọc bằng cùng quy tắc cho sinh viên và chuyên viên. Không cần migration cho phần thời hạn.

Quy tắc dùng chung nằm tại [request-regulations](../src/common/request-regulations/index.js); kiểm thử offline tại [request-deadlines.test.js](../tests/common/request-regulations/request-deadlines.test.js). Bộ dựng lại DB local tại [Database_newversion](../Database_newversion/README.md).
