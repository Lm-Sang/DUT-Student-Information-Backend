import { Router } from 'express';
import { authenticate } from '../../auth/index.js';
import { asyncHandler } from '../../../shared/utils/async-handler.js';
import { sendSuccess } from '../../../shared/utils/response.js';
import { AppError } from '../../../shared/errors/app-error.js';

export function createStudentRouter(service,authService) {
  const router=Router();
  router.use('/me',authenticate('student',authService),(_req,res,next)=>{res.set('Cache-Control','no-store');next();});
  router.get('/me/avatar',asyncHandler(async(req,res)=>{
    if(Object.keys(req.query).length)throw new AppError('API chỉ đọc ảnh của tài khoản đã đăng nhập; không nhận bộ chọn sinh viên.',400);
    const image=await service.avatar(req.user);
    if(!image)return res.status(204).end();
    return res.type('image/jpeg').set('X-Content-Type-Options','nosniff').send(image);
  }));
  for(const kind of ['profile','grades','curriculum','schedule'])router.get('/me/'+kind,asyncHandler(async(req,res)=>{
    if(Object.keys(req.query).length)throw new AppError('API chỉ đọc hồ sơ của tài khoản đã đăng nhập; không nhận bộ chọn sinh viên hoặc chương trình.',400);
    return sendSuccess(res,await service[kind](req.user));
  }));
  return router;
}
