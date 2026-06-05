/* THE REBUILD TRACKER (FREE) — app logic. Vanilla JS, localStorage only. */
(function(){
"use strict";

const IS_FREE = true;
const FREE_HABIT_CAP = 5;
const GUMROAD_URL = "https://seangoesnorth.gumroad.com/l/rebuild-tracker";

const COPY = {
  allDoneToday: "Another one. Day by day.",
  streakZero: "Day 1. The only one that matters right now.",
  resetWarning: "This clears everything. You sure?",
  shareHandle: "@SEANGOESNORTH",
  shareTagline: "THE REBUILD TRACKER",
  prompts: [
    "What moved the needle today?",
    "What would tomorrow's version of you thank you for?",
    "Day by day. What was your one thing?",
    "Did you show up? That's all that matters.",
    "What's the version of yourself you're building toward?",
    "One win. Name it.",
    "What habit felt hardest today? That's the one to protect.",
    "If today was a brick in the staircase — did you lay it?",
    "Not perfect. Not all at once. Just a little. Did you?",
    "Who are you becoming? Did today move toward that?",
    "The rebuild is daily. What did your day look like?",
    "Small things compound. What small thing did you do?",
    "You didn't quit. That counts.",
    "What's one thing you'd do differently tomorrow?",
    "Progress isn't always visible. Did you move anyway?",
    "The goal isn't perfection. The goal is consistency. How'd you do?",
    "Day by day. Not decade by decade. What happened today?",
    "What are you rebuilding? Did today serve that?",
    "Two years. Nine months. One day at a time. What's your count?",
    "Close your eyes. Is tomorrow's you proud of today?"
  ]
};

const PILLAR_COLORS = {BODY:"#E55A2B",MIND:"#6B4FA0",CRAFT:"#E8C547"};
const DEFAULTS = [
  {id:uid(),name:"Work out",pillar:"BODY",emoji:"🏋️"},
  {id:uid(),name:"Hit protein goal",pillar:"BODY",emoji:"🥩"},
  {id:uid(),name:"Sober today",pillar:"MIND",emoji:"🕊️"},
  {id:uid(),name:"Journaled",pillar:"MIND",emoji:"📓"},
  {id:uid(),name:"Created something",pillar:"CRAFT",emoji:"⚒️"}
];

const KEY="rebuild_tracker_v1";
let state = load();

function uid(){return Math.random().toString(36).slice(2,9);}
function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw){const s=JSON.parse(raw); if(!s.log)s.log={}; if(!s.habits)s.habits=DEFAULTS.slice(); if(!s.bestStreak)s.bestStreak=0; if(!s.startDate)s.startDate=todayKey(); return s;}
  }catch(e){}
  return {habits:DEFAULTS.slice(), log:{}, bestStreak:0, startDate:todayKey()};
}
function save(){ try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){} }

