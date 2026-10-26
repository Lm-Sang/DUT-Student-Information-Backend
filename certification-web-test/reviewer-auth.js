import { createHash,randomBytes,timingSafeEqual } from 'node:crypto';
import { Router,json } from 'express';
import { AppError } from '../src/shared/errors/app-error.js';

// Temporary, local-only account explicitly requested for certification testing.
// No credentials or session tokens are shipped to the browser's JavaScript.
export function createReviewerTestAuth(config,{now=Date.now}={}) {
  const router=Router(),sessions=new Map(),attempts=new Map();
  const cookieName='certification_reviewer_test';
  const lifetime=2*60*60*1000;
  // The same local session authorizes the language and IT reviewer modules.
  const cookieOptions={httpOnly:true,sameSite:'strict',secure:false,path:'/api'};
  const hash=value=>createHash('sha256').update(value).digest();
  function cookie(req) {
    const values=(req.headers.cookie??'').split(';').map(value=>value.trim()).filter(value=>value.startsWith(cookieName+'='));
    return values.length===1 ? values[0].slice(cookieName.length+1) : '';
  }
  function enabled(req) {
    if(!config.devMode || !['development','test'].includes(config.nodeEnv))
      throw new AppError('Tài khoản chuyên viên thử nghiệm chỉ dùng ở môi trường local.',503);
    if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))
      throw new AppError('Tài khoản thử nghiệm chỉ nhận kết nối local.',403);
    if(req.headers.origin && req.headers.origin!==config.reviewerOrigin)
      throw new AppError('Hãy đăng nhập từ trang chuyên viên được cấu hình.',403);
  }
  function session(req) {
    const token=cookie(req);
    if(!/^[a-f0-9]{64}$/.test(token)) throw new AppError('Cần đăng nhập chuyên viên.',401);
    const key=hash(token).toString('hex'),entry=sessions.get(key);
    if(!entry || entry.expiresAt<=now()) {sessions.delete(key);throw new AppError('Phiên chuyên viên đã hết hạn. Hãy đăng nhập lại.',401);}
    return entry;
  }
  function actor(req) {enabled(req);return {...session(req).actor,permissions:[]};}
  function view(entry) {return {user:{username:'admin',displayName:entry.actor.name},expiresAt:new Date(entry.expiresAt).toISOString()};}
  router.use((req,res,next)=>{
    res.set({'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});
    try {enabled(req);next();}catch(error){next(error);}
  });
  router.post('/login',json({limit:'2kb'}),(req,res,next)=>{
    try {
      if(!req.is('application/json')) throw new AppError('Cần gửi JSON để đăng nhập.',415);
      const body=req.body;
      if(!body || typeof body.username!=='string' || typeof body.password!=='string' ||
        body.username.length>100 || body.password.length>100 || Object.keys(body).some(key=>!['username','password'].includes(key)))
        throw new AppError('Thông tin đăng nhập không hợp lệ.',400);
      const timestamp=now();
      for(const [key,entry] of attempts)if(timestamp-entry.started>=60000)attempts.delete(key);
      for(const [key,entry] of sessions)if(entry.expiresAt<=timestamp)sessions.delete(key);
      const key=req.socket.remoteAddress,window=attempts.get(key)??{started:timestamp,count:0};window.count++;attempts.set(key,window);
      if(window.count>10) {res.set('Retry-After','60');throw new AppError('Thử đăng nhập quá nhiều lần. Vui lòng đợi một phút.',429);}
      const passwordMatches=timingSafeEqual(hash(body.password),hash('123'));
      if(body.username!=='admin' || !passwordMatches)throw new AppError('Sai tài khoản hoặc mật khẩu.',401);
      const previous=cookie(req);if(previous)sessions.delete(hash(previous).toString('hex'));
      const token=randomBytes(32).toString('hex');
      const entry={expiresAt:timestamp+lifetime,actor:{role:'reviewer',source:'development',
        reference:config.reviewerReference+':admin',name:'Chuyên viên thử nghiệm (admin)',permissions:[]}};
      sessions.set(hash(token).toString('hex'),entry);
      res.cookie(cookieName,token,{...cookieOptions,maxAge:lifetime});
      res.clearCookie(cookieName,{...cookieOptions,path:'/api/certifications/reviewer'});
      res.json({success:true,data:view(entry)});
    }catch(error){next(error);}
  });
  router.get('/session',(req,res,next)=>{try{res.json({success:true,data:view(session(req))});}catch(error){next(error);}});
  router.post('/logout',(req,res)=>{
    const token=cookie(req);if(token)sessions.delete(hash(token).toString('hex'));
    res.clearCookie(cookieName,cookieOptions)
      .clearCookie(cookieName,{...cookieOptions,path:'/api/certifications/reviewer'})
      .json({success:true,data:{loggedOut:true}});
  });
  return {router,actor};
}
