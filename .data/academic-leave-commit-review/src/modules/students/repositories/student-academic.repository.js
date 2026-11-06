import {AppError} from '../../../shared/errors/app-error.js';

export function createStudentAcademicRepository({fetchImpl=fetch}={}) {
  return Object.freeze({async statistics(accessToken) {
    if(!accessToken||/\s/.test(accessToken))throw new AppError('Cần phiên DUT SSO để lấy bảng điểm.',401);
    let response,reader;
    try {
      response=await fetchImpl('https://xemdiem.dut.udn.vn/api/stats',{
        headers:{Authorization:'Bearer '+accessToken,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new AppError('Chưa đọc được thống kê học tập từ DUT.',response.status===401?401:502,
        response.status===401?{code:'SSO_REAUTH_REQUIRED'}:undefined);
      if(!response.headers.get('content-type')?.includes('json')||Number(response.headers.get('content-length'))>2097152)throw new Error('invalid response');
      reader=response.body?.getReader();if(!reader)throw new Error('empty response');
      const chunks=[];let bytes=0;
      while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>2097152)throw new Error('response too large');chunks.push(Buffer.from(value));}
      const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if(body?.isSuccess===false||body?.success===false||Number(body?.statusCode)>=400)throw new Error('upstream rejected');
      return body?.data??body;
    }catch(error){if(error instanceof AppError)throw error;throw new AppError('Không đọc được dữ liệu thống kê học tập DUT.',502);}
    finally {if(reader){await reader.cancel().catch(()=>{});reader.releaseLock();}else await response?.body?.cancel().catch(()=>{});}
  }});
}
