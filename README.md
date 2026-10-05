# DUT Student Information Backend

Backend Node.js/Express duoc to chuc theo **module (feature-first)**. Moi nghiep vu
nam trong mot thu muc rieng, con cau hinh va thanh phan dung chung duoc tach khoi
code nghiep vu.

## Chay du an

```bash
npm install
npm run dev
```

Kiem tra server tai `GET /api/health`.

## Cau hinh moi truong

Sao chep `.env.example` thanh `.env` va dien cac gia tri bi mat. Backend chay
tai cong `3003`. Hai web co origin rieng:

| Web | URL local | CORS env | JWT audience | SSO callback env |
| --- | --- | --- | --- | --- |
| Student | `http://localhost:5173` | `CORS_STUDENT_ORIGINS` | `JWT_STUDENT_AUDIENCE` | `MICROSOFT_SSO_STUDENT_CALLBACK_URL` |
| Admin | `http://localhost:5174` | `CORS_ADMIN_ORIGINS` | `JWT_ADMIN_AUDIENCE` | `MICROSOFT_SSO_ADMIN_CALLBACK_URL` |

Moi bien CORS nhan danh sach origin phan cach bang dau phay. Can dien URL that
cua hai web khi deploy. CORS chi gioi han request tu trinh duyet; API admin van
can middleware xac thuc JWT va kiem tra role truoc khi mo endpoint.

Database ket noi SQL Server qua SSH tunnel: `SSH_HOST` la may nhay SSH,
`DB_HOST` la IP SQL Server ma may SSH truy cap duoc. Hai IP co the khac nhau.
Moi SQL login co default database rieng qua `DB_PRIMARY_DEFAULT_DATABASE` va
`DB_SECONDARY_DEFAULT_DATABASE`; de trong neu muon dung default cua SQL login.

Database co hai pool rieng cho hai muc quyen:

- `primary`: `DB_PRIMARY_USER` / `DB_PRIMARY_PASSWORD`
- `secondary`: `DB_SECONDARY_USER` / `DB_SECONDARY_PASSWORD`

Khi truy van database khac, goi `connectDatabase('primary', 'DATA_SV2')` hoac
`connectDatabase('secondary', 'DATA_GVien1')` tu `src/config/database.js`.
Pool duoc tach theo cap `(account, database)` va SQL Server quyet dinh quyen
truy cap. Ten `primary`/`secondary` khong dong nghia voi student/admin.

Kiem tra SSH, dang nhap SQL, database nhin thay va danh sach bang cua ca hai tai
khoan bang:

```bash
npm run test:db
```

Khong commit file `.env`; file nay da duoc khai bao trong `.gitignore`.

Microsoft SSO trong `D:\res\course-registration` su dung cong SSO cua truong
(`.../microsoft/login?callbackUrl=...`), khong ket noi truc tiep den Microsoft
Entra ID. Hai bien callback phia tren la redirect URL gui den cong SSO, can
duoc cong SSO chap nhan. Repo tham khao khong cung cap tenant ID, client ID hay
SSO signing secret that. `MICROSOFT_SSO_JWT_SECRET` can duoc cap rieng truoc khi
co the xac thuc token SSO. Cac route auth hien moi la khung, chua xu ly callback.

## Cau truc source

```text
src/
|-- config/        # Bien moi truong va ket noi database
|-- modules/
|   |-- auth/      # Shared SSO logic; student/admin entry points
|   |-- students/  # API nghiep vu cua student
|   |-- admin/     # API nghiep vu cua admin
|   |-- users/     # User data dung chung
|   `-- health/
|-- shared/        # Middleware, error va utility dung chung
|-- app.js         # Khoi tao Express app
`-- server.js      # Entry point lang nghe HTTP
```

Moi module export `{ basePath, router }` qua `index.js` va duoc mount trong
`src/app.js`. Ben trong module, luong phu thuoc la:

`route -> controller -> service -> repository`.

## Tai lieu kien truc

- [Thiet ke SSO va tich hop Course Registration](docs/AUTH_AND_COURSE_REGISTRATION_INTEGRATION.md)
