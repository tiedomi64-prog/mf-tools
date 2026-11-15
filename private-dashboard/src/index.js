import { syncFromGoogle } from "./sync.js";

const PUBLIC_SITE = "https://tiedomi64-prog.github.io/mf-tools/";
const COOKIE = "mf_device";
const MAX_AGE = 365 * 86400;
const SESSION_TTL = 400 * 86400;
const enc = new TextEncoder();
const EMPTY = {
  schema:"mf-screen/v1",updatedAt:null,agenda:{date:null,items:[]},
  poker:{goal_eur:null,current_eur:null,hours_done:null,hours_goal:null,days_done:null,days_goal:null,
    unit:"games",goal_games:3000,current_games:null,start_date:"2026-11-15",end_date:"2026-11-30",demo:false},
  commercial:{period:null,r1:null,r2:null,objective_r1:null},priorities:[]
};
function safeEquals(a,b){
  const x=enc.encode(String(a||"")),y=enc.encode(String(b||""));
  let diff=x.length^y.length;
  for(let i=0;i<Math.max(x.length,y.length);i++)diff|=(x[i]||0)^(y[i]||0);
  return diff===0;
}
async function digest(value){
  const hash=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(value)));
  return Array.from(hash,b=>b.toString(16).padStart(2,"0")).join("");
}
function newToken(){
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    .replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
function getCookie(request){
  const m=(request.headers.get("Cookie")||"").match(/(?:^|;\s*)mf_device=([A-Za-z0-9_-]{43})(?:;|$)/);
  return m?m[1]:null;
}
function sessionCookie(t){return COOKIE+"="+t+"; Path=/; Max-Age="+MAX_AGE+"; HttpOnly; Secure; SameSite=Strict";}
const headers={"Cache-Control":"private, no-store, max-age=0","Pragma":"no-cache","Referrer-Policy":"no-referrer",
  "X-Content-Type-Options":"nosniff","X-Frame-Options":"DENY","Permissions-Policy":"camera=(), microphone=(), geolocation=()"};
function send(body,status=200,extra={}){return new Response(body,{status,headers:{...headers,...extra}});}
function json(data,status=200,extra={}){return send(JSON.stringify(data),status,{"Content-Type":"application/json; charset=utf-8",...extra});}
function redirect(path,t){return send(null,303,{Location:path,...(t?{"Set-Cookie":sessionCookie(t)}:{})});}
async function sessionFor(request,env){
  const t=getCookie(request);
  if(!t||!env.STORE)return null;
  const key="device:"+await digest(t);
  const value=await env.STORE.get(key,"json");
  if(!value||!Number.isFinite(value.renewedAt))return null;
  const epoch=Number(await env.STORE.get("setup:epoch")||"1");
  if(value.epoch!==epoch)return null;
  if(Date.now()-value.renewedAt>7*86400000){
    await env.STORE.put(key,JSON.stringify({...value,renewedAt:Date.now()}),{expirationTtl:SESSION_TTL});
  }
  return t;
}
function pairingHtml(error=false){
  return '<!doctype html><html lang="fr"><head><meta charset="utf-8">'+
  '<meta name="viewport" content="width=device-width, initial-scale=1"><title>MF Studio — Activer iPad</title>'+
  '<style>body{margin:0;font:16px Arial;background:#eee8de;color:#203a2f;min-height:100vh;'+
  'display:flex;align-items:center;justify-content:center}main{background:#fff9ef;padding:28px;'+
  'border-radius:16px;max-width:380px;width:85%;box-shadow:0 6px 25px #0001}'+
  'h1{font:28px Georgia,serif}p{line-height:1.5}input,button{width:100%;box-sizing:border-box;'+
  'font-size:18px;padding:12px;border-radius:9px}input{border:1px solid #8e9b8e;margin-top:14px}'+
  'button{border:0;background:#1d4534;color:white;font-weight:bold;margin-top:12px}.error{color:#a32b29}</style>'+
  '</head><body><main><h1>MF STUDIO</h1><p>Activation unique de cet iPad. Données privées.</p>'+
  (error?'<p class="error">Code incorrect ou déjà utilisé.</p>':'')+
  '<form action="/pair" method="post"><label for="pair">Code d’activation</label>'+
  '<input id="pair" type="password" name="code" required autocomplete="off">'+
  '<button type="submit">Activer cet iPad</button></form></main></body></html>';
}
async function pair(request,env){
  if(!env.STORE||!env.PAIRING_CODE||env.PAIRING_CODE.length<24)return send("Configuration requise",503);
  if(await env.STORE.get("setup:paired"))return send("Appareil déjà activé. Réinitialisation administrateur nécessaire.",403);
  if(Number(request.headers.get("content-length")||0)>2000)return send("Requête trop grande",413);
  const form=await request.formData();
  if(!safeEquals(String(form.get("code")||""),env.PAIRING_CODE))
    return send(pairingHtml(true),403,{"Content-Type":"text/html; charset=utf-8"});
  const t=newToken();
  const epoch=Number(await env.STORE.get("setup:epoch")||"1");
  await env.STORE.put("device:"+await digest(t),JSON.stringify({createdAt:Date.now(),renewedAt:Date.now(),epoch}),{expirationTtl:SESSION_TTL});
  await env.STORE.put("setup:paired","1");
  return redirect("/",t);
}
function nonNegative(v){return v===null||(typeof v==="number"&&Number.isFinite(v)&&v>=0);}
export function validateDashboard(d){
  if(!d||d.schema!=="mf-screen/v1"||!d.agenda||!d.poker||!d.commercial)return false;
  if(!Array.isArray(d.agenda.items)||d.agenda.items.length>12)return false;
  if(d.agenda.date!==null&&!/^\d{4}-\d\d-\d\d$/.test(String(d.agenda.date)))return false;
  if(!d.agenda.items.every(x=>x&&typeof x.title==="string"&&x.title.length<=120&&typeof x.time==="string"&&x.time.length<=8))return false;
  if(!Array.isArray(d.priorities)||d.priorities.length>3||!d.priorities.every(x=>typeof x==="string"&&x.length<=120))return false;
  for(const k of ["r1","r2","objective_r1"])if(!nonNegative(d.commercial[k]))return false;
  for(const k of ["goal_games","current_games","goal_eur","current_eur","hours_done","hours_goal","days_done","days_goal"])
    if(d.poker[k]!==undefined&&!nonNegative(d.poker[k]))return false;
  if(d.poker.unit!==undefined&&d.poker.unit!=="games")return false;
  if(d.poker.demo!==undefined&&typeof d.poker.demo!=="boolean")return false;
  return JSON.stringify(d).length<=12000;
}
function writer(request,env){
  const bearer=request.headers.get("Authorization")||"";
  return !!env.WRITE_TOKEN&&env.WRITE_TOKEN.length>=24&&bearer.startsWith("Bearer ")&&safeEquals(bearer.slice(7),env.WRITE_TOKEN);
}
async function serveDashboard(env,t){
  const data=await env.STORE.get("dashboard","json")||EMPTY;
  return json(data,200,{"Set-Cookie":sessionCookie(t)});
}
async function asset(request,env,path,t){
  if(path==="/dashboard.json"||path==="/api/dashboard")return serveDashboard(env,t);
  if(path==="/sw.js")return send("No offline cache of private information",404);
  if(path==="/app.js"){
    const a=await env.ASSETS.fetch(new Request(new URL("/app.js",request.url)));
    return new Response(a.body,{status:a.status,headers:{...headers,"Content-Type":"application/javascript; charset=utf-8","Set-Cookie":sessionCookie(t)}});
  }
  if(!new Set(["/","/index.html","/style.css","/icon.svg","/manifest.json"]).has(path))return send("Not found",404);
  const url=new URL(path==="/"?"./":path.slice(1),PUBLIC_SITE);
  url.search=new URL(request.url).search;
  const upstream=await fetch(url.toString(),{method:"GET",cf:{cacheTtl:60}});
  if(!upstream.ok)return send("Site source indisponible",502);
  return new Response(upstream.body,{status:200,headers:{...headers,
    "Content-Type":upstream.headers.get("content-type")||"application/octet-stream",
    "Set-Cookie":sessionCookie(t)}});
}
export default {
  async fetch(request,env,ctx){
    if(!env.STORE)return send("Stockage privé non configuré",503);
    const path=new URL(request.url).pathname;
    if(path==="/health"&&request.method==="GET")return json({status:"available"});
    if(path==="/pair"&&request.method==="POST")return pair(request,env);
    if(path==="/api/dashboard"&&request.method==="PUT"){
      if(!writer(request,env))return json({error:"unauthorized"},401);
      if(Number(request.headers.get("content-length")||0)>16000)return json({error:"too_large"},413);
      let data;try{data=await request.json();}catch{return json({error:"invalid_json"},400);}
      if(!validateDashboard(data))return json({error:"invalid_schema"},422);
      data.updatedAt=new Date().toISOString();
      await env.STORE.put("dashboard",JSON.stringify(data));
      const check=await env.STORE.get("dashboard","json");
      return json({ok:!!check,updatedAt:check?.updatedAt||null});
    }
    if(path==="/api/sync"&&request.method==="POST"){
      if(!writer(request,env))return json({error:"unauthorized"},401);
      const result=await syncFromGoogle(env);
      return json(result,result.ok?200:503);
    }
    if(path==="/api/reset-pair"&&request.method==="POST"){
      if(!writer(request,env))return json({error:"unauthorized"},401);
      const epoch=Number(await env.STORE.get("setup:epoch")||"1")+1;
      await env.STORE.put("setup:epoch",String(epoch));
      await env.STORE.delete("setup:paired");
      return json({ok:true,revoked:true,note:"All existing device sessions revoked; pair new iPad."});
    }
    const t=await sessionFor(request,env);
    if(path==="/pair"&&request.method==="GET"){
      if(t)return redirect("/");
      return send(pairingHtml(),200,{"Content-Type":"text/html; charset=utf-8"});
    }
    if(!t){
      if(path==="/api/dashboard"||path==="/dashboard.json")return json({error:"session_required"},401);
      return redirect("/pair");
    }
    if(request.method!=="GET"&&request.method!=="HEAD")return send("Method not allowed",405);
    return asset(request,env,path,t);
  },
  async scheduled(controller,env,ctx){ctx.waitUntil(syncFromGoogle(env));}
};