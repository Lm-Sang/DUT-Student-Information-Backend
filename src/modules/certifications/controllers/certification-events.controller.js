import {empty} from '../dto/certifications.request.dto.js';

export function createCertificationEventsController(events,config={}){
  return function stream(req,res,next){
    let unsubscribe,heartbeat,lifetime,closed=false;
    const cleanup=()=>{if(closed)return;closed=true;clearInterval(heartbeat);clearTimeout(lifetime);unsubscribe?.();};
    const close=()=>{cleanup();if(!res.destroyed)res.end();};
    const write=data=>{if(closed)return;if(res.destroyed){cleanup();return;}try{if(!res.write(data)){cleanup();res.destroy();}}catch{cleanup();res.destroy();}};
    try{
      empty(req.body,req.query);
      if(req.aborted||res.destroyed)return;
      unsubscribe=events.subscribe(req.certificationActor,event=>write('event: certificate.updated\ndata: '+JSON.stringify(event)+'\n\n'),close);
      res.on('close',cleanup);res.on('error',cleanup);
      res.status(200).set({'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'private, no-store, no-transform','X-Accel-Buffering':'no'});
      res.flushHeaders();
      write('retry: 3000\nevent: connected\ndata: {}\n\n');
      if(closed)return;
      heartbeat=setInterval(()=>write(': heartbeat\n\n'),config.events?.heartbeatMs??25000);heartbeat.unref?.();
      lifetime=setTimeout(close,config.events?.lifetimeMs??300000);lifetime.unref?.();
    }catch(error){cleanup();if(res.headersSent)res.destroy();else next(error);}
  };
}
