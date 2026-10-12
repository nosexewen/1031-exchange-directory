import { useEffect, useRef, useState } from 'react';
type Turnstile = { render:(element:HTMLElement,options:Record<string,unknown>)=>string; remove:(id:string)=>void };
declare global { interface Window { turnstile?:Turnstile; } }
let turnstileReady:Promise<void>|undefined;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (!turnstileReady) turnstileReady=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async=true; script.onload=()=>resolve(); script.onerror=()=>{turnstileReady=undefined;reject(new Error('Challenge unavailable'));};
    document.head.append(script);
  });
  return turnstileReady;
}
interface Props { buttonText:string; providerId?:string; metrics?:Record<string,unknown>; }
export default function LeadModal({buttonText,providerId,metrics}:Props) {
  const dialog=useRef<HTMLDialogElement>(null);
  const widget=useRef<HTMLDivElement>(null);
  const [open,setOpen]=useState(false), [token,setToken]=useState(''), [status,setStatus]=useState(''), [busy,setBusy]=useState(false), [sent,setSent]=useState(false);
  const key=import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;
  const configured=Boolean(key && import.meta.env.PUBLIC_PRIVACY_CONTACT);
  useEffect(()=>{
    if (!open || !configured) return;
    let cancelled=false, id:string|undefined;
    loadTurnstile().then(()=>{
      if (cancelled || !widget.current || !window.turnstile) return;
      id=window.turnstile.render(widget.current,{
        sitekey:key, callback:(value:string)=>setToken(value),
        'expired-callback':()=>setToken(''), 'error-callback':()=>{setToken('');setStatus('Verification failed. Reopen to retry.');},
      });
    }).catch(()=>setStatus('Verification unavailable. Reopen to retry.'));
    return ()=>{cancelled=true;if(id)window.turnstile?.remove(id);setToken('');};
  },[open,configured,key]);
  const close=()=>{dialog.current?.close();setOpen(false);};
  return <>
    <button type="button" onClick={()=>{setStatus('');setSent(false);dialog.current?.showModal();setOpen(true);}}>{buttonText}</button>
    <dialog ref={dialog} aria-label={buttonText} onClose={()=>setOpen(false)}>
      <h2>{buttonText}</h2>
      {!configured ? <p className="notice">Intake is not activated. The directory operator must configure privacy contact, storage and verification before collecting requests.</p> :
      sent ? <p role="status">Request saved. No provider has been notified automatically.</p> :
      <form onSubmit={async(e)=>{
        e.preventDefault();
        if (!token || busy) return;
        const form=new FormData(e.currentTarget);
        setBusy(true);setStatus('');
        try {
          const response=await fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
            name:form.get('name'), email:form.get('email'), consent:form.get('consent')==='on',
            provider_id:providerId??null, metrics:metrics??null, turnstile_token:token,
          })});
          if(!response.ok) throw new Error('Request could not be saved. Close and retry.');
          setSent(true);
        } catch {setStatus('Request could not be saved. Close and retry.');}
        finally {setBusy(false);}
      }}>
        <p>Request goes to the directory operator. Provider outreach requires your later authorization.</p>
        <label>Name<input name="name" autoComplete="name" maxLength={100} required /></label>
        <label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
        <label><input name="consent" type="checkbox" required />I authorize the directory operator to store my request for up to 30 days and respond by email. <a href="/privacy/" target="_blank" rel="noopener noreferrer">Privacy terms</a></label>
        <div ref={widget} />
        <p role="alert" className="error">{status}</p>
        <button type="submit" disabled={!token||busy}>{busy?'Saving…':'Submit request'}</button>
      </form>}
      <button type="button" className="mt-4" onClick={close}>Close</button>
    </dialog>
  </>;
}
