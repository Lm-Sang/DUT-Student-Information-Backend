import {createRbacRepository} from './rbac.repository.js';
import {actionPermission} from '../domain/rbac.js';
import { queryLocalDatabase } from '../../../infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget, localDatabaseGuardSql } from '../../../infrastructure/database/local-write-guard.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { allPayloadColumns, paperColumns, documentColumns, emailColumns, columnValue, payloadFromColumns, departmentToDatabase } from '../domain/request-fields.js';
import { workKey } from '../domain/work-permissions.js';

const department = c => `CASE ${c} WHEN '115' THEN 'DT' WHEN '120' THEN 'CTSV' ELSE ${c} END`;
const actorSelect = `SELECT MaHS AS Id,Hoten AS DisplayName,VaiTro AS Role,${department('MaDV')} AS Department,SoThe AS StudentNumber,PhienBanQuyen AS PermissionVersion,NguonDanhTinh AS IdentitySource,MaHSTruong AS SchoolId FROM svc_demo.TaiKhoan`;
const documentSelect = `SELECT IDCode AS termCode,MaVanBan AS code,ID AS sourceId,TenVanBan AS name,${department('MaDVcap')} AS department,
 ThongTinDinhKem AS guidance,LePhiThuong AS normalFee,LePhiNhanh AS rushFee,CONVERT(bit,CASE WHEN KhongMienPhi=0 THEN 1 ELSE 0 END) AS freeAllowed,
 CONVERT(bit,CASE WHEN KhongMienPhi IS NULL THEN 0 ELSE 1 END) AS feePolicyKnown,SoLuongMien_Ngay AS dailyFreeQuota,KhongCapNeuKhongHoc AS registrationRequired FROM svc_demo.Sys_VanBan`;
const selectRequest = `SELECT r.ID AS Id,r.STT AS Number,r.MaHS AS StudentId,r.LoaiDon AS TypeCode,${department('r.MaDV')} AS Department,r.TrangThai AS Status,
 r.IDCode AS SubmittedTerm,r.MaCBND AS AssignedStaffId,r.NgayDeNghi AS CreatedAt,r.NgayCapNhat AS UpdatedAt,r.NgayNhanDon AS ReceivedAt,
 r.NgayHoanTat AS CompletedAt,r.TruongPhanHoi AS LastFeedback,r.KetQuaXuLy AS ResultSummary,r.VaiTroNguoiHuy AS CancelledByRole,
 r.NguoiHuy AS CancelledBy,r.LyDoHuy AS CancelReason,r.NgayHuy AS CancelledAt,r.PhienBan AS Version,r.NgayIn AS PrintedAt,
 r.NgayHenTra AS PickupAt,r.NoiTraHS AS PickupLocation,r.ngaytraHS AS DeliveredAt,r.NgayXuLy AS ProcessedAt,r.NgayInGanNhat AS LastPrintedAt,r.QuyTacHenTra AS AppointmentPolicy,
 a.Hoten AS StudentName,a.SoThe AS StudentNumber,s.Hoten AS AssignedStaffName,
 ${Object.values(paperColumns).map(c=>`p.[${c}]`).join(',')},${Object.values(documentColumns).map(c=>`v.[${c}]`).join(',')},
 ${Object.values(emailColumns).map(c=>`e.[${c}]`).join(',')},v.IDCode AS CatalogTerm,v.LePhi AS UnitFee,
 vb.TenVanBan AS DocumentName,vb.ThongTinDinhKem AS Guidance,vb.LePhiThuong AS NormalFee,vb.LePhiNhanh AS RushFee,
 vb.KhongMienPhi,vb.SoLuongMien_Ngay AS DailyFreeQuota,vb.KhongCapNeuKhongHoc AS RegistrationRequired
 FROM svc_demo.DonDeNghi r JOIN svc_demo.TaiKhoan a ON a.MaHS=r.MaHS LEFT JOIN svc_demo.TaiKhoan s ON s.MaHS=r.MaCBND
 LEFT JOIN svc_demo.His_InDon p ON p.ID=r.ID LEFT JOIN svc_demo.DeNghiVanBan v ON v.ID=r.ID
 LEFT JOIN svc_demo.DeNghiEmail e ON e.ID=r.ID LEFT JOIN svc_demo.Sys_VanBan vb ON vb.IDCode=v.IDCode AND vb.MaVanBan=v.MaVanban`;
