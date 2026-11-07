// Compatibility command: provision specialists through canonical auth hierarchy.
import { parseArgs } from 'node:util';
import { authRepository } from '../../src/common/auth/repositories/auth.repository.js';
import { organizationRepository } from '../../src/common/auth/repositories/organization.repository.js';
import { verifyPassword } from '../../src/common/auth/services/password.service.js';
import { createOrganizationService } from '../../src/admin/modules/organization/services/organization.service.js';
import { disconnectLocalDatabase } from '../../src/infrastructure/database/index.js';
import { assertLocalDemoTarget } from '../../src/infrastructure/database/local-write-guard.js';
try {
  const {values}=parseArgs({options:{manager:{type:'string'},username:{type:'string'},name:{type:'string'},field:{type:'string'},permissions:{type:'string',default:''},roles:{type:'string',default:''},'env-password':{type:'boolean',default:false}}});
  assertLocalDemoTarget();
  const password=process.env.DUT_STAFF_BOOTSTRAP_PASSWORD,managerPassword=process.env.DUT_AUTH_MANAGER_PASSWORD;
  if(!values['env-password']||!password||!managerPassword||!values.manager)throw new Error('Use --manager NAME --username NAME --name DISPLAY --field DT --permissions work:DonSV01,work:academic-leave:leave --env-password. Set DUT_AUTH_MANAGER_PASSWORD and DUT_STAFF_BOOTSTRAP_PASSWORD privately in the process environment.');
  const manager=await authRepository.findLocalByUsername(values.manager);
  if(!await verifyPassword(managerPassword,manager?.passwordHash)||!manager?.isActive)throw new Error('Invalid auth manager credentials');
  const actor={authorizationStatus:'active',organization:manager.organization};
  const permissions=values.permissions?values.permissions.split(','):[],roleIds=values.roles?values.roles.split(','):[];
  const account=await createOrganizationService(organizationRepository).saveAccount(actor,null,{username:values.username,password,
    displayName:values.name,accessLevel:'specialist',fieldCode:values.field,permissions,roleIds});
  console.log(JSON.stringify({accountId:account.accountId,username:account.username,role:account.accessLevel,fieldCode:account.fieldCode,taskIds:account.taskIds}));
} catch(error){console.error(error.message);process.exitCode=1;}
finally{await disconnectLocalDatabase();}
