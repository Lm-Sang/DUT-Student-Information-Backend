import {AppError} from '../../../shared/errors/app-error.js';
import {reasons,semesterChoices,validatePeriod,applicationView} from '../domain/academic-leave.rules.js';
import {normalizeAcademicRows} from '../../students/index.js';

export function createAcademicLeaveService({repository,snapshotProvider,clock=()=>new Date()}={}) {
  const snapshotView=snapshot=>({...snapshot,academicRows:normalizeAcademicRows(snapshot.academicRows)});
  const view=row=>applicationView(row?.snapshot?{...row,snapshot:snapshotView(row.snapshot)}:row,clock());
  const student=actor=>{if(actor?.role!=='student')throw new AppError('Cần tài khoản sinh viên.',403);};
  const reviewer=actor=>{if(actor?.role!=='reviewer')throw new AppError('Cần quyền chuyên viên.',403);};
  async function get(actor,id){
    const row=await repository.get(actor,id);
    if(!row)throw new AppError('Không tìm thấy đơn của tài khoản này.',404);
    return row;
  }
  function expectedVersion(row,expected){if(row.rowVersion!==expected)throw new AppError('Đơn đã được cập nhật. Vui lòng tải lại.',409);}
  async function period(actor,input) {
    const currentCode=await repository.currentSemesterCode();
    const parent=input.parentApplicationId?await get(actor,input.parentApplicationId):null;
    validatePeriod(input,currentCode,parent);
    return parent;
  }
  return Object.freeze({
    async form(actor,accessToken) {
      student(actor);
      const [currentCode,prefill,parents]=await Promise.all([repository.currentSemesterCode(),snapshotProvider(actor,accessToken),repository.eligibleParents(actor)]);
      return {reasons,semesters:semesterChoices(currentCode),minSemesterCount:1,maxSemesterCount:4,paperSubmissionDays:3,
        prefill:snapshotView(prefill),eligibleParents:parents.map(view)};
    },
    async list(actor,query){const result=await repository.list(actor,query);return{...result,items:result.items.map(view)};},
    async get(actor,id){return view(await get(actor,id));},
    async save(actor,input,id=null,expected=null) {
      student(actor);
      if(id){const row=await get(actor,id);expectedVersion(row,expected);
        if(!['draft','needs_changes'].includes(row.status))throw new AppError('Chỉ sửa bản nháp hoặc đơn cần bổ sung.',409);}
      await period(actor,input);
      return view(await repository.save(actor,input,id,expected));
    },
    async confirm(actor,id,expected,accessToken) {
      student(actor);
      const row=await get(actor,id);expectedVersion(row,expected);
      if(!['draft','needs_changes'].includes(row.status))throw new AppError('Đơn đã được xác nhận hoặc không thể xác nhận.',409);
      const parent=await period(actor,row);
      const snapshot=await snapshotProvider(actor,accessToken),profile=snapshot.student;
      if(profile?.studentCode!==actor.studentCode)throw new AppError('Thông tin lập đơn không khớp tài khoản.',403);
      const date=profile.birthday;
      if(!profile.fullName?.trim()||!profile.className?.trim()||!profile.phoneNumber?.trim()||
        !/^\d{12}$/.test(profile.cccd??'')||!/^\d{4}-\d{2}-\d{2}$/.test(date??'')||
        !Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)
        throw new AppError('Hồ sơ chưa đủ họ tên, ngày sinh, CCCD, điện thoại hoặc lớp. Vui lòng đối chiếu dữ liệu nguồn trước khi xác nhận lập đơn.',422);
      return view(await repository.confirm(actor,id,expected,{...snapshotView(snapshot),parentRequestCode:parent?.requestCode??null}));
    },
    async review(actor,id,expected,input) {
      reviewer(actor);const row=await get(actor,id);expectedVersion(row,expected);
      if(row.status!=='submitted')throw new AppError('Chỉ xét duyệt đơn đang chờ.',409);
      return view(await repository.review(actor,id,expected,input));
    },
    async receivePaper(actor,id,expected) {
      reviewer(actor);const row=await get(actor,id);expectedVersion(row,expected);
      if(row.status!=='approved'||Date.parse(row.paperDeadlineAt)<clock().getTime())throw new AppError('Đơn chưa được duyệt hoặc đã quá hạn nộp giấy 3 ngày.',409);
      return view(await repository.receivePaper(actor,id,expected));
    },
    async cancel(actor,id,expected) {
      student(actor);const row=await get(actor,id);expectedVersion(row,expected);
      if(!['draft','needs_changes'].includes(row.status))throw new AppError('Chỉ hủy bản nháp hoặc đơn cần bổ sung.',409);
      return view(await repository.cancel(actor,id,expected));
    },
    async printable(actor,id) {
      const row=view(await get(actor,id));
      if(!row.canPrint||!row.snapshot)throw new AppError('Cần xác nhận lập đơn trước khi in.',409);
      return row;
    },
    async printableByCode(actor,requestCode) {
      const row=view(await repository.getByRequestCode(actor,requestCode));
      if(!row)throw new AppError('Không tìm thấy đơn của tài khoản này.',404);
      if(!row.canPrint||!row.snapshot)throw new AppError('Cần xác nhận lập đơn trước khi in.',409);
      return row;
    },
  });
}
