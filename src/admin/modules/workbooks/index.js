import {Router} from 'express';
import {AppError} from '../../../shared/errors/app-error.js';
import {createFeatureWorkbookService} from './services/feature-workbook.service.js';
export {createFeatureWorkbookService} from './services/feature-workbook.service.js';
export function withFeatureWorkbook(router,options){return Router().use('/workbook',createFeatureWorkbookRouter(options)).use(router);}
export function createFeatureWorkbookRouter({module,service,resolveActor,secret}){
 const router=Router(),workbooks=createFeatureWorkbookService({module,service,secret});
 const handle=fn=>async(req,res,next)=>{try{const actor=await resolveActor(req);await fn(req,res,actor);}catch(e){next(e);}};
 router.post('/export',handle(async(req,res,actor)=>{if(!req.body||Object.keys(req.body).some(k=>k!=='ids'))throw new AppError('Dữ liệu xuất Excel không hợp lệ.',400);const bytes=await workbooks.export(actor,req.body.ids);res.set({'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':`attachment; filename="${module}.xlsx"`,'Cache-Control':'no-store'}).send(bytes);}));
 router.post('/preview',handle(async(req,res,actor)=>{if(!req.body||Object.keys(req.body).some(k=>k!=='file')||typeof req.body.file!=='string'||req.body.file.length>7*1024*1024||!/^[A-Za-z0-9+/]+={0,2}$/.test(req.body.file))throw new AppError('Chọn file XLSX tối đa 5 MB.',400);res.json({success:true,data:await workbooks.preview(actor,Buffer.from(req.body.file,'base64'))});}));
 router.post('/commit',handle(async(req,res,actor)=>{if(!req.body||Object.keys(req.body).some(k=>k!=='batchId')||typeof req.body.batchId!=='string')throw new AppError('Thiếu mã xem trước.',400);res.json({success:true,data:await workbooks.commit(actor,req.body.batchId,()=>resolveActor(req))});}));
 return router;
}
