import { queryLocalDatabase } from '../../../infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget, localDatabaseGuardSql } from '../../../infrastructure/database/local-write-guard.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { allPayloadColumns, paperColumns, documentColumns, emailColumns, columnValue, payloadFromColumns, departmentToDatabase } from '../domain/request-fields.js';

const department = c => `CASE ${c} WHEN '115' THEN 'DT' WHEN '120' THEN 'CTSV' ELSE ${c} END`;
const actorSelect = `SELECT MaHS AS Id,Hoten AS DisplayName,VaiTro AS Role,${department('MaDV')} AS Department,SoThe AS StudentNumber FROM svc_demo.TaiKhoan`;
const documentSelect = `SELECT IDCode AS termCode,MaVanBan AS code,ID AS sourceId,TenVanBan AS name,${department('MaDVcap')} AS department,
 ThongTinDinhKem AS guidance,LePhiThuong AS normalFee,LePhiNhanh AS rushFee,CONVERT(bit,CASE WHEN KhongMienPhi=0 THEN 1 ELSE 0 END) AS freeAllowed,
 CONVERT(bit,CASE WHEN KhongMienPhi IS NULL THEN 0 ELSE 1 END) AS feePolicyKnown,SoLuongMien_Ngay AS dailyFreeQuota,KhongCapNeuKhongHoc AS registrationRequired FROM svc_demo.Sys_VanBan`;
