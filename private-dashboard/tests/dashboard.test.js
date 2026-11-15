import test from "node:test";
import assert from "node:assert/strict";
import { validateDashboard } from "../src/index.js";
import { readFileSync } from "node:fs";

function sample() {
  return {
    schema:"mf-screen/v1",updatedAt:null,
    agenda:{date:"2026-11-16",items:[{time:"10:30",title:"R1 confirmé"}]},
    poker:{unit:"games",goal_games:3000,current_games:200,demo:true,
      start_date:"2026-11-15",end_date:"2026-11-30",
      goal_eur:null,current_eur:null,hours_done:null,hours_goal:null,days_done:null,days_goal:null},
    commercial:{period:"novembre 2026",r1:null,r2:null,objective_r1:null},
    priorities:[]
  };
}
test("schema mf-screen/v1 and missing metrics accepted without invented zero",()=>{
  assert.equal(validateDashboard(sample()),true);
});
test("rejects unsafe shapes and oversized arrays",()=>{
  const d=sample();d.priorities=["1","2","3","4"];
  assert.equal(validateDashboard(d),false);
  const e=sample();e.poker.goal_games=-1;
  assert.equal(validateDashboard(e),false);
  const f=sample();f.agenda.items=[{time:"11:00",title:5}];
  assert.equal(validateDashboard(f),false);
});
test("private client never caches confidential dashboard data",()=>{
  const script=readFileSync(new URL("../site/app.js",import.meta.url),"utf8");
  assert.doesNotMatch(script,/safeSave\(CACHE,\s*data\)/);
  assert.doesNotMatch(script,/serviceWorker\.register/);
  assert.doesNotMatch(script,/safeLoad\(CACHE\)/);
});
test("login + private datastore separated from public GitHub Pages",()=>{
  const source=readFileSync(new URL("../src/index.js",import.meta.url),"utf8");
  assert.match(source,/STORE\.get\("dashboard"/);
  assert.match(source,/HttpOnly; Secure; SameSite=Strict/);
  assert.match(source,/session_required/);
});
