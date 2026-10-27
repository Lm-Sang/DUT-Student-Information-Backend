import {randomUUID} from 'node:crypto';
import {AppError} from '../../../shared/errors/app-error.js';
import {parseRole,parseAccount,parseAssignments,requirePermission,requireManagement,isDefaultStaffPermission} from '../domain/rbac.js';
import {hashStaffPassword,verifyStaffPassword} from './staff-password.service.js';
import {actorDto} from '../mappers/requests.mapper.js';

export function createRbacService(repository,requestsRepository){
 async function availableRoles(){return(await repository.roles()).map(r=>r.id);}
 return{
  async overview(actor){requireManagement(actor);const[roles,permissions]=await Promise.all([repository.roles(),repository.permissions()]);return{roles,permissions:permissions.filter(p=>!isDefaultStaffPermission(p.key)),defaultPermissions:permissions.filter(p=>isDefaultStaffPermission(p.key))};},
  async save(actor,id,input){requirePermission(actor,'rbac.roles.manage');const available=(await repository.permissions()).map(p=>p.key),editing=Boolean(id),value=parseRole(input,available,editing),roleId=id||randomUUID();value.permissions=value.permissions.filter(key=>!isDefaultStaffPermission(key));if(id&&!/^[\w:-]{1,64}$/.test(id))throw new AppError('Role không hợp lệ.',400);await repository.saveRole(actor.id,roleId,value,editing);return(await repository.roles()).find(r=>r.id===roleId);},
  async history(actor,id){requireManagement(actor);return repository.history(id);},
  async createAccount(actor,input){requirePermission(actor,'rbac.staff.manage');const data=parseAccount(input,await availableRoles()),hash=await hashStaffPassword(data.password),id='cv:'+randomUUID();await repository.createAccount(actor.id,id,data,hash);return actorDto(await requestsRepository.actor(id));},
  async assign(actor,id,input){requirePermission(actor,'rbac.staff.manage');const data=parseAssignments(input,await availableRoles());await repository.assign(actor.id,id,data);return actorDto(await requestsRepository.actor(id));},
  async login(input){if(!input||typeof input.username!=='string'||typeof input.password!=='string'||Object.keys(input).some(k=>!['username','password'].includes(k))||input.username.length>64||input.password.length>128)throw new AppError('Thông tin đăng nhập không hợp lệ.',400);const credentials=await repository.credentials(input.username.trim().toLowerCase());const valid=await verifyStaffPassword(input.password,credentials?.passwordHash);if(!credentials||!valid)throw new AppError('Tên đăng nhập hoặc mật khẩu không đúng.',401);return actorDto(await requestsRepository.actor(credentials.id));},
 };
}