function todayKey(d){ d=d||new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function dateFromKey(k){const[y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d);}

/* ---- TODAY ---- */
function renderToday(){
  const tk = todayKey();
  document.getElementById("todayDate").textContent = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  document.getElementById("dayCount").textContent = dayOfRebuild();
  const list = document.getElementById("habitList");
  const empty = document.getElementById("todayEmpty");
  list.innerHTML="";
  if(!state.habits.length){empty.hidden=false;} else {empty.hidden=true;}
  const doneSet = new Set(state.log[tk]||[]);
  state.habits.forEach(h=>{
    const row=document.createElement("div");
    row.className="habit-row "+h.pillar+(doneSet.has(h.id)?" done":"");
    row.innerHTML=`<span class="fill"></span>
      <span class="check"><svg viewBox="0 0 24 24" fill="none" stroke="#060B17" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
      <span class="habit-meta"><span class="habit-name">${esc(h.name)}</span><span class="habit-pillar ${h.pillar}">${h.pillar}</span></span>
      ${h.emoji?`<span class="habit-emoji">${esc(h.emoji)}</span>`:""}`;
    row.addEventListener("click",()=>toggle(h.id));
    list.appendChild(row);
  });
  // done state
  const done = document.getElementById("doneState");
  if(state.habits.length && doneSet.size===state.habits.length){
    done.hidden=false;
    document.getElementById("doneMsg").textContent = COPY.allDoneToday;
    if(!done.dataset.prompt){
      done.dataset.prompt="1";
      document.getElementById("reflectPrompt").textContent = COPY.prompts[Math.floor(Math.random()*COPY.prompts.length)];
    }
  } else { done.hidden=true; done.dataset.prompt=""; }
}
function toggle(id){
  const tk=todayKey();
  const arr = state.log[tk] ? state.log[tk].slice() : [];
  const i = arr.indexOf(id);
  if(i>=0)arr.splice(i,1); else arr.push(id);
  if(arr.length)state.log[tk]=arr; else delete state.log[tk];
  recalcBest();
  save(); renderToday();
}
function dayOfRebuild(){
  const start = dateFromKey(state.startDate);
  const diff = Math.floor((new Date().setHours(0,0,0,0)-start.setHours(0,0,0,0))/86400000);
  return Math.max(1,diff+1);
}

/* ---- STREAKS ---- */
function currentStreak(){
  let s=0; let d=new Date();
  // a day counts if >=1 habit completed
  while(true){
    const k=todayKey(d);
    if((state.log[k]||[]).length>0){s++; d.setDate(d.getDate()-1);}
    else break;
  }
  return s;
}
function recalcBest(){ const c=currentStreak(); if(c>state.bestStreak)state.bestStreak=c; }

/* ---- CALENDAR ---- */
let calMonth = new Date();
function renderCalendar(){
  const y=calMonth.getFullYear(), m=calMonth.getMonth();
  document.getElementById("calTitle").textContent = calMonth.toLocaleDateString("en-US",{month:"long",year:"numeric"}).toUpperCase();
  const grid=document.getElementById("calGrid"); grid.innerHTML="";
  const first=new Date(y,m,1).getDay();
  const days=new Date(y,m+1,0).getDate();
  for(let i=0;i<first;i++){const e=document.createElement("div");e.className="cal-cell empty";grid.appendChild(e);}
  const tk=todayKey();
  for(let day=1;day<=days;day++){
    const k=todayKey(new Date(y,m,day));
    const pct = completionPct(k);
    const cell=document.createElement("div");
    let lvl=0; if(pct>0&&pct<50)lvl=1; else if(pct<100&&pct>=50)lvl=2; else if(pct>=100)lvl=3;
    cell.className="cal-cell"+(lvl?" lvl"+lvl:"")+(k===tk?" today":"");
    cell.textContent=day;
    cell.addEventListener("click",()=>showDay(k));
    grid.appendChild(cell);
  }
}
function completionPct(k){
  if(!state.habits.length)return 0;
  const done=(state.log[k]||[]).filter(id=>state.habits.some(h=>h.id===id)).length;
  return Math.round(done/state.habits.length*100);
}
function showDay(k){
  const det=document.getElementById("calDetail"); det.hidden=false;
  const doneSet=new Set(state.log[k]||[]);
  let html=`<div class="cd-date">${dateFromKey(k).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}).toUpperCase()}</div>`;
  if(!state.habits.length){html+=`<div class="cd-item miss">No habits.</div>`;}
  state.habits.forEach(h=>{
    const d=doneSet.has(h.id);
    html+=`<div class="cd-item${d?"":" miss"}"><span class="dot ${h.pillar}" style="opacity:${d?1:.3}"></span>${d?"✓":"○"} ${esc(h.name)}</div>`;
  });
  det.innerHTML=html;
}

/* ---- STATS ---- */
function renderStats(){
  document.getElementById("curStreak").textContent=currentStreak();
  document.getElementById("bestStreak").textContent=state.bestStreak;
  document.getElementById("rate7").textContent=rangeRate(7)+"%";
  document.getElementById("rate30").textContent=rangeRate(30)+"%";
  // pillar
  const pb=document.getElementById("pillarBars"); pb.innerHTML="";
  ["BODY","MIND","CRAFT"].forEach(p=>{
    const pct=pillarRate(p,30);
    const el=document.createElement("div"); el.className="pbar "+p;
    el.innerHTML=`<div class="pbar-top"><span class="pbar-label">${p}</span><span>${pct}%</span></div>
      <div class="pbar-track"><div class="pbar-fill" style="width:${pct}%"></div></div>`;
    pb.appendChild(el);
  });
  // best/worst
  const bw=document.getElementById("bestWorst"); bw.innerHTML="";
  if(state.habits.length){
    const scored=state.habits.map(h=>({h,pct:habitRate(h.id,30)})).sort((a,b)=>b.pct-a.pct);
    const best=scored[0], worst=scored[scored.length-1];
    bw.innerHTML=`<div class="bw"><div><div class="bw-label">BEST HABIT</div><div class="bw-val">${esc(best.h.name)}</div></div><div class="bw-pct">${best.pct}%</div></div>
      <div class="bw"><div><div class="bw-label">HARDEST HABIT</div><div class="bw-val">${esc(worst.h.name)}</div></div><div class="bw-pct">${worst.pct}%</div></div>`;
  }
}
function rangeRate(n){
  if(!state.habits.length)return 0;
  let total=0,done=0,d=new Date();
  for(let i=0;i<n;i++){const k=todayKey(d);total+=state.habits.length;done+=(state.log[k]||[]).filter(id=>state.habits.some(h=>h.id===id)).length;d.setDate(d.getDate()-1);}
  return total?Math.round(done/total*100):0;
}
function pillarRate(p,n){
  const hs=state.habits.filter(h=>h.pillar===p); if(!hs.length)return 0;
  let total=0,done=0,d=new Date();
  for(let i=0;i<n;i++){const k=todayKey(d);const set=new Set(state.log[k]||[]);hs.forEach(h=>{total++;if(set.has(h.id))done++;});d.setDate(d.getDate()-1);}
  return total?Math.round(done/total*100):0;
}
function habitRate(id,n){
  let done=0,d=new Date();
  for(let i=0;i<n;i++){const k=todayKey(d);if((state.log[k]||[]).includes(id))done++;d.setDate(d.getDate()-1);}
  return Math.round(done/n*100);
}

/* ---- SHARE CARD (PRO only) ---- */
function makeShareCard(){
  if(IS_FREE){ window.open(GUMROAD_URL,"_blank","noopener"); return; }
  const c=document.getElementById("shareCanvas"),x=c.getContext("2d");
  x.fillStyle="#060B17";x.fillRect(0,0,1080,1080);
  // grid
  x.strokeStyle="rgba(120,165,220,0.10)";x.lineWidth=1;
  for(let i=0;i<=1080;i+=54){x.beginPath();x.moveTo(i,0);x.lineTo(i,1080);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(1080,i);x.stroke();}
  x.textAlign="center";
  x.fillStyle="#8B96A8";x.font="500 28px 'JetBrains Mono',monospace";
  x.fillText("CURRENT STREAK",540,360);
  x.fillStyle="#E8C547";x.font="700 320px 'JetBrains Mono',monospace";
  x.fillText(String(currentStreak()),540,640);
  x.fillStyle="#EFE7D4";x.font="500 34px 'JetBrains Mono',monospace";
  x.fillText("DAYS · "+rangeRate(30)+"% LAST 30",540,720);
  x.fillStyle="#EFE7D4";x.font="800 40px 'Inter',sans-serif";
  x.fillText(COPY.shareTagline,540,940);
  x.fillStyle="#8B96A8";x.font="500 26px 'JetBrains Mono',monospace";
  x.fillText(COPY.shareHandle,540,985);
  c.toBlob(b=>{
    const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="rebuild-streak.png";a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  });
}

/* ---- SETUP / EDITOR ---- */
function renderSetup(){
  const list=document.getElementById("setupList"); list.innerHTML="";
  state.habits.forEach(h=>{
    const row=document.createElement("div");row.className="setup-row";
    row.innerHTML=`<span class="sr-emoji">${esc(h.emoji||"·")}</span>
      <span class="sr-meta"><span class="sr-name">${esc(h.name)}</span><span class="sr-pillar ${h.pillar}">${h.pillar}</span></span>
      <span class="sr-actions"><button class="sr-btn edit">✎</button><button class="sr-btn del">×</button></span>`;
    row.querySelector(".edit").addEventListener("click",()=>openEditor(h));
    row.querySelector(".del").addEventListener("click",()=>{ if(state.habits.length<=1){confirmBox("Keep at least one",("You need at least one habit to track."),null,true);return;} confirmBox("Delete habit?","Remove \""+h.name+"\"? Past records stay.",()=>{state.habits=state.habits.filter(z=>z.id!==h.id);save();renderSetup();renderToday();});});
    list.appendChild(row);
  });
}
let editing=null, editPillar="BODY";
function openEditor(h){
  editing=h||null;
  document.getElementById("editorTitle").textContent=h?"EDIT HABIT":"ADD HABIT";
  document.getElementById("habitName").value=h?h.name:"";
  document.getElementById("habitEmoji").value=h?(h.emoji||""):"";
  editPillar=h?h.pillar:"BODY";
  setPillarSel();
  document.getElementById("editorModal").hidden=false;
  setTimeout(()=>document.getElementById("habitName").focus(),50);
}
function setPillarSel(){document.querySelectorAll("#pillarPick .pp").forEach(b=>b.classList.toggle("sel",b.dataset.pillar===editPillar));}
function saveEditor(){
  const name=document.getElementById("habitName").value.trim();
  if(!name)return;
  const emoji=document.getElementById("habitEmoji").value.trim();
  if(editing){editing.name=name;editing.pillar=editPillar;editing.emoji=emoji;}
  else{ const cap = IS_FREE ? FREE_HABIT_CAP : 7; if(state.habits.length>=cap){ if(IS_FREE){closeEditor();confirmBox("Want more?","Free tracks "+FREE_HABIT_CAP+" habits. Pro unlocks 7, plus the share card and data backup — $9, no subscription.",()=>window.open(GUMROAD_URL,"_blank","noopener"));}else{confirmBox("Limit reached","Seven habits max. Keep it focused.",null,true);} return;} state.habits.push({id:uid(),name,pillar:editPillar,emoji});}
  save();closeEditor();renderSetup();renderToday();
}
function closeEditor(){document.getElementById("editorModal").hidden=true;editing=null;}

/* ---- CONFIRM ---- */
let confirmCb=null;
function confirmBox(title,msg,cb,infoOnly){
  document.getElementById("confirmTitle").textContent=title;
  document.getElementById("confirmMsg").textContent=msg;
  confirmCb=cb;
  document.getElementById("confirmYes").style.display=infoOnly?"none":"";
  document.getElementById("confirmNo").textContent=infoOnly?"OK":"CANCEL";
  document.getElementById("confirmModal").hidden=false;
}

/* ---- EXPORT (PRO only) ---- */
function exportData(){
  if(IS_FREE){ window.open(GUMROAD_URL,"_blank","noopener"); return; }
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="rebuild-tracker-backup.json";a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

/* ---- NAV ---- */
function switchView(v){
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.view===v));
  document.querySelectorAll(".view").forEach(s=>s.classList.toggle("active",s.id==="view-"+v));
  if(v==="calendar"){calMonth=new Date();renderCalendar();document.getElementById("calDetail").hidden=true;}
  if(v==="stats")renderStats();
  if(v==="settings")renderSetup();
  if(v==="today")renderToday();
}

