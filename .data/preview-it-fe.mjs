import express from 'express';
import cors from 'cors';
import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
import {createWebTestApp} from '../certification-web-test/server.js';
import {createLocalCertificationsModules} from '../certification-web-test/backend-module.js';
import {MemoryRepository,MemoryStorage} from '../tests/support/certifications.js';
import {MemoryItRepository} from '../tests/support/it-certifications.js';
import {errorHandler} from '../src/shared/middlewares/error-handler.middleware.js';
import {certificationEvents} from '../src/modules/certifications/services/certification-events.js';
const servers=[];
const listen=app=>new Promise(resolve=>{const server=app.listen(0,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port));servers.push(server);});
const backend=express();backend.use(cors({origin:true,credentials:true}));
const apiBaseUrl=await listen(backend),storage=new MemoryStorage(),it=new MemoryItRepository();
storage.presignUpload=async(key,type)=>({url:apiBaseUrl+'/objects/'+key,method:'PUT',headers:{'Content-Type':type,'If-None-Match':'*'}});
storage.download=async key=>apiBaseUrl+'/objects/'+key;
backend.put('/objects/{*key}',express.raw({type:['image/png','image/jpeg'],limit:'20mb'}),(req,res)=>{
 const key=req.path.slice('/objects/'.length);if(storage.objects.has(key))return res.sendStatus(412);
 storage.objects.set(key,req.body);res.sendStatus(200);
});
backend.get('/objects/{*key}',(req,res)=>{const bytes=storage.objects.get(req.path.slice('/objects/'.length));if(!bytes)return res.sendStatus(404);res.type('png').send(bytes);});
backend.use(express.json());
const studentUrl=await listen(createWebTestApp({apiBaseUrl,ssoBaseUrl:'http://127.0.0.1:1'}));
const reviewerUrl=await listen(createWebTestApp({apiBaseUrl,ssoBaseUrl:'http://127.0.0.1:1',mode:'reviewer'}));
const modules=createLocalCertificationsModules({language:{repository:new MemoryRepository(),storage},it:{repository:it,storage},
 authConfig:{nodeEnv:'test',devMode:true,reviewerOrigin:reviewerUrl},studentContextProvider:async()=>({role:'student',source:'auth',reference:'preview-student',
  name:'Sinh viên kiểm thử',studentCode:'102240377',cohortYear:2024,className:'24T1'})});
for(const module of Object.values(modules))backend.use(module.basePath,module.router);
backend.get('/fixture-summary',(_req,res)=>res.json({eventConnections:certificationEvents.size,applications:it.applications.size,
 records:[...it.applications.values()].map(r=>({id:r.Id,status:r.Status,SoHieu:r.Submissions[0].Certificate.SoHieu,files:r.Submissions[0].Files.length}))}));
backend.use(errorHandler);
await sharp(Buffer.from('<svg width="900" height="700"><rect width="900" height="700" fill="white"/><text x="40" y="45" font-size="26">IT CERTIFICATE PREVIEW</text>'+Array.from({length:22},(_,i)=>'<rect x="40" y="'+(80+i*24)+'" width="750" height="8"/>').join('')+'</svg>')).png().toFile('.data/it-fe-fixture.png');
await writeFile('.data/it-fe-preview-urls.json',JSON.stringify({studentUrl,reviewerUrl,apiBaseUrl}));
console.log(JSON.stringify({studentUrl,reviewerUrl,apiBaseUrl}));
const close=()=>{certificationEvents.closeAll();for(const server of servers)server.close();};process.once('SIGINT',close);process.once('SIGTERM',close);
