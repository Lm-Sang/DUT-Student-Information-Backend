import { randomBytes } from 'node:crypto';
import { Router, raw } from 'express';
import { AppError } from '../../../shared/errors/app-error.js';
import { authenticate, authService } from '../../auth/index.js';
import { env } from '../../../config/env.js';
import { parseId } from '../dto/requests.dto.js';

export function createRequestsRouter(controller, service, { admin, workbook, school, rbac } = {}) {
  const router = Router();
  const sessions = new Map();
  router.use((req, res, next) => {
    const address = req.socket.remoteAddress;
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)) throw new AppError('Bản thử chỉ truy cập từ máy local.', 403);
    if (req.headers.origin) {
      let host;
      try { host = new URL(req.headers.origin).hostname; } catch { throw new AppError('Origin không hợp lệ.', 403); }
      if (!['localhost', '127.0.0.1', '[::1]'].includes(host)) throw new AppError('Bản thử chỉ chấp nhận Origin local.', 403);
    }
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.get('/actors', controller.actors);
  router.get('/sso/config', (_req,res)=>res.json({data:{loginUrl:env.app.url+'/api/student/auth/microsoft/login',frontendUrl:env.app.studentFrontendUrl}}));
  function openSession(actor,claims=null,parentToken=null) {
    for(const[key,s]of sessions)if(s.expiresAt<Date.now())sessions.delete(key);
    if(sessions.size>=1000)throw new AppError('Đã đạt giới hạn phiên thử nghiệm.',429);
    const token=randomBytes(32).toString('hex'),expiresAt=Math.min(Date.now()+2*3600000,claims?.exp?claims.exp*1000:Infinity);
    sessions.set(token,{actorId:actor.id,expiresAt,parentToken});return{token,actor,expiresAt};
  }
  if(school)router.post('/sso/session',authenticate('student'),async(req,res)=>{
    if(Object.keys(req.body||{}).length)throw new AppError('Không nhận mã sinh viên từ client.',400);
    const id=await school.signIn(req.user),actor=await service.sessionActor(id);res.json({data:openSession(actor,req.user,req.headers.authorization.slice(7))});
  });
  if(rbac){
    const attempts=new Map();let pending=0;
    router.post('/staff/session',async(req,res)=>{
      const key=req.socket.remoteAddress;let record=attempts.get(key);if(!record||record.until<Date.now())record={count:0,until:Date.now()+600000};attempts.set(key,record);
      if(record.count>=10||pending>=8)throw new AppError('Đăng nhập quá nhiều lần. Vui lòng thử lại sau.',429);
      record.count++;pending++;
      try{const actor=await rbac.login(req.body);record.count=0;res.json({data:openSession(actor)});}finally{pending--;}
    });
  }
  router.post('/session', async (req, res) => {
    if (!req.body || typeof req.body.actorId !== 'string' || Object.keys(req.body).some(key => key !== 'actorId')) throw new AppError('Chỉ nhận actorId đã cấu hình trên server.', 400);
    const actor = await service.actor(req.body.actorId);
    res.json({data:openSession(actor)});
  });
  router.use(async (req, _res, next) => {
    const token = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '')?.[1];
    const session = sessions.get(token);
    if (!session || session.expiresAt < Date.now()) { sessions.delete(token); throw new AppError('Hãy chọn lại nhân vật để mở phiên thử nghiệm.', 401); }
    if(session.parentToken)authService.verifyToken(session.parentToken,'student');
    req.demoActor = await (service.sessionActor??service.actor)(session.actorId);
    next();
  });
  router.delete('/session', (req, res) => { sessions.delete(req.headers.authorization.slice(7)); res.status(204).end(); });
  router.get('/me', controller.me);
  router.get('/profile', controller.profile);
  router.get('/catalogs', controller.catalogs);
  if(admin){
    router.get('/admin/staff',async(req,res)=>res.json({data:await admin.overview(req.demoActor)}));
    router.put('/admin/staff/:id/permissions',async(req,res)=>res.json({data:await admin.permissions(req.demoActor,req.params.id,req.body)}));
    router.post('/requests/:id/reassign',async(req,res)=>res.json({data:await admin.reassign(req.demoActor,parseId(req.params.id),req.body)}));
  }
  if(rbac){
    router.post('/admin/roles',async(req,res)=>res.status(201).json({data:await rbac.save(req.demoActor,null,req.body)}));
    router.put('/admin/roles/:id',async(req,res)=>res.json({data:await rbac.save(req.demoActor,req.params.id,req.body)}));
    router.get('/admin/roles/:id/history',async(req,res)=>res.json({data:await rbac.history(req.demoActor,req.params.id)}));
    router.post('/admin/staff',async(req,res)=>res.status(201).json({data:await rbac.createAccount(req.demoActor,req.body)}));
    router.put('/admin/staff/:id/roles',async(req,res)=>res.json({data:await rbac.assign(req.demoActor,req.params.id,req.body)}));
  }
  if(workbook){
    router.post('/workbook/export',async(req,res)=>{const bytes=await workbook.export(req.demoActor,req.body);res.set({'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':'attachment; filename="XuLyHoSo.xlsx"','X-Content-Type-Options':'nosniff'}).send(bytes);});
    router.post('/workbook/preview',raw({type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',limit:'5mb'}),async(req,res)=>res.json({data:await workbook.preview(req.demoActor,req.body)}));
    router.post('/workbook/commit',async(req,res)=>res.json({data:await workbook.commit(req.demoActor,req.body)}));
  }
  router.get('/requests', controller.list);
  router.post('/requests', controller.create);
  router.get('/requests/:id', controller.detail);
  router.get('/requests/:id/file', controller.download);
  router.post('/requests/:id/print', controller.printConfirmation);
  router.post('/requests/:id/actions', controller.command);
  return router;
}