function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

/* ---- WIRE UP ---- */
function init(){
  document.getElementById("tabbar").addEventListener("click",e=>{const t=e.target.closest(".tab");if(t)switchView(t.dataset.view);});
  document.getElementById("openSetup").addEventListener("click",()=>switchView("settings"));
  document.getElementById("addRow").addEventListener("click",()=>openEditor(null));
  document.getElementById("calPrev").addEventListener("click",()=>{calMonth.setMonth(calMonth.getMonth()-1);renderCalendar();document.getElementById("calDetail").hidden=true;});
  document.getElementById("calNext").addEventListener("click",()=>{calMonth.setMonth(calMonth.getMonth()+1);renderCalendar();document.getElementById("calDetail").hidden=true;});
  document.getElementById("shareBtn").addEventListener("click",makeShareCard);
  document.getElementById("exportBtn").addEventListener("click",exportData);
  document.getElementById("resetBtn").addEventListener("click",()=>confirmBox("Start over?",COPY.resetWarning,()=>{state={habits:DEFAULTS.slice(),log:{},bestStreak:0,startDate:todayKey()};save();switchView("today");}));
  document.getElementById("pillarPick").addEventListener("click",e=>{const b=e.target.closest(".pp");if(b){editPillar=b.dataset.pillar;setPillarSel();}});
  document.getElementById("editorSave").addEventListener("click",saveEditor);
  document.getElementById("editorCancel").addEventListener("click",closeEditor);
  document.getElementById("habitName").addEventListener("keydown",e=>{if(e.key==="Enter")saveEditor();});
  document.getElementById("confirmYes").addEventListener("click",()=>{document.getElementById("confirmModal").hidden=true;if(confirmCb)confirmCb();confirmCb=null;});
  document.getElementById("confirmNo").addEventListener("click",()=>{document.getElementById("confirmModal").hidden=true;confirmCb=null;});
  [document.getElementById("editorModal"),document.getElementById("confirmModal")].forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.hidden=true;}));
  recalcBest();save();
  renderToday();
}
init();
})();
