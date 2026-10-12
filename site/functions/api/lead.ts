// Executes only on Cloudflare Pages Functions; never log request bodies.
interface Env {
  LEADS?: { put:(key:string,value:string,options:{expirationTtl:number})=>Promise<void> };
  TURNSTILE_SECRET_KEY?:string;
  PRIVACY_CONTACT?:string;
}
interface Context { request:Request; env:Env; }
const providerIds=new Set(['ipx1031','first-american-exchange','asset-preservation','accruit','exeter','engineered-tax-services','kbkg','cssi']);
function reply(status:number,body:Record<string,unknown>) {
  return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
export const onRequestPost=async({request,env}:Context):Promise<Response>=>{
  if (!env.LEADS || !env.TURNSTILE_SECRET_KEY || !env.PRIVACY_CONTACT) return reply(503,{error:'Intake not configured'});
  const url=new URL(request.url);
  if(request.headers.get('Origin')!==url.origin) return reply(403,{error:'Origin rejected'});
  if(!request.headers.get('Content-Type')?.startsWith('application/json')) return reply(415,{error:'JSON required'});
  if(Number(request.headers.get('Content-Length')??0)>8192) return reply(413,{error:'Request too large'});
  try {
    const text=await request.text();
    if(new TextEncoder().encode(text).length>8192) return reply(413,{error:'Request too large'});
    const body:unknown=JSON.parse(text);
    if(!body || typeof body!=='object' || Array.isArray(body)) return reply(400,{error:'Invalid request'});
    const b=body as Record<string,unknown>;
    if(typeof b.name!=='string'||!b.name.trim()||b.name.length>100
      ||typeof b.email!=='string'||b.email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)
      ||b.consent!==true||typeof b.turnstile_token!=='string'||b.turnstile_token.length>2048
      ||(b.provider_id!==null && (typeof b.provider_id!=='string'||!providerIds.has(b.provider_id)))) {
      return reply(400,{error:'Invalid request'});
    }
    let metrics:Record<string,string|number>|null=null;
    if(b.metrics!==null) {
      if(!b.metrics||typeof b.metrics!=='object'||Array.isArray(b.metrics)) return reply(400,{error:'Invalid metrics'});
      const input=b.metrics as Record<string,unknown>;
      if(!['Industrial','NNN Retail','Multifamily'].includes(String(input.propertyType))) return reply(400,{error:'Invalid property type'});
      metrics={propertyType:String(input.propertyType)};
      for(const key of ['purchasePrice','landValue','excessBasis','allocationPercent','bonusPercent','placedMonth']) {
        const value=input[key];
        if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1000000000) return reply(400,{error:'Invalid metric'});
        metrics[key]=value;
      }
      // Recompute estimates in any future analysis; never trust client-supplied results.
    }
    const challenge=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:b.turnstile_token}),
    });
    if(!challenge.ok) return reply(503,{error:'Verification unavailable'});
    const verified=await challenge.json() as {success?:boolean;hostname?:string};
    if(!verified.success||verified.hostname!==url.hostname) return reply(403,{error:'Verification failed'});
    const id=crypto.randomUUID();
    await env.LEADS.put('lead:'+id,JSON.stringify({
      id,name:b.name.trim(),email:b.email.trim(),provider_id:b.provider_id,metrics,
      consent:true,consent_version:'2026-10-12',created_at:new Date().toISOString(),
    }),{expirationTtl:2592000});
    return reply(201,{saved:true,id});
  } catch {
    return reply(503,{error:'Request could not be saved'});
  }
};
export const onRequestGet=()=>reply(405,{error:'POST required'});