const selectRequest = `SELECT r.ID AS Id,r.STT AS Number,r.MaHS AS StudentId,r.LoaiDon AS TypeCode,${department('r.MaDV')} AS Department,r.TrangThai AS Status,
 r.IDCode AS SubmittedTerm,r.MaCBND AS AssignedStaffId,r.NgayDeNghi AS CreatedAt,r.NgayCapNhat AS UpdatedAt,r.NgayNhanDon AS ReceivedAt,
 r.NgayHoanTat AS CompletedAt,r.TruongPhanHoi AS LastFeedback,r.KetQuaXuLy AS ResultSummary,r.VaiTroNguoiHuy AS CancelledByRole,
 r.NguoiHuy AS CancelledBy,r.LyDoHuy AS CancelReason,r.NgayHuy AS CancelledAt,r.PhienBan AS Version,r.NgayIn AS PrintedAt,
 r.NgayHenTra AS PickupAt,r.NoiTraHS AS PickupLocation,r.ngaytraHS AS DeliveredAt,r.NgayXuLy AS ProcessedAt,
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
    catch(error){if(/STALE_VERSION|IDEMPOTENCY_CONFLICT/.test(String(error.message)))throw new AppError('Hồ sơ đã thay đổi hoặc mã thao tác đã được dùng. Hãy tải lại.',409);throw error;}
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
  return {
    actors:()=>read(`${actorSelect} WHERE HieuLuc=1 ORDER BY VaiTro,MaHS`),
    actor:async id=>(await read(`${actorSelect} WHERE MaHS=? AND HieuLuc=1`,[id]))[0],
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
    async list(actor){const scope=actor.role==='STUDENT'?'r.MaHS=?':'r.MaDV=?';const value=actor.role==='STUDENT'?actor.id:departmentToDatabase(actor.department);
      const [rows,fields]=await Promise.all([read(`${selectRequest} WHERE ${scope} ORDER BY r.NgayCapNhat DESC,r.ID DESC`,[value]),
        read(`SELECT b.IDDon,b.TenTruong FROM svc_demo.TruongCanBoSung b JOIN svc_demo.DonDeNghi r ON r.ID=b.IDDon WHERE ${scope}`,[value])]);return rows.map(row=>hydrate(row,fields));},
    async get(id){const row=(await read(`${selectRequest} WHERE r.ID=?`,[id]))[0];return row?hydrate(row,await read('SELECT IDDon,TenTruong FROM svc_demo.TruongCanBoSung WHERE IDDon=?',[id])):null;},
    async events(id){const rows=await read(`SELECT e.ID AS Id,e.MaHS AS ActorId,e.VaiTro AS ActorRole,e.ThaoTac AS EventType,e.TrangThaiTruoc AS FromStatus,e.TrangThaiSau AS ToStatus,
      e.NoiDung AS Message,e.NgayLap AS CreatedAt,a.Hoten AS ActorName,e.MaLyDoHuy,e.LyDoMau,e.NoiDungThem,e.NgayXuLy,e.NgayHenTra,e.NoiTraHS,e.QuyTacHenTra
      FROM svc_demo.LichSuXuLyDon e JOIN svc_demo.TaiKhoan a ON a.MaHS=e.MaHS WHERE e.IDDon=? ORDER BY e.ID`,[id]);
      const fields=await read('SELECT f.* FROM svc_demo.LichSuTruongDuLieu f JOIN svc_demo.LichSuXuLyDon e ON e.ID=f.IDLichSu WHERE e.IDDon=?',[id]);
      return rows.map(row=>({...row,Details:{isSimulation:true,...(row.MaLyDoHuy?{cancelReasonCode:row.MaLyDoHuy,presetReason:row.LyDoMau,additionalMessage:row.NoiDungThem}:{}),
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
    async recordPrint(d){await write(b=>`DECLARE @id uniqueidentifier=${b(d.id)},@actor nvarchar(40)=${b(d.actorId)},@key nvarchar(100)=${b(d.key)},@hash varchar(64)=${b(d.hash)},@status varchar(30),@now datetime2(3)=CONVERT(datetime2(3),${b(d.printedAt)},127);
      IF EXISTS(SELECT 1 FROM svc_demo.ChongGuiTrung WITH(UPDLOCK,HOLDLOCK) WHERE MaHS=@actor AND MaThaoTac=@key) BEGIN
       IF EXISTS(SELECT 1 FROM svc_demo.ChongGuiTrung WHERE MaHS=@actor AND MaThaoTac=@key AND (MaBamNoiDung<>@hash OR IDDon<>@id)) THROW 51002,'IDEMPOTENCY_CONFLICT',1;
      END ELSE BEGIN
       SELECT @status=TrangThai FROM svc_demo.DonDeNghi WITH(UPDLOCK,HOLDLOCK) WHERE ID=@id AND PhienBan=${b(d.version)} AND MaCBND=@actor AND (LoaiDon='CONFIRMATION' OR LoaiDon LIKE 'DonSV%')
        AND TrangThai IN('RECEIVED','PROCESSING','NEEDS_INFO','EXTERNAL_PROCESSING','READY','COMPLETED');
       IF @status IS NULL THROW 51001,'STALE_VERSION',1;
       UPDATE svc_demo.DonDeNghi SET NgayIn=@now,NgayCapNhat=@now,PhienBan=PhienBan+1 WHERE ID=@id;
       INSERT svc_demo.LichSuXuLyDon(IDDon,MaHS,VaiTro,ThaoTac,TrangThaiTruoc,TrangThaiSau,NoiDung)
        VALUES(@id,@actor,'STAFF','PRINT',@status,@status,N'Chuyên viên đã xuất file đơn để in và ký bên ngoài.');
       INSERT svc_demo.ChongGuiTrung(MaHS,MaThaoTac,MaBamNoiDung,IDDon) VALUES(@actor,@key,@hash,@id);END`);},
    async update(d){await write(b=>{
      const detail=d.eventDetails||{};const changed=detail.changedFields||[];
      const passwordReply=d.typeCode==='LMS_SUPPORT'&&d.action==='result';
      const publicMessage=passwordReply?'Chuyên viên đã phản hồi mật khẩu. Xem trong chi tiết yêu cầu.':d.message;
      let sql=`DECLARE @id uniqueidentifier=${b(d.id)},@actor nvarchar(40)=${b(d.actorId)},@key nvarchar(100)=${b(d.key)},@hash varchar(64)=${b(d.hash)},@action varchar(30)=${b(d.action)},@role varchar(20)=${b(d.role)},@old varchar(30),@now datetime2(3)=SYSUTCDATETIME();
       IF EXISTS(SELECT 1 FROM svc_demo.ChongGuiTrung WITH(UPDLOCK,HOLDLOCK) WHERE MaHS=@actor AND MaThaoTac=@key) BEGIN
        IF EXISTS(SELECT 1 FROM svc_demo.ChongGuiTrung WHERE MaHS=@actor AND MaThaoTac=@key AND (MaBamNoiDung<>@hash OR IDDon<>@id)) THROW 51002,'IDEMPOTENCY_CONFLICT',1;
       END ELSE BEGIN SELECT @old=TrangThai FROM svc_demo.DonDeNghi WITH(UPDLOCK,HOLDLOCK) WHERE ID=@id AND PhienBan=${b(d.version)};IF @old IS NULL THROW 51001,'STALE_VERSION',1;
       UPDATE svc_demo.DonDeNghi SET TrangThai=${b(d.status)},PhienBan=PhienBan+1,NgayCapNhat=@now,
        MaCBND=CASE WHEN @role='STAFF' THEN COALESCE(MaCBND,@actor) ELSE MaCBND END,NgayNhanDon=CASE WHEN @action='receive' THEN @now ELSE NgayNhanDon END,
        TruongPhanHoi=${b(publicMessage)},VaiTroNguoiHuy=CASE WHEN @action='cancel' THEN @role ELSE VaiTroNguoiHuy END,NguoiHuy=CASE WHEN @action='cancel' THEN @actor ELSE NguoiHuy END,
        LyDoHuy=CASE WHEN @action='cancel' THEN ${b(d.role==='STUDENT'?null:d.message)} ELSE LyDoHuy END,NgayHuy=CASE WHEN @action='cancel' THEN @now ELSE NgayHuy END,
        NgayHoanTat=CASE WHEN @action='complete' OR (@action='result' AND LoaiDon IN('LMS_SUPPORT','CONFIRMATION')) THEN @now ELSE NgayHoanTat END,KetQuaXuLy=CASE WHEN @action='result' THEN ${b(d.message)} ELSE KetQuaXuLy END,
        NgayIn=CASE WHEN @action='supplement' AND LoaiDon='CONFIRMATION' THEN NULL ELSE NgayIn END,
        NgayXuLy=CASE WHEN @action='result' AND LoaiDon='CONFIRMATION' THEN CONVERT(datetime2(3),${b(d.processedAt)},127) WHEN @action='complete' AND LoaiDon LIKE 'DonSV%' THEN @now ELSE NgayXuLy END,
        NgayHenTra=CASE WHEN @action='result' AND LoaiDon='CONFIRMATION' THEN CONVERT(datetime2(3),${b(d.pickupAt)},127) ELSE NgayHenTra END,
        NoiTraHS=CASE WHEN @action='result' AND LoaiDon='CONFIRMATION' THEN ${b(d.pickupLocation)} ELSE NoiTraHS END,
        ngaytraHS=CASE WHEN @action='complete' AND LoaiDon='CONFIRMATION' THEN @now ELSE ngaytraHS END WHERE ID=@id;`;
      if(['requestInfo','supplement','cancel'].includes(d.action))sql+='DELETE FROM svc_demo.TruongCanBoSung WHERE IDDon=@id;';
      if(d.action==='requestInfo')for(const field of d.requiredFields)sql+=`INSERT svc_demo.TruongCanBoSung(IDDon,TenTruong) VALUES(@id,${b(field)});`;
      if(d.action==='supplement')sql+=saveDetails(d,b,true)+revision(d,b,'(SELECT COALESCE(MAX(LanBoSung),0)+1 FROM svc_demo.LichSuNoiDungDon WHERE IDDon=@id)');
      sql+=`INSERT svc_demo.LichSuXuLyDon(IDDon,MaHS,VaiTro,ThaoTac,TrangThaiTruoc,TrangThaiSau,NoiDung,MaLyDoHuy,LyDoMau,NoiDungThem,NgayXuLy,NgayHenTra,NoiTraHS,QuyTacHenTra)
       VALUES(@id,@actor,@role,${b(d.eventType)},@old,${b(d.status)},${b(publicMessage)},${b(detail.cancelReasonCode)},${b(detail.presetReason)},${b(detail.additionalMessage)},CONVERT(datetime2(3),${b(d.processedAt)},127),CONVERT(datetime2(3),${b(d.pickupAt)},127),${b(d.pickupLocation)},${b(detail.appointmentPolicy)});
       DECLARE @event bigint=SCOPE_IDENTITY();`;
      for(const [fields,kind]of [[d.action==='requestInfo'?d.requiredFields:[],'YEU_CAU_BO_SUNG'],[changed,'DA_THAY_DOI']])for(const field of fields)sql+=`INSERT svc_demo.LichSuTruongDuLieu(IDLichSu,TenTruong,LoaiThayDoi) VALUES(@event,${b(field)},${b(kind)});`;
      return sql+`INSERT svc_demo.ChongGuiTrung(MaHS,MaThaoTac,MaBamNoiDung,IDDon) VALUES(@actor,@key,@hash,@id);END`;
    });},
  };
}
