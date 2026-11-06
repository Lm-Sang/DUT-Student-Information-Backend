import {AppError} from '../../../shared/errors/app-error.js';
import {studentService} from './student.service.js';
import {createStudentAcademicRepository} from '../repositories/student-academic.repository.js';
import {normalizeAcademicStatistics} from '../validators/academic-statistics.validator.js';
export {normalizeAcademicStatistics} from '../validators/academic-statistics.validator.js';
export function createStudentApplicationDataService({identityService=studentService,academicRepository=createStudentAcademicRepository()}={}) {
  async function prefill(actor) {
    if(actor?.role!=='student')throw new AppError('Cần hồ sơ sinh viên đã xác thực.',403);
    return{student:await identityService.getApplicationProfile(actor)};
  }
  return Object.freeze({prefill,async snapshot(actor,accessToken) {
    if(actor?.role!=='student')throw new AppError('Cần hồ sơ sinh viên đã xác thực.',403);
    const [profile,data]=await Promise.all([prefill(actor),academicRepository.statistics(accessToken)]);
    return{...profile,academicRows:normalizeAcademicStatistics(data),academicSource:'https://xemdiem.dut.udn.vn/api/stats'};
  }});
}
