import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import express from 'express';
import {createWebTestApp} from '../certification-web-test/server.js';
import {createLocalCertificationsModules} from '../certification-web-test/backend-module.js';
import {createAcademicLeaveRepository} from '../src/modules/academic-leave/repositories/academic-leave.repository.js';
import {queryLocalDatabase as query,disconnectAllDatabases} from '../src/infrastructure/database/index.js';
import {errorHandler} from '../src/shared/middlewares/error-handler.middleware.js';
import {AppError} from '../src/shared/errors/app-error.js';
import {closeCertificationConnections} from '../src/modules/certifications/index.js';
import {pdfRenderer} from '../src/infrastructure/pdf/chromium-pdf.js';
const schema='preview_leave_'+randomBytes(6).toString('hex');
await query((await readFile('docs/sql/academic-leave.sql','utf8')).replaceAll('academic_leave',schema));
const servers=[];
async function listen(app){const server=createServer(app);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));servers.push(server);return 'http://127.0.0.1:'+server.address().port;}
let student,reviewer;
const apiApp=express();apiApp.use(express.json());apiApp.use((req,res,next)=>{
 if([student,reviewer].includes(req.headers.origin))res.set({'Access-Control-Allow-Origin':req.headers.origin,'Access-Control-Allow-Credentials':'true',
 'Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type,If-Match'});
 if(req.method==='OPTIONS')return res.sendStatus(204);next();
});
const api=await listen(apiApp);
student=await listen(createWebTestApp({apiBaseUrl:api,ssoBaseUrl:'https://sso.dut.udn.vn'}));
reviewer=await listen(createWebTestApp({apiBaseUrl:api,ssoBaseUrl:'https://sso.dut.udn.vn',mode:'reviewer'}));
const repository=createAcademicLeaveRepository({query:(text,params)=>query(text.replaceAll('academic_leave.',schema+'.'),params),
 connect:async()=>({request:()=>({query:async()=>({recordset:[{code:'2610'}]})})})});
const actor={role:'student',source:'auth',reference:'fixture-student',studentCode:'999260001',name:'Sinh viên kiểm thử',className:'TEST',cohortYear:2026,birthday:'2005-02-20',phoneNumber:'0000000000'};
const modules=createLocalCertificationsModules({authConfig:{devMode:true,nodeEnv:'test',reviewerOrigin:reviewer},
 studentContextProvider:async req=>{if(req.headers.authorization!=='Bearer fixture-token')throw new AppError('Need login',401);return actor;},
 leave:{repository,snapshotProvider:async account=>({student:{studentCode:account.studentCode,fullName:actor.name,className:'TEST',birthday:'2005-02-20',phoneNumber:'0000000000',cccd:'000000000001'},
 academicRows:[{semester:'2510',credits:18,gpa:3.8,conduct:82},{semester:'2520',credits:21,gpa:3.9,conduct:87}]})}});
for(const module of Object.values(modules))apiApp.use(module.basePath,module.router);apiApp.use(errorHandler);
apiApp.post('/__test/close',(_req,res)=>{res.json({closing:true});setTimeout(close,25);});
await writeFile('.data/leave-preview-urls.json',JSON.stringify({api,student,reviewer,schema}));
console.log(JSON.stringify({api,student,reviewer,syntheticDataOnly:true}));
let closing=false;
async function close(){if(closing)return;closing=true;closeCertificationConnections();for(const server of servers)server.closeAllConnections();
 await Promise.all(servers.map(server=>new Promise(resolve=>server.close(resolve))));
 if(!/^preview_leave_[0-9a-f]{12}$/.test(schema))throw new Error('Unsafe test schema');
 await query(`DROP TABLE ${schema}.Applications;DROP SCHEMA ${schema};`);await pdfRenderer.close();await disconnectAllDatabases();process.exit(0);}
process.on('SIGINT',close);process.on('SIGTERM',close);
