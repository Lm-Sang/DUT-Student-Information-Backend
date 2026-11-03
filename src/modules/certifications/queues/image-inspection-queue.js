import {AppError} from '../../../shared/errors/app-error.js';
import {certificationConfig} from '../../../config/certifications.js';

export function createImageInspectionQueue({concurrency=2,maxQueued=150,waitTimeoutMs=20000}={}) {
  if(!Number.isInteger(concurrency)||concurrency<1||!Number.isInteger(maxQueued)||maxQueued<0||!Number.isFinite(waitTimeoutMs)||waitTimeoutMs<=0)
    throw new TypeError('Invalid image inspection queue configuration.');
  let active=0;
  const waiting=[];
  const overload=code=>new AppError('BE đang bận kiểm tra ảnh. Vui lòng thử nộp lại trên cùng hồ sơ sau ít giây.',503,
    {code,retryAfterSeconds:5});
  function start(job){
    clearTimeout(job.timer);active++;
    Promise.resolve().then(job.task).then(job.resolve,job.reject).finally(()=>{
      active--;const next=waiting.shift();if(next)start(next);
    });
  }
  return Object.freeze({
    run(task){return new Promise((resolve,reject)=>{
      const job={task,resolve,reject,timer:null};
      if(active<concurrency)return start(job);
      if(waiting.length>=maxQueued)return reject(overload('CERT_IMAGE_QUEUE_FULL'));
      job.timer=setTimeout(()=>{const index=waiting.indexOf(job);if(index>=0){waiting.splice(index,1);reject(overload('CERT_IMAGE_QUEUE_TIMEOUT'));}},waitTimeoutMs);
      waiting.push(job);
    });},
    get stats(){return{active,queued:waiting.length,concurrency,maxQueued};},
  });
}

// One queue for all foreign-language and IT requests in this Node.js process.
// Acquire a slot before reading R2 bytes, so waiting jobs do not hold image buffers.
export const certificationImageQueue=createImageInspectionQueue(certificationConfig.imageInspection);
