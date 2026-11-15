// Runs on Cloudflare Cron, using a Google service account shared on the required
// Calendar and Sheets resources. No Google credentials ever reach the browser.
const SCOPE="https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/spreadsheets.readonly";
function b64url(raw){
  const bytes=typeof raw==="string"?new TextEncoder().encode(raw):new Uint8Array(raw);
  let str="";for(const byte of bytes)str+=String.fromCharCode(byte);
  return btoa(str).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
function parisDate(date=new Date()){
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
  const p={};for(const item of parts)if(item.type!=="literal")p[item.type]=item.value;
  return p.year+"-"+p.month+"-"+p.day;
}
function parisTime(date){
  return new Intl.DateTimeFormat("fr-FR",{timeZone:"Europe/Paris",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(date).replace(/\s/g,"");
}
function isoNext(date){return new Date(Date.parse(date+"T12:00:00Z")+86400000).toISOString().slice(0,10);}
function monthLabel(iso){
  return new Intl.DateTimeFormat("fr-FR",{timeZone:"Europe/Paris",month:"long",year:"numeric"}).format(new Date(iso+"T12:00:00Z"));
}
async function googleToken(env){
  const account=JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  if(!account.client_email||!account.private_key)throw Error("Invalid Google service account");
  const head=b64url(JSON.stringify({alg:"RS256",typ:"JWT"}));
  const now=Math.floor(Date.now()/1000);
  const claims=b64url(JSON.stringify({iss:account.client_email,scope:SCOPE,
    aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3500}));
  const signingInput=head+"."+claims;
  const clean=account.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,"");
  const keyBytes=Uint8Array.from(atob(clean),c=>c.charCodeAt(0));
  const key=await crypto.subtle.importKey("pkcs8",keyBytes.buffer,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
  const signature=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,new TextEncoder().encode(signingInput));
  const assertion=signingInput+"."+b64url(signature);
  const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:"grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion="+encodeURIComponent(assertion)});
  if(!r.ok)throw Error("Google OAuth failed: "+r.status);
  const value=await r.json();
  if(!value.access_token)throw Error("Google OAuth missing token");
  return value.access_token;
}
async function googleGet(token,url){
  const r=await fetch(url,{headers:{Authorization:"Bearer "+token}});
  if(!r.ok)throw Error("Google API "+r.status);
  return r.json();
}
async function sheetValues(token,id,range){
  const url="https://sheets.googleapis.com/v4/spreadsheets/"+encodeURIComponent(id)+
    "/values/"+encodeURIComponent(range)+"?valueRenderOption=FORMATTED_VALUE";
  const result=await googleGet(token,url);
  return result.values||[];
}
function numeric(value){
  if(typeof value==="number"&&Number.isFinite(value)&&value>=0)return value;
  if(typeof value==="string"&&/^\d+(?:[.,]\d+)?$/.test(value.trim())){
    return Number(value.replace(",",".").replace(/\s/g,""));
  }
  return null;
}
function approved(status){return status==="valide"||status==="confirme";}
function applyInputs(data,rows){
  const entries=new Map();
  for(const row of rows){
    const key=String(row[0]||"").trim(),value=row[1],status=String(row[2]||"").trim().toLowerCase();
    if(key)entries.set(key,{value,status});
  }
  const read=k=>entries.get(k);
  const goal=read("poker.goal_games");
  const count=read("poker.current_games");
  data.poker.unit="games";
  data.poker.goal_games=goal&&approved(goal.status)?numeric(goal.value):null;
  data.poker.current_games=count&&(approved(count.status)||count.status==="simulation")?numeric(count.value):null;
  data.poker.demo=!!count&&count.status==="simulation";
  for(const k of ["start_date","end_date"]){
    const x=read("poker."+k);
    data.poker[k]=x&&approved(x.status)&&/^\d{4}-\d{2}-\d{2}$/.test(String(x.value))?x.value:null;
  }
  const objective=read("commercial.objective_r1");
  data.commercial.objective_r1=objective&&approved(objective.status)?numeric(objective.value):null;
  data.priorities=[];
  for(let i=1;i<=3;i++){
    const x=read("priorities."+i);
    if(x&&approved(x.status)&&typeof x.value==="string"&&x.value.trim())data.priorities.push(x.value.trim().slice(0,95));
  }
}
async function readCalendar(token,env,today){
  const ids=(env.CALENDAR_IDS||"").split(",").map(x=>x.trim()).filter(Boolean);
  if(!ids.length)return null;
  const tomorrow=isoNext(today);
  const events=[],errors=[];
  for(const id of ids.slice(0,8)){
    try{
      const url="https://www.googleapis.com/calendar/v3/calendars/"+encodeURIComponent(id)+"/events?"+
        "timeMin="+encodeURIComponent(today+"T00:00:00Z")+
        "&timeMax="+encodeURIComponent(tomorrow+"T02:00:00Z")+
        "&singleEvents=true&orderBy=startTime&maxResults=100";
      const response=await googleGet(token,url);
      for(const item of response.items||[]){
        if(item.status==="cancelled"||item.transparency==="transparent")continue;
        const start=item.start?.dateTime||null;
        const day=start?parisDate(new Date(start)):item.start?.date;
        if(day!==today)continue;
        const time=start?parisTime(new Date(start)):"—";
        const title=String(item.summary||"Événement").slice(0,95);
        events.push({time,title,recurring:!!item.recurringEventId});
      }
    }catch(e){errors.push("calendar_access");}
  }
  if(errors.length===ids.length)return null;
  // Favor appointments over routine blocks when the display has only five rows.
  const unique=new Map();
  for(const x of events)unique.set(x.time+"|"+x.title,x);
  const ordered=[...unique.values()].sort((a,b)=>{
    if(a.recurring!==b.recurring)return a.recurring?1:-1;
    return a.time.localeCompare(b.time);
  }).slice(0,5).sort((a,b)=>a.time.localeCompare(b.time));
  return {date:today,items:ordered.map(x=>({time:x.time,title:x.title}))};
}
function isoDay(value){
  const m=String(value||"").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})|^(\d{4})-(\d{2})-(\d{2})/);
  if(!m)return null;
  return m[3]?m[3]+"-"+m[2].padStart(2,"0")+"-"+m[1].padStart(2,"0"):m[4]+"-"+m[5]+"-"+m[6];
}
function dateInMonth(value,month){
  const day=isoDay(value);
  return !!day&&day.slice(0,7)===month;
}
async function readCommercial(token,env,today){
  if(!env.CRM_SHEET_ID)return null;
  const month=today.slice(0,7);
  const [journal,rendezVous]=await Promise.all([
    sheetValues(token,env.CRM_SHEET_ID,"JOURNAL!A1:D1500"),
    sheetValues(token,env.CRM_SHEET_ID,"RENDEZ_VOUS!A1:F1000")
  ]);
  const r1=new Set(),r2=new Set();
  for(const row of journal.slice(1)){
    if(!dateInMonth(row[0],month))continue;
    const phase=String(row[2]||"").trim().toUpperCase();
    if(phase==="R1"||phase==="R1 RÉALISÉ"||phase==="R1 REALISE")r1.add(String(row[1])+"|"+isoDay(row[0]));
    if(phase==="R2"||phase==="R2 RÉALISÉ"||phase==="R2 REALISE")r2.add(String(row[1])+"|"+String(row[0]).slice(0,10));
  }
  for(const row of rendezVous.slice(1)){
    if(!dateInMonth(row[3],month)||!/r.alis./i.test(String(row[5]||"")))continue;
    if(row[2]==="R1")r1.add(String(row[1])+"|"+isoDay(row[3]));
    if(row[2]==="R2")r2.add(String(row[1])+"|"+String(row[3]).slice(0,10));
  }
  // No recorded rendez-vous does not mean zero appointments really took place.
  return {period:monthLabel(today)+" (R1/R2 consignés)",r1:r1.size||null,r2:r2.size||null};
}
export async function syncFromGoogle(env){
  if(!env.STORE||!env.GOOGLE_SERVICE_ACCOUNT_JSON)return {ok:false,reason:"google_not_configured"};
  const today=parisDate(),current=await env.STORE.get("dashboard","json");
  const data=current||{schema:"mf-screen/v1",updatedAt:null,agenda:{date:null,items:[]},
    poker:{goal_eur:null,current_eur:null,hours_done:null,hours_goal:null,days_done:null,days_goal:null},
    commercial:{period:null,r1:null,r2:null,objective_r1:null},priorities:[]};
  let changed=false;
  try{
    const token=await googleToken(env);
    if(env.SOURCE_SHEET_ID){
      const input=await sheetValues(token,env.SOURCE_SHEET_ID,"ENTREES!A2:E20");
      applyInputs(data,input);
      changed=true;
    }
    if(env.CALENDAR_IDS){
      const agenda=await readCalendar(token,env,today);
      if(agenda){data.agenda=agenda;changed=true;}
    }
    if(env.CRM_SHEET_ID){
      try{
        const result=await readCommercial(token,env,today);
        if(result){data.commercial={...data.commercial,...result};changed=true;}
      }catch(e){/* no unverified metrics are written */}
    }
    if(!changed)return {ok:false,reason:"sources_not_accessible"};
    data.updatedAt=new Date().toISOString();
    await env.STORE.put("dashboard",JSON.stringify(data));
    const check=await env.STORE.get("dashboard","json");
    return {ok:!!check,updatedAt:check?.updatedAt||null,agendaItems:data.agenda?.items?.length||0,
      hasPokerCount:typeof data.poker?.current_games==="number",commercialPeriod:data.commercial?.period||null};
  }catch(e){
    return {ok:false,reason:"source_sync_failed",detail:String(e?.message||"").slice(0,60)};
  }
}