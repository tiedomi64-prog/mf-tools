
(function(){
  var defaultShots = [
    "Plan large / establishing shot","Façade / enseigne","Détails / textures",
    "Sujet en action","Gros plan mains","Plan mouvement gimbal","Ambiance / équipe","Plan final / hero shot"
  ];
  var defaultQuestions = [
    "Présentez votre entreprise en une phrase.",
    "Quel problème résolvez-vous pour vos clients ?",
    "Qu’est-ce qui vous différencie ?",
    "Comment travaillez-vous concrètement ?",
    "Pouvez-vous donner un exemple client ?",
    "Quelle erreur vos clients font-ils souvent ?",
    "Quel conseil donneriez-vous à quelqu’un qui hésite ?",
    "Que doit faire quelqu’un qui veut travailler avec vous ?"
  ];
  var defaultGear = [
    "Sony A6500 + batterie","Tamron 17-70 mm","Cartes mémoire",
    "iPhone + cage SmallRig","DJI RS3 Mini","Drone + batteries + ND",
    "Trépied / support","Flash / lumière + déclencheur","Chargeurs / multiprise",
    "Micro / audio si nécessaire","Chiffon optique","Eau / encas"
  ];
  var defaultDrone = [
    "Batteries chargées","Carte mémoire libre","Hélices contrôlées",
    "Météo / vent vérifiés","Zone de vol vérifiée","Autorisation / accord client",
    "Décollage et retour sécurisés","RTH / altitude paramétrés","Plan de vol / shotlist"
  ];
  var poses = ["Portrait buste","Bras croisés","Plein pied","Ballon","Célébration","Template réseaux"];

  window.openScreen = function(id){
    var screens=document.querySelectorAll(".screen");
    for(var i=0;i<screens.length;i++) screens[i].className="screen";
    document.getElementById(id).className="screen active";
    document.getElementById("homeBtn").style.display=id==="home"?"none":"block";
    window.scrollTo(0,0);
  };
  window.goHome=function(){openScreen("home")};

  function loadSimple(){
    var fields=document.querySelectorAll("[data-save]");
    for(var i=0;i<fields.length;i++){
      var k=fields[i].getAttribute("data-save");
      var v=localStorage.getItem("mf_"+k);
      if(v!==null) fields[i].value=v;
      fields[i].addEventListener("input",function(){
        localStorage.setItem("mf_"+this.getAttribute("data-save"),this.value);
      });
    }
  }
  function getJSON(k,fallback){
    try{var v=JSON.parse(localStorage.getItem(k));return v||fallback}catch(e){return fallback}
  }
  function setJSON(k,v){localStorage.setItem(k,JSON.stringify(v))}

  function renderList(holderId,key,defaults,removable){
    var holder=document.getElementById(holderId), items=getJSON(key,defaults.map(function(t){return {t:t,d:false}}));
    holder.innerHTML="";
    for(var i=0;i<items.length;i++){
      (function(idx){
        var r=document.createElement("div");r.className="checkrow";
        var cb=document.createElement("input");cb.type="checkbox";cb.checked=!!items[idx].d;
        cb.onchange=function(){items[idx].d=this.checked;setJSON(key,items)};
        var g=document.createElement("div");g.className="grow";g.textContent=items[idx].t;
        r.appendChild(cb);r.appendChild(g);
        if(removable){
          var x=document.createElement("button");x.className="remove";x.textContent="✕";
          x.onclick=function(){items.splice(idx,1);setJSON(key,items);renderList(holderId,key,defaults,removable)};
          r.appendChild(x);
        }
        holder.appendChild(r);
      })(i);
    }
  }

  window.addShot=function(){
    var inp=document.getElementById("newShot"),t=inp.value.replace(/^\s+|\s+$/g,"");if(!t)return;
    var a=getJSON("mf_shots",defaultShots.map(function(x){return {t:x,d:false}}));a.push({t:t,d:false});setJSON("mf_shots",a);inp.value="";renderList("shotList","mf_shots",defaultShots,true);
  };
  window.addQuestion=function(){
    var inp=document.getElementById("newQuestion"),t=inp.value.replace(/^\s+|\s+$/g,"");if(!t)return;
    var a=getJSON("mf_questions",defaultQuestions.map(function(x){return {t:x,d:false}}));a.push({t:t,d:false});setJSON("mf_questions",a);inp.value="";renderList("questions","mf_questions",defaultQuestions,true);
  };
  window.resetGear=function(){
    localStorage.removeItem("mf_gear");renderList("gearChecklist","mf_gear",defaultGear,false);
  };

  function renderPlayers(){
    var holder=document.getElementById("players"),players=getJSON("mf_players",[]);
    holder.innerHTML="";
    for(var i=0;i<players.length;i++){
      (function(idx){
        var p=document.createElement("div");p.className="player";
        var h=document.createElement("div");h.className="playerhead";
        var name=document.createElement("b");name.textContent=players[idx].name;
        var del=document.createElement("button");del.className="remove";del.textContent="Supprimer";
        del.onclick=function(){players.splice(idx,1);setJSON("mf_players",players);renderPlayers()};
        h.appendChild(name);h.appendChild(del);p.appendChild(h);
        var body=document.createElement("div");body.className="playerbody";
        for(var j=0;j<poses.length;j++){
          (function(poseIdx){
            var r=document.createElement("div");r.className="checkrow";
            var cb=document.createElement("input");cb.type="checkbox";cb.checked=!!players[idx].poses[poseIdx];
            cb.onchange=function(){players[idx].poses[poseIdx]=this.checked;setJSON("mf_players",players)};
            var tx=document.createElement("div");tx.className="grow";tx.textContent=poses[poseIdx];
            r.appendChild(cb);r.appendChild(tx);body.appendChild(r);
          })(j);
        }
        p.appendChild(body);holder.appendChild(p);
      })(i);
    }
  }
  window.addPlayer=function(){
    var inp=document.getElementById("newPlayer"),t=inp.value.replace(/^\s+|\s+$/g,"");if(!t)return;
    var p=getJSON("mf_players",[]);p.push({name:t,poses:[false,false,false,false,false,false]});setJSON("mf_players",p);inp.value="";renderPlayers();
  };

  function renderLeads(){
    var holder=document.getElementById("leadList"),leads=getJSON("mf_leads",[]);
    holder.innerHTML="";
    for(var i=0;i<leads.length;i++){
      (function(idx){
        var c=document.createElement("div");c.className="leadcard";
        var top=document.createElement("div");top.className="leadtop";
        var b=document.createElement("b");b.textContent=leads[idx].name;
        var d=document.createElement("button");d.className="remove";d.textContent="✕";
        d.onclick=function(){leads.splice(idx,1);setJSON("mf_leads",leads);renderLeads()};
        top.appendChild(b);top.appendChild(d);c.appendChild(top);
        var s=document.createElement("select");
        ["À contacter","Contacté","Relance","RDV pris","Devis envoyé","Gagné","Perdu"].forEach(function(x){
          var o=document.createElement("option");o.textContent=x;o.value=x;if(leads[idx].status===x)o.selected=true;s.appendChild(o);
        });
        s.onchange=function(){leads[idx].status=this.value;setJSON("mf_leads",leads)};
        c.appendChild(s);holder.appendChild(c);
      })(i);
    }
  }
  window.addLead=function(){
    var inp=document.getElementById("leadName"),t=inp.value.replace(/^\s+|\s+$/g,"");if(!t)return;
    var a=getJSON("mf_leads",[]);a.push({name:t,status:"À contacter"});setJSON("mf_leads",a);inp.value="";renderLeads();
  };

  window.calcPrice=function(){
    function n(id){return parseFloat(document.getElementById(id).value)||0}
    var hs=n("hoursShoot"),he=n("hoursEdit"),rate=n("hourRate"),km=n("km"),kr=n("kmRate"),fc=n("fixedCosts");
    var th=hs+he, prod=th*rate, travel=km*kr, total=prod+travel+fc;
    document.getElementById("totalHours").textContent=th.toFixed(1)+" h";
    document.getElementById("productionPrice").textContent=prod.toFixed(0)+" €";
    document.getElementById("travelPrice").textContent=travel.toFixed(2)+" €";
    document.getElementById("totalPrice").textContent=total.toFixed(2)+" €";
  };

  window.addEventListener("load",function(){
    document.getElementById("homeBtn").style.display="none";
    loadSimple();
    renderList("shotList","mf_shots",defaultShots,true);
    renderList("questions","mf_questions",defaultQuestions,true);
    renderList("gearChecklist","mf_gear",defaultGear,false);
    renderList("droneChecklist","mf_drone",defaultDrone,false);
    renderPlayers();renderLeads();calcPrice();

    if("serviceWorker" in navigator){
      navigator.serviceWorker.register("sw.js").catch(function(){});
    }
  });
})();