function hydrate(row, fields=[]) {
  if (!row) return row;
  row.Payload = payloadFromColumns(row);
  row.RequiredFields = fields.filter(f=>f.IDDon.toLowerCase()===row.Id.toLowerCase()).map(f=>f.TenTruong);
  row.CatalogSnapshot = row.TypeCode === 'CONFIRMATION' ? { termCode: row.CatalogTerm,code:row.MaVanban,name:row.DocumentName,
    department:row.Department,guidance:row.Guidance,normalFee:row.NormalFee,rushFee:row.RushFee,freeAllowed:row.KhongMienPhi===false||row.KhongMienPhi===0,
    feePolicyKnown:row.KhongMienPhi!==null && row.KhongMienPhi!==undefined,
    feeMode:row.Payload.feeMode,serviceSpeed:row.Payload.serviceSpeed,quantity:row.SoLuong,
    dailyFreeQuota:row.DailyFreeQuota,registrationRequired:row.RegistrationRequired,unitFee:row.UnitFee,totalFee:row.UnitFee*row.SoLuong,
    isEstimate:true,eligibilityVerified:false,source:'DATA_GVien1.Sys_VanBan' } : null;
  return row;
}
function typedValues(payload, columns, bind) {
  return Object.keys(columns).map(key=>bind(columnValue(key,payload)));
}
export function createRequestsRepository({ query=queryLocalDatabase, guard=assertLocalDemoTarget }={}) {
  async function read(sql,params=[]) { guard(); return (await query(sql,params)).first; }
  async function write(build) {
    guard();const params=[];const bind=value=>{params.push(value??null);return '?';};const sql=build(bind);
    try {return (await query(`SET NOCOUNT ON;SET XACT_ABORT ON;${localDatabaseGuardSql}
      BEGIN TRY BEGIN TRANSACTION;${sql} COMMIT TRANSACTION;END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;THROW;END CATCH;`,params)).first;}
    catch(error){if(/IDENTITY_CONFLICT/.test(String(error.message)))throw new AppError('Mã hồ sơ đã liên kết với MSSV khác. Cần kiểm tra dữ liệu trước khi mở hồ sơ.',409,{code:'STUDENT_IDENTITY_CONFLICT'});if(/STALE_VERSION|IDEMPOTENCY_CONFLICT/.test(String(error.message)))throw new AppError('Hồ sơ hoặc quyền đã thay đổi; hãy tải lại và kiểm tra người phụ trách.',409);if(/PERMISSION_REVOKED/.test(String(error.message)))throw new AppError('Quyền xử lý đã thay đổi; hãy tải lại.',403);throw error;}
  }
  function saveDetails(d,b,update=false) {
    const columns=d.typeCode==='CONFIRMATION'?documentColumns:d.typeCode==='LMS_SUPPORT'?emailColumns:paperColumns;
    const table=d.typeCode==='CONFIRMATION'?'DeNghiVanBan':d.typeCode==='LMS_SUPPORT'?'DeNghiEmail':'His_InDon';
    if(update) return `UPDATE svc_demo.${table} SET ${Object.entries(columns).map(([k,c])=>`[${c}]=${b(columnValue(k,d.payload))}`).join(',')}${table==='DeNghiVanBan'?`,LePhi=${b(d.catalogSnapshot.unitFee)}`:''} WHERE ID=@id;`;
    return `INSERT svc_demo.${table}(ID,${Object.values(columns).map(c=>`[${c}]`).join(',')}${table==='DeNghiVanBan'?',IDCode,LePhi':''}) VALUES(@id,${typedValues(d.payload,columns,b).join(',')}${table==='DeNghiVanBan'?`,${b(d.catalogSnapshot.termCode)},${b(d.catalogSnapshot.unitFee)}`:''});`;
  }
  function revision(d,b,number) {
    return `INSERT svc_demo.LichSuNoiDungDon(IDDon,LanBoSung,NguoiLap,LoaiDon,${Object.values(allPayloadColumns).map(c=>`[${c}]`).join(',')})
      VALUES(@id,${number},@actor,${b(d.typeCode)},${typedValues(d.payload,allPayloadColumns,b).join(',')});`;
  }
  function staffMutationGuard(d,b) {
    const key=workKey({typeCode:d.typeCode,payload:d.payload});
    return `IF @role='STAFF' BEGIN
      IF NOT EXISTS(SELECT 1 FROM svc_demo.vQuyenHieuLuc WITH(UPDLOCK,HOLDLOCK) WHERE MaHS=@actor AND MaQuyen=${b(actionPermission(d.action)||'invalid')}) OR NOT EXISTS(SELECT 1 FROM svc_demo.vQuyenHieuLuc WHERE MaHS=@actor AND MaQuyen='requests.view') THROW 51003,'PERMISSION_REVOKED',1;
      ${d.key?.startsWith('xlsx:')?"IF NOT EXISTS(SELECT 1 FROM svc_demo.vQuyenHieuLuc WITH(UPDLOCK,HOLDLOCK) WHERE MaHS=@actor AND MaQuyen='workbook.import') THROW 51003,'PERMISSION_REVOKED',1;":''}
      IF NOT EXISTS(SELECT 1 FROM svc_demo.vQuyenXuLy WITH(UPDLOCK,HOLDLOCK) WHERE MaHS=@actor AND MaCongViec=${b(key)} AND QuyenNhanDon=1 AND QuyenXuLy=1) THROW 51003,'PERMISSION_REVOKED',1;
      IF EXISTS(SELECT 1 FROM svc_demo.DonDeNghi WHERE ID=@id AND MaCBND IS NOT NULL AND MaCBND<>@actor) THROW 51001,'STALE_VERSION',1;
      IF @action='receive' AND (@old<>'SUBMITTED' OR EXISTS(SELECT 1 FROM svc_demo.DonDeNghi WHERE ID=@id AND MaCBND IS NOT NULL)) THROW 51001,'STALE_VERSION',1;
    END ELSE IF @role='STUDENT' BEGIN
      IF @action<>'cancel' OR NOT EXISTS(SELECT 1 FROM svc_demo.DonDeNghi WHERE ID=@id AND MaHS=@actor) THROW 51003,'PERMISSION_REVOKED',1;
    END ELSE THROW 51003,'PERMISSION_REVOKED',1;`;
  }
  function updateSql(d,b) {
      const detail=d.eventDetails||{};const changed=detail.changedFields||[];
      const passwordReply=d.typeCode==='LMS_SUPPORT'&&d.action==='result';
      const publicMessage=passwordReply?'Chuyên viên đã phản hồi mật khẩu. Xem trong chi tiết yêu cầu.':d.message;
      let sql=`DECLARE @id uniqueidentifier=${b(d.id)},@actor nvarchar(40)=${b(d.actorId)},@key nvarchar(100)=${b(d.key)},@hash varchar(64)=${b(d.hash)},@action varchar(30)=${b(d.action)},@role varchar(20)=${b(d.role)},@old varchar(30),@now datetime2(3)=SYSUTCDATETIME();
       IF EXISTS(SELECT 1 FROM svc_demo.ChongGuiTrung WITH(UPDLOCK,HOLDLOCK) WHERE MaHS=@actor AND MaThaoTac=@key) BEGIN
        IF EXISTS(SELECT 1 FROM svc_demo.ChongGuiTrung WHERE MaHS=@actor AND MaThaoTac=@key AND (MaBamNoiDung<>@hash OR IDDon<>@id)) THROW 51002,'IDEMPOTENCY_CONFLICT',1;
       END ELSE BEGIN SELECT @old=TrangThai FROM svc_demo.DonDeNghi WITH(UPDLOCK,HOLDLOCK) WHERE ID=@id AND PhienBan=${b(d.version)};IF @old IS NULL OR @old IN('COMPLETED','CANCELLED') THROW 51001,'STALE_VERSION',1;
       ${staffMutationGuard(d,b)}
       UPDATE svc_demo.DonDeNghi SET TrangThai=${b(d.status)},PhienBan=PhienBan+1,NgayCapNhat=@now,
        MaCBND=CASE WHEN @role='STAFF' THEN COALESCE(MaCBND,@actor) ELSE MaCBND END,NgayNhanDon=CASE WHEN @action='receive' THEN @now ELSE NgayNhanDon END,
        TruongPhanHoi=${b(publicMessage)},VaiTroNguoiHuy=CASE WHEN @action='cancel' THEN @role ELSE VaiTroNguoiHuy END,NguoiHuy=CASE WHEN @action='cancel' THEN @actor ELSE NguoiHuy END,
        LyDoHuy=CASE WHEN @action='cancel' THEN ${b(d.role==='STUDENT'?null:d.message)} ELSE LyDoHuy END,NgayHuy=CASE WHEN @action='cancel' THEN @now ELSE NgayHuy END,
        NgayHoanTat=CASE WHEN @action='complete' OR (@action='result' AND LoaiDon IN('LMS_SUPPORT','CONFIRMATION')) THEN @now ELSE NgayHoanTat END,KetQuaXuLy=CASE WHEN @action='result' THEN ${b(d.message)} ELSE KetQuaXuLy END,
        NgayIn=CASE WHEN @action='supplement' AND LoaiDon='CONFIRMATION' THEN NULL ELSE NgayIn END,
        NgayXuLy=CASE WHEN @action='result' AND LoaiDon='CONFIRMATION' THEN CONVERT(datetime2(3),${b(d.processedAt)},127) WHEN @action='complete' AND LoaiDon LIKE 'DonSV%' THEN @now ELSE NgayXuLy END,
        NgayHenTra=NgayHenTra,
        NoiTraHS=NoiTraHS,
        ngaytraHS=CASE WHEN @action='complete' AND LoaiDon='CONFIRMATION' THEN @now ELSE ngaytraHS END WHERE ID=@id;`;
      if(['requestInfo','supplement','cancel'].includes(d.action))sql+='DELETE FROM svc_demo.TruongCanBoSung WHERE IDDon=@id;';
      if(d.action==='requestInfo')for(const field of d.requiredFields)sql+=`INSERT svc_demo.TruongCanBoSung(IDDon,TenTruong) VALUES(@id,${b(field)});`;
      if(d.action==='supplement')sql+=saveDetails(d,b,true)+revision(d,b,'(SELECT COALESCE(MAX(LanBoSung),0)+1 FROM svc_demo.LichSuNoiDungDon WHERE IDDon=@id)');
      sql+=`INSERT svc_demo.LichSuXuLyDon(IDDon,MaHS,VaiTro,ThaoTac,TrangThaiTruoc,TrangThaiSau,NoiDung,MaLyDoHuy,LyDoMau,NoiDungThem,NgayXuLy,NgayHenTra,NoiTraHS,QuyTacHenTra)
       VALUES(@id,@actor,@role,${b(d.eventType)},@old,${b(d.status)},${b(publicMessage)},${b(detail.cancelReasonCode)},${b(detail.presetReason)},${b(detail.additionalMessage)},CONVERT(datetime2(3),${b(d.processedAt)},127),CONVERT(datetime2(3),${b(d.pickupAt)},127),${b(d.pickupLocation)},${b(detail.appointmentPolicy)});
       DECLARE @event bigint=SCOPE_IDENTITY();`;
      for(const [fields,kind]of [[d.action==='requestInfo'?d.requiredFields:[],'YEU_CAU_BO_SUNG'],[changed,'DA_THAY_DOI']])for(const field of fields)sql+=`INSERT svc_demo.LichSuTruongDuLieu(IDLichSu,TenTruong,LoaiThayDoi) VALUES(@event,${b(field)},${b(kind)});`;
      return sql+`INSERT svc_demo.ChongGuiTrung(MaHS,MaThaoTac,MaBamNoiDung,IDDon) VALUES(@actor,@key,@hash,@id);END`;
  }
  function printSql(d,b) {
    return `DECLARE @id uniqueidentifier=${b(d.id)},@actor nvarchar(40)=${b(d.actorId)},@key nvarchar(100)=${b(d.key)},@hash varchar(64)=${b(d.hash)},@status varchar(30),@first datetime2(3),@type varchar(20),@work varchar(60),@now datetime2(3)=CONVERT(datetime2(3),${b(d.printedAt)},127);
    IF EXISTS(SELECT 1 FROM svc_demo.ChongGuiTrung WITH(UPDLOCK,HOLDLOCK) WHERE MaHS=@actor AND MaThaoTac=@key) BEGIN
      IF EXISTS(SELECT 1 FROM svc_demo.ChongGuiTrung WHERE MaHS=@actor AND MaThaoTac=@key AND (MaBamNoiDung<>@hash OR IDDon<>@id)) THROW 51002,'IDEMPOTENCY_CONFLICT',1;
    END ELSE BEGIN
      SELECT @status=r.TrangThai,@first=COALESCE(r.NgayIn,@now),@type=r.LoaiDon,@work=CASE WHEN r.LoaiDon='CONFIRMATION' THEN 'CONFIRMATION:'+v.MaVanban ELSE r.LoaiDon END
      FROM svc_demo.DonDeNghi r WITH(UPDLOCK,HOLDLOCK) LEFT JOIN svc_demo.DeNghiVanBan v ON v.ID=r.ID
      WHERE r.ID=@id AND r.PhienBan=${b(d.version)} AND r.MaCBND=@actor AND r.LoaiDon='CONFIRMATION'
      AND r.TrangThai IN('RECEIVED','PROCESSING','NEEDS_INFO','EXTERNAL_PROCESSING','READY','COMPLETED');
      IF @status IS NULL THROW 51001,'STALE_VERSION',1;
      IF NOT EXISTS(SELECT 1 FROM svc_demo.vQuyenXuLy WITH(UPDLOCK,HOLDLOCK) WHERE MaHS=@actor AND MaCongViec=@work AND QuyenXuLy=1 AND QuyenNhanDon=1) THROW 51003,'PERMISSION_REVOKED',1;
      IF NOT EXISTS(SELECT 1 FROM svc_demo.vQuyenHieuLuc WITH(UPDLOCK,HOLDLOCK) WHERE MaHS=@actor AND MaQuyen='requests.print') OR NOT EXISTS(SELECT 1 FROM svc_demo.vQuyenHieuLuc WHERE MaHS=@actor AND MaQuyen='requests.view') THROW 51003,'PERMISSION_REVOKED',1;
      ${d.key?.startsWith('xlsx:')?"IF NOT EXISTS(SELECT 1 FROM svc_demo.vQuyenHieuLuc WITH(UPDLOCK,HOLDLOCK) WHERE MaHS=@actor AND MaQuyen='workbook.import') THROW 51003,'PERMISSION_REVOKED',1;":''}
      UPDATE svc_demo.DonDeNghi SET NgayIn=@first,NgayInGanNhat=@now,NgayCapNhat=SYSUTCDATETIME(),PhienBan=PhienBan+1,
        NgayHenTra=CASE WHEN @type='CONFIRMATION' AND (@status NOT IN('READY','COMPLETED') OR NgayHenTra IS NULL) THEN DATEADD(day,3,@first) ELSE NgayHenTra END,
        NoiTraHS=CASE WHEN @type='CONFIRMATION' THEN COALESCE(NoiTraHS,N'Khu Hành chính một cửa') ELSE NoiTraHS END,
        QuyTacHenTra=CASE WHEN @type='CONFIRMATION' AND (@status NOT IN('READY','COMPLETED') OR NgayHenTra IS NULL) THEN 'THREE_CALENDAR_DAYS_FROM_PRINT' ELSE QuyTacHenTra END WHERE ID=@id;
      INSERT svc_demo.LichSuXuLyDon(IDDon,MaHS,VaiTro,ThaoTac,TrangThaiTruoc,TrangThaiSau,NoiDung,NgayIn,NgayHenTra,NoiTraHS,QuyTacHenTra)
      SELECT @id,@actor,'STAFF','PRINT',@status,@status,${b(d.message||'Chuyên viên đã xuất file đơn để in và ký bên ngoài.')},@first,NgayHenTra,NoiTraHS,QuyTacHenTra FROM svc_demo.DonDeNghi WHERE ID=@id;
      INSERT svc_demo.ChongGuiTrung(MaHS,MaThaoTac,MaBamNoiDung,IDDon) VALUES(@actor,@key,@hash,@id);
    END`;
  }
  return {
    async syncSchoolStudent(p){
      const id='sso:'+String(p.MaHS).trim();if(id.length>40)throw new AppError('Mã hồ sơ trường vượt giới hạn.',400);
      const a=p.academic||{},semesters=p.semesterResults||[];
      await write(b=>`DECLARE @id nvarchar(40)=${b(id)};
        IF EXISTS(SELECT 1 FROM svc_demo.TaiKhoan WITH(UPDLOCK,HOLDLOCK) WHERE MaHS=@id AND (NguonDanhTinh<>'SSO' OR VaiTro<>'STUDENT')) THROW 51003,'PERMISSION_REVOKED',1;
        IF EXISTS(SELECT 1 FROM svc_demo.TaiKhoan WHERE MaHS=@id AND ISNULL(SoThe,'')<>${b(p.SoTheSV)}) THROW 51004,'IDENTITY_CONFLICT',1;
        IF EXISTS(SELECT 1 FROM svc_demo.TaiKhoan WHERE MaHS=@id AND HieuLuc=0) THROW 51003,'PERMISSION_REVOKED',1;
        IF NOT EXISTS(SELECT 1 FROM svc_demo.TaiKhoan WHERE MaHS=@id) INSERT svc_demo.TaiKhoan(MaHS,Hoten,VaiTro,SoThe,NguonDanhTinh,MaHSTruong) VALUES(@id,${b(p.Hoten)},'STUDENT',${b(p.SoTheSV)},'SSO',${b(String(p.MaHS))});
        ELSE UPDATE svc_demo.TaiKhoan SET Hoten=${b(p.Hoten)},SoThe=${b(p.SoTheSV)} WHERE MaHS=@id;
        IF NOT EXISTS(SELECT 1 FROM svc_demo.NhanThan WHERE MaHS=@id) INSERT svc_demo.NhanThan(MaHS) VALUES(@id);
        UPDATE svc_demo.NhanThan SET Hoten=${b(p.Hoten)},SoThe=${b(p.SoTheSV)},Lop=${b(p.ClassName??p.MaLop)},NgaySinh=${b(p.DateOfBirth??p.Ngaysinh)},NoiSinh=${b(p.BirthPlace??p.NoiSinh)},GioiTinh=${b(p.Gender??(p.Gioitinh===1?'Nam':p.Gioitinh===0?'Nữ':null))},DanToc=${b(p.Ethnicity??p.DanToc)},SoCCCD=${b(p.IdentityNumber??p.SoCMND)},DienThoai=${b(p.Phone??p.Mobile)},TenNganhTQ=${b(p.ProgramName)},NguonDuLieu=${b(p.Source||'DATA_GVien1.tmHoSoSV')},DuLieuThuNghiem=0,TongTinChiChuongTrinh=${b(a.requiredCredits??null)},TinChiTichLuy=${b(a.earnedCredits??null)},DiemTBCTL=${b(a.cumulativeGpa??null)},DiemTBRL=${b(a.conductAverage??null)},NgayCapNhat=SYSUTCDATETIME() WHERE MaHS=@id;
        DELETE FROM svc_demo.KetQuaHocTapHocKy WHERE MaHS=@id;
        ${semesters.map(s=>`INSERT svc_demo.KetQuaHocTapHocKy(MaHS,IDCode,ThuTu,TenKH,SoTinChi,SoTinChiHocLai,DiemTBCHB,DiemTBC,DiemTBCTL,CoDiemDuoi5,DiemRL)
          VALUES(@id,${b(s.termCode)},${b(s.sortOrder)},${b(s.termName)},${b(s.credits)},${b(s.repeatedCredits)},${b(s.scholarshipAverage)},${b(s.gpa)},${b(s.cumulativeGpa)},${b(s.hasLowGrade)},${b(s.conductScore)});`).join('\n')}`);
      return id;
    },
    actors:()=>read(`${actorSelect} WHERE HieuLuc=1 AND NguonDanhTinh='DEMO' ORDER BY VaiTro,MaHS`),
    async actor(id){
      const row=(await read(`${actorSelect} WHERE MaHS=? AND HieuLuc=1`,[id]))[0];if(!row)return null;
      const[permissions,roles,login]=await Promise.all([read('SELECT DISTINCT MaQuyen FROM svc_demo.vQuyenHieuLuc WHERE MaHS=?',[id]),read('SELECT r.MaRole AS id,r.TenRole AS name,r.HieuLuc AS active FROM svc_demo.TaiKhoanVaiTro u JOIN svc_demo.VaiTroRBAC r ON r.MaRole=u.MaRole WHERE u.MaHS=?',[id]),read('SELECT TenDangNhap AS username FROM svc_demo.DangNhapChuyenVien WHERE MaHS=?',[id])]);
      row.Permissions=permissions.map(p=>p.MaQuyen);row.WorkPermissions=row.Permissions.filter(p=>p.startsWith('work:')).map(p=>p.slice(5));row.Roles=roles;row.Username=login[0]?.username??null;return row;
    },
    async staff(){
      const[people,permissions,roles,logins]=await Promise.all([read(`${actorSelect} WHERE VaiTro='STAFF' AND HieuLuc=1 ORDER BY MaDV,Hoten`),read('SELECT DISTINCT MaHS,MaQuyen FROM svc_demo.vQuyenHieuLuc'),read('SELECT u.MaHS,r.MaRole AS id,r.TenRole AS name,r.HieuLuc AS active FROM svc_demo.TaiKhoanVaiTro u JOIN svc_demo.VaiTroRBAC r ON r.MaRole=u.MaRole'),read('SELECT MaHS,TenDangNhap AS username FROM svc_demo.DangNhapChuyenVien')]);
      return people.map(row=>{const keys=permissions.filter(p=>p.MaHS===row.Id).map(p=>p.MaQuyen);return{...row,Permissions:keys,WorkPermissions:keys.filter(p=>p.startsWith('work:')).map(p=>p.slice(5)),Roles:roles.filter(p=>p.MaHS===row.Id).map(({MaHS,...role})=>role),Username:logins.find(l=>l.MaHS===row.Id)?.username??null};});
    },
    async workbookSecret(){return (await read("SELECT GiaTri FROM svc_demo.CauHinh WHERE MaCauHinh='workbookSigningKey'"))[0]?.GiaTri;},
    async setPermissions({adminId,staffId,version,keys}){return createRbacRepository({query,guard}).legacy(adminId,staffId,version,keys);},
    async reassign(d){await write(b=>`DECLARE @id uniqueidentifier=${b(d.id)},@admin nvarchar(40)=${b(d.adminId)},@target nvarchar(40)=${b(d.staffId)},@previous nvarchar(40),@status varchar(30),@work varchar(60),@key nvarchar(100)=${b(d.key)},@hash varchar(64)=${b(d.hash)};
      IF NOT EXISTS(SELECT 1 FROM svc_demo.TaiKhoan WHERE MaHS=@admin AND HieuLuc=1 AND (VaiTro='ADMIN' OR EXISTS(SELECT 1 FROM svc_demo.vQuyenHieuLuc WITH(UPDLOCK,HOLDLOCK) WHERE MaHS=@admin AND MaQuyen='requests.reassign'))) THROW 51003,'PERMISSION_REVOKED',1;
      IF EXISTS(SELECT 1 FROM svc_demo.ChongGuiTrung WITH(UPDLOCK,HOLDLOCK) WHERE MaHS=@admin AND MaThaoTac=@key) BEGIN
       IF NOT EXISTS(SELECT 1 FROM svc_demo.ChongGuiTrung WHERE MaHS=@admin AND MaThaoTac=@key AND MaBamNoiDung=@hash AND IDDon=@id) THROW 51002,'IDEMPOTENCY_CONFLICT',1;
      END ELSE BEGIN
       SELECT @previous=r.MaCBND,@status=r.TrangThai,@work=CASE WHEN r.LoaiDon='CONFIRMATION' THEN 'CONFIRMATION:'+v.MaVanban ELSE r.LoaiDon END FROM svc_demo.DonDeNghi r WITH(UPDLOCK,HOLDLOCK) LEFT JOIN svc_demo.DeNghiVanBan v ON v.ID=r.ID WHERE r.ID=@id AND r.PhienBan=${b(d.version)};
       IF @previous IS NULL OR @previous=@target OR @status IN('SUBMITTED','COMPLETED','CANCELLED','READY') THROW 51001,'STALE_VERSION',1;
       IF NOT EXISTS(SELECT 1 FROM svc_demo.TaiKhoan a JOIN svc_demo.vQuyenXuLy q WITH(UPDLOCK,HOLDLOCK) ON q.MaHS=a.MaHS WHERE a.MaHS=@target AND a.VaiTro='STAFF' AND a.HieuLuc=1 AND q.MaCongViec=@work AND q.QuyenNhanDon=1 AND q.QuyenXuLy=1 AND EXISTS(SELECT 1 FROM svc_demo.vQuyenHieuLuc WHERE MaHS=@target AND MaQuyen='requests.view')) THROW 51003,'PERMISSION_REVOKED',1;
       UPDATE svc_demo.DonDeNghi SET MaCBND=@target,PhienBan=PhienBan+1,NgayCapNhat=SYSUTCDATETIME() WHERE ID=@id;
       INSERT svc_demo.LichSuXuLyDon(IDDon,MaHS,VaiTro,ThaoTac,TrangThaiTruoc,TrangThaiSau,NoiDung,MaCBTruoc,MaCBSau,LyDoBanGiao) VALUES(@id,@admin,'ADMIN','REASSIGN',@status,@status,${b(d.message)},@previous,@target,${b(d.reason)});
       INSERT svc_demo.ChongGuiTrung(MaHS,MaThaoTac,MaBamNoiDung,IDDon) VALUES(@admin,@key,@hash,@id);
      END`);},
    async profile(id) {
      const row=(await read('SELECT * FROM svc_demo.NhanThan WHERE MaHS=?',[id]))[0];if(!row)return null;
      const results=await read('SELECT * FROM svc_demo.KetQuaHocTapHocKy WHERE MaHS=? ORDER BY ThuTu,IDCode',[id]);
      const dob=row.NgaySinh?new Date(row.NgaySinh):null;
      return {name:row.Hoten,studentNumber:row.SoThe,className:row.Lop,dateOfBirth:dob?`${String(dob.getUTCDate()).padStart(2,'0')}/${String(dob.getUTCMonth()+1).padStart(2,'0')}/${dob.getUTCFullYear()}`:'',
        identityNumber:row.SoCCCD,phone:row.DienThoai,birthPlace:row.NoiSinh,gender:row.GioiTinh,ethnicity:row.DanToc,programName:row.TenNganhTQ,
        photoKind:row.LoaiAnh,...(row.AnhSinhVien?{photoBase64:Buffer.from(row.AnhSinhVien).toString('base64')}:{}),source:row.NguonDuLieu,isSimulation:Boolean(row.DuLieuThuNghiem),
        academic:{requiredCredits:row.TongTinChiChuongTrinh,earnedCredits:row.TinChiTichLuy,cumulativeGpa:row.DiemTBCTL,conductAverage:row.DiemTBRL},
        semesterResults:results.map(s=>({termCode:s.IDCode,termName:s.TenKH,credits:s.SoTinChi,repeatedCredits:s.SoTinChiHocLai,scholarshipAverage:s.DiemTBCHB,gpa:s.DiemTBC,cumulativeGpa:s.DiemTBCTL,hasLowGrade:s.CoDiemDuoi5,conductScore:s.DiemRL}))};
    },
    async catalogs(){const [terms,programs,settings,documents,supportSystems]=await Promise.all([
      read('SELECT IDCode AS code,TenKH AS name,ThuTu AS sortOrder,Hientai AS selectable FROM svc_demo.tmKehoach ORDER BY ThuTu'),
      read('SELECT MaNganhTQ AS code,TenNganhTQ AS name FROM svc_demo.tmNganhTQ WHERE HieuLuc=1 ORDER BY TenNganhTQ'),
      read('SELECT MaCauHinh AS SettingKey,GiaTri AS SettingValue,NgayDongBo AS ObservedAt FROM svc_demo.CauHinh'),
      read(`${documentSelect} WHERE HieuLuc=1 ORDER BY MaVanBan`),read('SELECT MaEmail AS code,TenDenghi AS name FROM svc_demo.Sys_Email WHERE HieuLuc=1 ORDER BY MaEmail')]);return {terms,programs,settings,documents,supportSystems};},
    async list(actor){if(actor.role==='STAFF'&&!actor.permissions?.includes('requests.view'))return[];const scope=actor.role==='ADMIN'?'1=1':actor.role==='STUDENT'?'r.MaHS=?':`(r.MaCBND=? OR EXISTS(SELECT 1 FROM svc_demo.vQuyenXuLy q WHERE q.MaHS=? AND q.QuyenNhanDon=1 AND q.QuyenXuLy=1 AND q.MaCongViec=CASE WHEN r.LoaiDon='CONFIRMATION' THEN 'CONFIRMATION:'+v.MaVanban ELSE r.LoaiDon END))`;
      const params=actor.role==='ADMIN'?[]:actor.role==='STUDENT'?[actor.id]:[actor.id,actor.id];
      const rows=await read(`${selectRequest} WHERE ${scope} ORDER BY r.NgayCapNhat DESC,r.ID DESC`,params);
      return rows.map(row=>hydrate(row));},
    async get(id){const row=(await read(`${selectRequest} WHERE r.ID=?`,[id]))[0];return row?hydrate(row,await read('SELECT IDDon,TenTruong FROM svc_demo.TruongCanBoSung WHERE IDDon=?',[id])):null;},
    async events(id){const rows=await read(`SELECT e.ID AS Id,e.MaHS AS ActorId,e.VaiTro AS ActorRole,e.ThaoTac AS EventType,e.TrangThaiTruoc AS FromStatus,e.TrangThaiSau AS ToStatus,
      e.NoiDung AS Message,e.NgayLap AS CreatedAt,a.Hoten AS ActorName,e.MaLyDoHuy,e.LyDoMau,e.NoiDungThem,e.NgayXuLy,e.NgayHenTra,e.NoiTraHS,e.QuyTacHenTra,e.MaCBTruoc,e.MaCBSau,e.LyDoBanGiao,e.NgayIn
      FROM svc_demo.LichSuXuLyDon e JOIN svc_demo.TaiKhoan a ON a.MaHS=e.MaHS WHERE e.IDDon=? ORDER BY e.ID`,[id]);
      const fields=await read('SELECT f.* FROM svc_demo.LichSuTruongDuLieu f JOIN svc_demo.LichSuXuLyDon e ON e.ID=f.IDLichSu WHERE e.IDDon=?',[id]);
      return rows.map(row=>({...row,Details:{isSimulation:true,...(row.MaCBTruoc?{previousStaffId:row.MaCBTruoc,assignedStaffId:row.MaCBSau,reason:row.LyDoBanGiao}:{}),...(row.NgayIn?{printedAt:row.NgayIn}:{}),...(row.MaLyDoHuy?{cancelReasonCode:row.MaLyDoHuy,presetReason:row.LyDoMau,additionalMessage:row.NoiDungThem}:{}),
        ...(row.NgayHenTra?{processedAt:row.NgayXuLy,pickupAt:row.NgayHenTra,pickupLocation:row.NoiTraHS,appointmentPolicy:row.QuyTacHenTra}:{}),
        ...(row.EventType==='REQUESTINFO'?{requiredFields:fields.filter(f=>f.IDLichSu===row.Id&&f.LoaiThayDoi==='YEU_CAU_BO_SUNG').map(f=>f.TenTruong)}:{}),
        ...(row.EventType==='SUPPLEMENT'?{changedFields:fields.filter(f=>f.IDLichSu===row.Id&&f.LoaiThayDoi==='DA_THAY_DOI').map(f=>f.TenTruong)}:{})}}));},
    revisions:async id=>(await read('SELECT *,LanBoSung AS RevisionNo,NgayLap AS CreatedAt,LoaiDon AS TypeCode FROM svc_demo.LichSuNoiDungDon WHERE IDDon=? ORDER BY LanBoSung',[id])).map(r=>({...r,Payload:payloadFromColumns(r)})),
    async receipt(actor,key,hash){const row=(await read('SELECT IDDon,MaBamNoiDung FROM svc_demo.ChongGuiTrung WHERE MaHS=? AND MaThaoTac=?',[actor,key]))[0];if(row&&row.MaBamNoiDung!==hash)throw new AppError('Mã thao tác đã được sử dụng với nội dung khác.',409);return row?.IDDon;},
    async create(d){const rows=await write(b=>`DECLARE @actor nvarchar(40)=${b(d.actorId)},@key nvarchar(100)=${b(d.key)},@hash varchar(64)=${b(d.hash)},@existing uniqueidentifier;
      SELECT @existing=IDDon FROM svc_demo.ChongGuiTrung WITH(UPDLOCK,HOLDLOCK) WHERE MaHS=@actor AND MaThaoTac=@key;
      IF @existing IS NOT NULL BEGIN IF EXISTS(SELECT 1 FROM svc_demo.ChongGuiTrung WHERE MaHS=@actor AND MaThaoTac=@key AND MaBamNoiDung<>@hash) THROW 51002,'IDEMPOTENCY_CONFLICT',1;SELECT @existing AS Id;END
      ELSE BEGIN DECLARE @id uniqueidentifier=${b(d.id)},@created datetime2(3)=CONVERT(datetime2(3),${b(d.createdAt)},127);
       INSERT svc_demo.DonDeNghi(ID,MaHS,LoaiDon,MaDV,TrangThai,IDCode,PhienBan,NgayDeNghi,NgayCapNhat) VALUES(@id,@actor,${b(d.typeCode)},${b(departmentToDatabase(d.department))},'SUBMITTED',${b(d.term)},1,@created,@created);
       ${saveDetails(d,b)} ${revision(d,b,'1')}
       INSERT svc_demo.LichSuXuLyDon(IDDon,MaHS,VaiTro,ThaoTac,TrangThaiSau,NoiDung) VALUES(@id,@actor,'STUDENT','SUBMITTED','SUBMITTED',N'Sinh viên đã gửi đơn.');
       INSERT svc_demo.ChongGuiTrung(MaHS,MaThaoTac,MaBamNoiDung,IDDon) VALUES(@actor,@key,@hash,@id);SELECT @id AS Id;END`);return rows[0].Id;},
    async recordPrint(d){await write(b=>printSql(d,b));},
    async update(d){await write(b=>updateSql(d,b));},
    async batchUpdate(commands){await write(b=>{
      // One bound JSON parameter avoids SQL Server's 2100-parameter ceiling. It is not persisted.
      const values=[],capture=value=>{const n=values.push(value??null)-1;return `(SELECT [value] FROM OPENJSON(@batchValues) WHERE [key]='${n}')`;};
      const sql=commands.map((d,i)=>(d.action==='print'?printSql(d,capture):updateSql(d,capture)).replace(/(?<!@)@(?!batchValues\b)(\w+)/g,(_,name)=>'@r'+i+'_'+name)).join('\n');
      return `DECLARE @batchValues nvarchar(max)=${b(JSON.stringify(values))};${sql}`;
    });},
  };
}
