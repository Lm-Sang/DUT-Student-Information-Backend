# Hai SQL Server instance độc lập

Backend có thể dùng đồng thời hai instance trong cùng tiến trình Node.js:

| Nguồn | Kết nối | Xác thực | Cách dùng |
| --- | --- | --- | --- |
| Trường | `DB_HOST_SSH:DB_PORT`, qua SSH hoặc direct | SQL login `primary`/`secondary` | `connectDatabase(account, databaseName)` |
| Local | `localhost:1433`, database `sv_dut` | Tài khoản Windows chạy Node.js | `queryLocalDatabase(sql, params)` hoặc `connectLocalDatabase()` |

`primary` và `secondary` là hai SQL login trên instance trường, không phải hai
instance. Instance local có cấu hình và pool riêng, không dùng login hoặc tunnel
của trường. Việc bật kết nối local không chuyển các API hiện có sang local.

## Cấu hình local

Máy Windows cần Node.js >=24, SQL Server và ODBC driver đã cài. Project khai báo
`msnodesqlv8` là dependency tùy chọn để các máy chỉ dùng DB trường vẫn có thể
chạy. Nếu chưa có native driver, chạy `npm install --include=optional`.
Tài khoản Windows chạy Node.js phải được cấp quyền vào `sv_dut`.

```dotenv
LOCAL_DB_HOST=localhost
LOCAL_DB_PORT=1433
LOCAL_DB_NAME=sv_dut
LOCAL_DB_ODBC_DRIVER=ODBC Driver 17 for SQL Server
LOCAL_DB_ENCRYPT=false
LOCAL_DB_TRUST_SERVER_CERTIFICATE=true
LOCAL_DB_QUERY_TIMEOUT_MS=30000
```

Các giá trị trên cũng là mặc định. Không cần username/password SQL cho local.
Cấu hình `DB_*` và `SSH_*` vẫn dành cho instance trường.
`DB_HOST_SSH` là tên chuẩn cho SQL host của trường. Code cũng nhận cách viết
hoa/thường đã dùng trong `.env`; `DB_HOST` chỉ là fallback cho cấu hình cũ.
Không dùng chung DB_HOST/DB_PORT/DB_ENCRYPT cho cấu hình local: local phải dùng
LOCAL_DB_HOST/LOCAL_DB_PORT/LOCAL_DB_ENCRYPT/LOCAL_DB_TRUST_SERVER_CERTIFICATE.

## Dùng trong repository của feature

Ví dụ hai thao tác chỉ đọc, thực hiện đồng thời trên hai instance:

```js
import {
  connectDatabase,
  queryLocalDatabase,
} from '../../../infrastructure/database/index.js';

const [schoolPool, localResult] = await Promise.all([
  connectDatabase('primary', 'DHBK_CDS'),
  queryLocalDatabase('SELECT DB_NAME() AS databaseName, CAST(? AS nvarchar(50)) AS label', ['local']),
]);

const schoolResult = await schoolPool.request().query('SELECT DB_NAME() AS databaseName');
console.log(schoolResult.recordset); // Kết quả từ mssql/Tedious
console.log(localResult.first);     // Result set đầu tiên từ msnodesqlv8
```

Với local, dùng placeholder `?` và truyền giá trị qua mảng tham số theo đúng thứ
tự. Không nối input người dùng vào chuỗi SQL. Kết quả native có `first` cho result
set đầu tiên và `results` cho nhiều result set; đây là API khác với `mssql`.

Nếu cần transaction hoặc stored procedure, lấy native pool bằng
`const pool = await connectLocalDatabase()` rồi dùng `pool.promises` theo
[API của msnodesqlv8](https://github.com/TimelordUK/node-sqlserver-v8).
Các repository hiện có vẫn dùng `pool.request().input(...).query(...)` của `mssql`.

Khi dùng `npm run dev` hoặc `npm start`, entry point `server.js` chủ động mở cả hai
instance đồng thời và ghi log `[DB:school]` / `[DB:local]`. Nếu một instance lỗi,
server vẫn chạy và báo lỗi riêng; lần truy vấn tiếp theo có thể thử kết nối lại.
Các script chỉ import connector vẫn mở pool khi dùng lần đầu. Không đóng pool
sau từng request HTTP. Khi dừng ứng dụng hoặc kết thúc script, gọi
`disconnectAllDatabases()` sau khi các
truy vấn đang chạy đã kết thúc. Có thể đóng riêng từng nguồn bằng
`disconnectDatabases()` và `disconnectLocalDatabase()`.

`server.js` tự đóng HTTP server và cả hai nguồn DB khi nhận `Ctrl+C` hoặc
`SIGTERM` (bao gồm restart từ Node watch).

Driver local được load trực tiếp từ `msnodesqlv8`. Không import
`mssql/msnodesqlv8` trong feature vì entry point đó thay đổi driver dùng chung
của `mssql`, có thể làm hỏng request trên pool Tedious đang kết nối tới trường.

## Kiểm tra

`npm test` kiểm tra tính độc lập của hai connector bằng fixture. Các công cụ
test:db cũ đã được xóa cùng thư mục scripts. Kiểm tra kết nối thật bằng connector
phía trên, chỉ SELECT metadata cần dùng rồi đóng kết nối. Thành công không tự
sao chép dữ liệu từ trường; việc nhập catalog certification là thao tác riêng.
