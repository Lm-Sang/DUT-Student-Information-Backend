// Fetch streaming keeps Bearer credentials in headers instead of URLs.
export async function readCertificationEvents(response,onEvent){
  const reader=response.body?.getReader();if(!reader)throw new Error('Missing event stream.');
  const decoder=new TextDecoder();let buffer='';
  try{
    while(true){
      const {value,done}=await reader.read();if(done)break;
      buffer=(buffer+decoder.decode(value,{stream:true})).replaceAll('\r\n','\n');
      let end;
      while((end=buffer.indexOf('\n\n'))>=0){
        const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);
        if(frame.length>65536)throw new Error('Event too large.');
        let event='message';const data=[];
        for(const line of frame.split('\n')){
          if(line.startsWith('event:'))event=line.slice(6).trim();
          else if(line.startsWith('data:'))data.push(line.slice(5).replace(/^ /,''));
        }
        if(data.length)await onEvent(event,JSON.parse(data.join('\n')));
      }
      if(buffer.length>65536)throw new Error('Event too large.');
    }
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}

export function createCertificationRealtime({url,getHeaders=()=>({}),credentials='omit',onSync=()=>{},onChange=()=>{},onAuthError=()=>{},
  fetchImpl=fetch,visibilityTarget=globalThis.document,pageTarget=globalThis.window,
  isVisible=()=>!visibilityTarget||visibilityTarget.visibilityState==='visible',retryMs=2000,maxRetryMs=30000,random=Math.random}={}){
  let enabled=false,controller=null,timer=null,attempt=0,listening=false;
  function pause(){clearTimeout(timer);timer=null;const previous=controller;controller=null;previous?.abort();}
  function visibility(){if(isVisible())connect();else pause();}
  async function connect(){
    if(!enabled||!isVisible()||controller)return;
    clearTimeout(timer);timer=null;
    const current=new AbortController();controller=current;
    let retryAfterMs=0;
    try{
      const response=await fetchImpl(url,{method:'GET',headers:{Accept:'text/event-stream',...getHeaders()},credentials,cache:'no-store',signal:current.signal});
      if([401,403].includes(response.status)){stop();await onAuthError(response.status);return;}
      if(!response.ok||!response.headers.get('content-type')?.includes('text/event-stream')){
        const seconds=Number(response.headers.get('retry-after'));
        if(Number.isInteger(seconds)&&seconds>0&&seconds<=300)retryAfterMs=seconds*1000;
        await response.body?.cancel();throw new Error('Event stream unavailable.');
      }
      await readCertificationEvents(response,async(event,data)=>{
        if(!enabled||controller!==current)return;
        if(event==='connected'){attempt=0;await onSync();}
        else if(event==='certificate.updated')await onChange(data);
      });
    }catch(error){
      if([401,403].includes(error.status)){stop();await onAuthError(error.status);return;}
      // Reconnect with bounded backoff; snapshots recover missed hints.
    }
    finally{
      if(controller===current){controller=null;
        if(enabled&&isVisible()){
          const delay=Math.max(retryAfterMs,Math.min(maxRetryMs,retryMs*2**Math.min(attempt++,10)));
          timer=setTimeout(connect,Math.round(delay*(1+random()*0.25)));
          timer.unref?.();
        }
      }
    }
  }
  function start(){enabled=true;
    if(!listening){visibilityTarget?.addEventListener('visibilitychange',visibility);pageTarget?.addEventListener('pagehide',pause);pageTarget?.addEventListener('pageshow',visibility);listening=true;}
    connect();
  }
  function stop(){enabled=false;pause();attempt=0;
    if(listening){visibilityTarget?.removeEventListener('visibilitychange',visibility);pageTarget?.removeEventListener('pagehide',pause);pageTarget?.removeEventListener('pageshow',visibility);listening=false;}
  }
  return Object.freeze({start,stop});
}
