import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const origin='http://localhost:5173',sessions=[],checks=[];
const accounts=JSON.parse(await readFile(new URL('../.data/rbac-integration/test-accounts.private.json',import.meta.url),'utf8'));
async function call(path,{token,method='GET',body,status=200}={}){
 const response=await fetch(origin+path,{method,headers:{Origin:origin,...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
 assert.equal(response.status,status,method+' '+path);const result=await response.json().catch(()=>null);checks.push({method,path,status});return result?.data;
}
async function login(username,channel='admin'){
 const account=accounts.find(a=>a.username===username);assert(account);
 const data=await call('/api/'+channel+'/auth/login',{method:'POST',body:{username,password:account.password}});sessions.push({token:data.accessToken,channel});return data;
}
try{
 for(const path of ['/api/admin/organization/catalog','/api/admin/certifications/applications','/api/admin/it-certifications/applications','/api/admin/academic-leave/applications','/api/admin/requests','/api/student/certifications/catalog','/api/student/academic-leave/form'])await call(path,{status:401});
 for(const path of ['/','/portal-ui.js','/organization-ui.js','/catalog-ui.js','/modules/hoc-vu/index.html','/modules/hoc-vu/reviewer.html','/modules/hoc-vu/academic-leave.html','/modules/hoc-vu/web-auth.js','/modules/hoc-vu/deadlines.js']){const r=await fetch(origin+path);assert.equal(r.status,200,path);checks.push({path,status:200});}
 const all=await login('chuyenvien.dt.test');assert.deepEqual(all.user.tags.taskIds,[1,2,3,4]);
 for(const path of ['/api/admin/certifications/applications','/api/admin/it-certifications/applications','/api/admin/it-certifications/records','/api/admin/academic-leave/applications','/api/admin/certifications/management/catalog'])await call(path,{token:all.accessToken});
 const staff=await login('chuyenvien.dt.test','staff');await call('/api/admin/requests',{token:staff.accessToken});
 await call('/api/admin/certifications/applications',{token:staff.accessToken,status:401});await call('/api/admin/requests',{token:all.accessToken,status:401});
 const course=await login('chuyenvien.hocvu.test');await call('/api/admin/academic-leave/applications',{token:course.accessToken});await call('/api/admin/certifications/applications',{token:course.accessToken,status:403});await call('/api/admin/it-certifications/applications',{token:course.accessToken,status:403});
 const cert=await login('chuyenvien.chungchi.test');await call('/api/admin/it-certifications/applications',{token:cert.accessToken});await call('/api/admin/academic-leave/applications',{token:cert.accessToken,status:403});await call('/api/admin/organization/accounts',{token:cert.accessToken,status:403});
 const manager=await login('admin.dt.test');await call('/api/admin/organization/accounts',{token:manager.accessToken});await call('/api/admin/organization/catalog',{token:manager.accessToken});
 for(const path of ['/api/admin/organization/progress/1','/api/admin/organization/progress/2','/api/admin/organization/progress/3','/api/admin/organization/progress/4','/api/admin/certifications/applications','/api/admin/academic-leave/applications'])await call(path,{token:manager.accessToken});
 await call('/api/admin/certifications/management/catalog',{token:manager.accessToken,status:403});
 await call('/api/admin/certifications/applications/00000000-0000-0000-0000-000000000001/review',{token:manager.accessToken,method:'POST',body:{decision:'processing'},status:403});
 const root=await login('quantri.rbac.test');await call('/api/admin/organization/accounts',{token:root.accessToken});await call('/api/admin/academic-leave/applications',{token:root.accessToken,status:403});
 console.log(JSON.stringify({checks:checks.length,canonicalApi:true,taskIsolation:true,audienceIsolation:true,managerReadOnly:true,rootCannotProcess:true,frontendProxy:true}));
 await writeFile(new URL('../.data/rbac-integration/http-smoke.json',import.meta.url),JSON.stringify(checks,null,2));
}finally{for(const session of sessions)await call('/api/'+session.channel+'/auth/logout',{token:session.token,method:'POST',body:{}}).catch(()=>{});}
