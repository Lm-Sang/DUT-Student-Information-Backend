import {AppError} from '../../../shared/errors/app-error.js';
import {studentService} from './student.service.js';
import {createStudentAcademicRepository} from '../repositories/student-academic.repository.js';
import {normalizeAcademicStatistics} from '../validators/academic-statistics.validator.js';
export {normalizeAcademicStatistics} from '../validators/academic-statistics.validator.js';
export function createStudentApplicationDataService({identityService=studentService,academicRepository=createStudentAcademicRepository()}={}) {
  return Object.freeze({async snapshot(actor,accessToken) {
    if(actor?.role!=='student')throw new AppError('Cần hồ sơ sinh viên đã xác thực.',403);
    const [identity,data]=await Promise.all([identityService.getIdentityForAuthenticatedStudent(actor),academicRepository.statistics(accessToken)]);
    return{student:{studentCode:actor.studentCode,fullName:actor.name,birthday:actor.birthday?.slice(0,10)??'',
      phoneNumber:actor.phoneNumber??'',className:actor.className??'',cccd:identity.cccd,cccdSource:identity.source},
      academicRows:normalizeAcademicStatistics(data),academicSource:'https://xemdiem.dut.udn.vn/api/stats'};
  }});
}
