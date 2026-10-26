import express from 'express';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import dotenv from 'dotenv';

export function createWebTestApp({ apiBaseUrl, ssoBaseUrl, mode='student',studentOrigin='http://localhost:5173',reviewerOrigin='http://localhost:5174' }) {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req,res,next) => {
    res.set({'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});
    next();
  });
  app.get('/test-config.json',(_req,res) => res.json({apiBaseUrl,ssoBaseUrl,mode,studentOrigin,reviewerOrigin}));
  if(mode==='reviewer') app.get('/',(_req,res)=>res.sendFile(fileURLToPath(new URL('./public/reviewer.html',import.meta.url))));
  // Same receiving endpoint and fragment callback as D:\Ddut\d_dut\auth-web-test.
  // Receiving a token does not authenticate it; the certification API checks DUT profile.
  app.get('/local-api/auth/token',(req,res) => {
    const values = new URL(req.url,'http://localhost').searchParams;
    const token = values.get('accessToken')?.trim();
    const error = values.get('error_description') || values.get('error') || values.get('message');
    const parameters = new URLSearchParams();
    if (error || !token || token.length > 16384 || /\s/.test(token))
      parameters.set('error','DUT SSO chưa trả accessToken hợp lệ. Vui lòng đăng nhập lại.');
    else parameters.set('accessToken',token);
    res.redirect(303,'/auth-callback.html#'+parameters);
  });
  app.use(express.static(fileURLToPath(new URL('./public/',import.meta.url)),{index:'index.html',dotfiles:'deny'}));
  app.use((_req,res) => res.status(404).send('Không có đường dẫn này.'));
  return app;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  dotenv.config({path:fileURLToPath(new URL('../.env',import.meta.url)),quiet:true});
  const {env} = await import('../src/config/env.js');
  if (!['development','test'].includes(env.nodeEnv)) throw new Error('FE test chỉ chạy ở môi trường local.');
  const origins=[new URL(env.app.studentFrontendUrl),new URL(env.app.adminFrontendUrl)];
  for(const origin of origins) if(origin.protocol!=='http:' || origin.hostname!=='localhost' || !env.app.corsOrigins.includes(origin.origin))
    throw new Error('URL FE phải là http://localhost:<cổng> và nằm trong cấu hình CORS.');
  if(origins[0].origin===origins[1].origin)throw new Error('FE sinh viên và chuyên viên cần hai cổng riêng.');
  const servers=[];
  try {
    for(const [index,origin] of origins.entries()) {
      const app=createWebTestApp({apiBaseUrl:env.app.url,ssoBaseUrl:env.microsoftSso.baseUrl,
        mode:index===0?'student':'reviewer',studentOrigin:origins[0].origin,reviewerOrigin:origins[1].origin});
      const server=await new Promise((resolve,reject)=>{const instance=app.listen(Number(origin.port||80),'localhost',()=>resolve(instance));instance.once('error',reject);});
      servers.push(server);console.log((index===0?'Sinh viên: ':'Chuyên viên: ')+origin.origin);
    }
    console.log('Backend: '+env.app.url+' | Tài khoản chuyên viên thử nghiệm: admin');
  } catch(error) {
    for(const server of servers)server.close();
    console.error(error.code==='EADDRINUSE'?'Cổng FE đang được dùng. Dừng FE cũ rồi chạy lại; không tự đổi cổng.':error.message);
    process.exitCode=1;
  }
  process.once('SIGINT',()=>{for(const server of servers)server.close();});
  process.once('SIGTERM',()=>{for(const server of servers)server.close();});
}
