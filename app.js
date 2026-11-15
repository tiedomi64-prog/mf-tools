(function(){
'use strict';
var FILE='dashboard.json', CACHE='mf_studio_screen_last_data_v1', WEATHER='mf_studio_screen_weather_v1';
var PARIS='Europe/Paris';
var WEATHER_URL='https://api.open-meteo.com/v1/forecast?latitude=43.9816&longitude=-0.2300&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FParis&forecast_days=1';
var MODEL={schema:'mf-screen/v1',updatedAt:null,agenda:{date:null,items:[]},poker:{goal_eur:null,current_eur:null,hours_done:null,hours_goal:null,days_done:null,days_goal:null},commercial:{period:null,r1:null,r2:null,objective_r1:null},priorities:[]};
function el(id){return document.getElementById(id);}
function txt(id,value){var e=el(id);if(e)e.textContent=value;}
function textNode(tag,cls,value){var e=document.createElement(tag);if(cls)e.className=cls;e.textContent=value;return e;}
function isNum(v){return typeof v==='number'&&isFinite(v);}
function value(v,unit){return isNum(v)?format(v)+(unit||''):'—'+(unit||'');}
function format(n){return Number(n).toLocaleString('fr-FR',{maximumFractionDigits:1});}
function percent(a,b){return isNum(a)&&isNum(b)&&b>0?Math.max(0,Math.round(100*a/b)):null;}
function pctText(v){return v===null?'— %':String(v)+' %';}
function progress(id,v){el(id).style.width=(v===null?0:Math.max(0,Math.min(100,v)))+'%';}
function dateParts(now){var p=new Intl.DateTimeFormat('fr-FR',{timeZone:PARIS,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),a={};for(var i=0;i<p.length;i++)if(p[i].type!=='literal')a[p[i].type]=p[i].value;return a.year+'-'+a.month+'-'+a.day;}
function currentDate(){try{return dateParts(new Date());}catch(e){var n=new Date();return n.getFullYear()+'-'+pad(n.getMonth()+1)+'-'+pad(n.getDate());}}
function pad(n){return n<10?'0'+n:String(n);}
function clockTick(){var n=new Date();try{txt('clock',new Intl.DateTimeFormat('fr-FR',{timeZone:PARIS,hour:'2-digit',minute:'2-digit',hour12:false}).format(n).replace(/\s/g,''));var d=new Intl.DateTimeFormat('fr-FR',{timeZone:PARIS,weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(n);txt('date',d.charAt(0).toUpperCase()+d.slice(1));}catch(e){txt('clock',pad(n.getHours())+':'+pad(n.getMinutes()));txt('date',n.toLocaleDateString('fr-FR'));}}
function safeLoad(key){try{var x=localStorage.getItem(key);return x?JSON.parse(x):null;}catch(e){return null;}}
function safeSave(key,data){try{localStorage.setItem(key,JSON.stringify(data));}catch(e){}}
function applyAgenda(data){
  var box=el('agendaList');while(box.firstChild)box.removeChild(box.firstChild);
  var a=data.agenda||{},today=currentDate();
  if(a.date!==today){box.appendChild(textNode('p','placeholder','Agenda du '+today+' : mise à jour en attente'));return;}
  var items=Array.isArray(a.items)?a.items.slice(0,5):[];
  if(!items.length){box.appendChild(textNode('p','placeholder','Aucun rendez-vous communiqué pour aujourd’hui.'));return;}
  items.sort(function(x,y){return String(x.time||'').localeCompare(String(y.time||''));});
  for(var i=0;i<items.length;i++){
    var x=items[i];if(!x||typeof x.title!=='string')continue;
    var row=textNode('div','agenda-row','');
    row.appendChild(textNode('span','agenda-time',String(x.time||'—').slice(0,5)));
    row.appendChild(textNode('span','agenda-bullet','•'));
    row.appendChild(textNode('span','agenda-name',x.title.slice(0,95)));
    box.appendChild(row);
  }
}
function applyPoker(d){
  var p=d.poker||{},money=percent(p.current_eur,p.goal_eur),hours=percent(p.hours_done,p.hours_goal),days=percent(p.days_done,p.days_goal);
  txt('pokerAmount',value(p.current_eur,' €'));
  txt('pokerGoalAmount','/ '+value(p.goal_eur,' €'));
  txt('pokerGoal',value(p.goal_eur,' €'));
  txt('pokerResult',value(p.current_eur,' €'));
  txt('pokerPercentage',pctText(money));
  txt('pokerResultPct',pctText(money));
  txt('pokerHours',value(p.hours_done,' h')+' / '+value(p.hours_goal,' h'));
  txt('pokerHoursPct',pctText(hours));
  txt('pokerDays',value(p.days_done)+' / '+value(p.days_goal,' jours'));
  txt('pokerDaysPct',pctText(days));
  progress('pokerResultBar',money);progress('pokerHoursBar',hours);progress('pokerDaysBar',days);
  el('pokerDonut').style.background='conic-gradient(from 0deg,#e3a05f 0%,#e3a05f '+(money===null?0:Math.max(0,Math.min(100,money)))+'%,#516451 '+(money===null?0:Math.max(0,Math.min(100,money)))+'%,#516451 100%)';
  el('pokerDonut').setAttribute('aria-label','Challenge poker : '+pctText(money)+' de l’objectif');
}
function applyCommercial(d){
  var c=d.commercial||{},rate=percent(c.r1,c.objective_r1);
  txt('salesGoal',value(c.objective_r1));txt('r1Count',value(c.r1));txt('r2Count',value(c.r2));
  txt('salesPercent',pctText(rate));progress('salesBar',rate);
  var conversion=percent(c.r2,c.r1);
  txt('salesSub',isNum(c.r1)&&isNum(c.r2)&&c.r1>0?'Conversion R1 → R2 : '+pctText(conversion):(c.period?'Période : '+String(c.period).slice(0,45):'Données à actualiser'));
}
function applyPriorities(data){
  var box=el('priorities');while(box.firstChild)box.removeChild(box.firstChild);
  var p=Array.isArray(data.priorities)?data.priorities.slice(0,3):[];
  if(!p.length){box.appendChild(textNode('p','priority-empty','Les priorités seront affichées après mise à jour.'));return;}
  for(var i=0;i<p.length;i++){
    if(typeof p[i]!=='string')continue;
    var row=textNode('div','priority-item','');
    row.appendChild(textNode('span','priority-index',String(i+1)+'.'));
    row.appendChild(textNode('span','priority-text',p[i].slice(0,95)));
    box.appendChild(row);
  }
}
function applyData(data){if(!data||data.schema!==MODEL.schema)return false;applyAgenda(data);applyPoker(data);applyCommercial(data);applyPriorities(data);return true;}
function fetchData(){
  var url=FILE+'?t='+Date.now();
  fetch(url,{cache:'no-store'}).then(function(resp){if(!resp.ok)throw new Error('Données absentes');return resp.json();}).then(function(data){
    if(!applyData(data))throw new Error('Format incorrect');
    safeSave(CACHE,data);
    txt('dataStatus','Suivi opérationnel chargé. '+(data.updatedAt?'Actualisé le '+data.updatedAt:'Mise à jour non datée'));
  }).catch(function(){var stored=safeLoad(CACHE);if(stored&&applyData(stored)){txt('dataStatus','Mode hors ligne : dernière version enregistrée.');}else{applyData(MODEL);txt('dataStatus','En attente des données du directeur des opérations.');}});
}
function weatherCondition(code){if(code===0)return 'clear';if(code===1||code===2)return 'partly';if(code===3||code===45||code===48)return 'cloudy';if(code>=51)return 'rain';return 'partly';}
function weatherDescription(code){if(code===0)return 'Ciel dégagé';if(code===1||code===2)return 'Éclaircies';if(code===3)return 'Nuageux';if(code===45||code===48)return 'Brouillard';if(code>=51&&code<=57)return 'Bruine';if(code>=61&&code<=67)return 'Pluie';if(code>=71&&code<=77)return 'Neige';if(code>=80&&code<=82)return 'Averses';if(code>=95)return 'Orage';return 'Météo actuelle';}
function applyWeather(data,offline){
  if(!data||!data.current||!isNum(data.current.temperature_2m))return false;
  var t=data.current.temperature_2m,code=data.current.weather_code||0,hi=data.daily&&data.daily.temperature_2m_max&&data.daily.temperature_2m_max[0],lo=data.daily&&data.daily.temperature_2m_min&&data.daily.temperature_2m_min[0];
  txt('temp',Math.round(t)+'°C');
  txt('weatherRange','Max. '+(isNum(hi)?Math.round(hi)+'°C':'—')+' · Min. '+(isNum(lo)?Math.round(lo)+'°C':'—'));
  txt('weatherStatus',weatherDescription(code)+(offline?' · dernière mesure':' · Open-Meteo'));
  el('weatherIcon').setAttribute('data-condition',weatherCondition(code));
  return true;
}
function fetchWeather(){
  fetch(WEATHER_URL,{cache:'no-store'}).then(function(resp){if(!resp.ok)throw new Error('Météo indisponible');return resp.json();}).then(function(data){if(!applyWeather(data,false))throw new Error('Données météo incorrectes');safeSave(WEATHER,data);}).catch(function(){var old=safeLoad(WEATHER);if(!applyWeather(old,true)){txt('weatherStatus','Météo indisponible');}});
}
function syncIfNewDay(){var d=currentDate();if(syncIfNewDay.last!==d){syncIfNewDay.last=d;fetchData();fetchWeather();}}
clockTick();applyData(MODEL);var cached=safeLoad(CACHE);if(cached)applyData(cached);
var oldWeather=safeLoad(WEATHER);if(oldWeather)applyWeather(oldWeather,true);
fetchData();fetchWeather();syncIfNewDay.last=currentDate();
setInterval(function(){clockTick();syncIfNewDay();},1000);
setInterval(fetchWeather,15*60*1000);
setInterval(fetchData,5*60*1000);
document.addEventListener('visibilitychange',function(){if(!document.hidden){clockTick();fetchWeather();fetchData();}});
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('./sw.js').catch(function(){});});}
})();