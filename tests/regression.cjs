// v2.9 repeatability, coin reachability, solo/multiplayer NPC regressions.
// Extract the actual browser logic from index.html rather than maintaining a second copy.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const code = html.split('/*LOGIC_START*/')[1]?.split('/*LOGIC_END*/')[0];
assert.ok(code, 'Logic section must exist inside index.html');
const L = vm.runInNewContext(code + '\nLogic;', { console }, { timeout: 15000 });
const inp = { l:false, r:false, jp:false, ok:false, jump:false, burst:false, nav:0, pick:-1, interact:false };
let count=0, shifted=0, nNorm=0, nHell=0, hazNorm=0, hazHell=0, decoys=0;
for(const id of ['pPause','pauseContinue','pauseRestart','pauseMenu','musicVolume','sfxVolume','bOptions','bPause'])
 assert.ok(html.includes('id="'+id+'"'), 'Settings/pause UI required: '+id);
assert.ok(html.includes("if(mode==='play'&&(!pauseOpen||raceOn))"),'solo stops; online race continues');
for (let i=0;i<240;i++) {
 const seed=i<200?i:(i*2087483)%1073741824;
 const a=L.makeLevel(seed),b=L.makeLevel(seed);
 assert.equal(JSON.stringify(a.coins), JSON.stringify(b.coins), 'same seed -> identical coins');
 assert.equal(JSON.stringify(a.pads), JSON.stringify(b.pads), 'same seed -> identical pads');
 count+=a.coins.length; shifted+=a.coinAdjustments;
 if(a.hell){nHell++;hazHell+=a.hazards.length}
 else{nNorm++;hazNorm+=a.hazards.length;decoys+=a.stamps.filter(s=>s.id.startsWith('decoy')).length}
 for(const c of a.coins) {
  assert.ok(c.x>=0 && c.x<a.len && c.y>0 && c.y<L.GY, 'coin within level');
  assert.ok(L.coinReachable(a,c), 'coin reachable on seed '+seed+' at '+c.x+','+c.y);
 }
}
const sd=9898;
const race=L.newState(sd,false,true),npc=race.world.npcs[0];
race.p.x=npc.x-14;race.p.y=L.GY-L.PH;race.p.onGround=true;
L.step(race,inp);assert.equal(race.enc,null,'race NPC must be skippable');
race.p.x=npc.x-14;race.p.y=L.GY-L.PH;race.p.onGround=true;
L.step(race,{...inp,interact:true});assert.equal(race.enc?.id,npc.enc,'I opens NPC');
assert.equal(race.enc?.stage,'choose');
assert.equal(L.ENC[npc.enc].ch.length,3,'dialogue has 3 choices');
L.step(race,{...inp,pick:0});assert.equal(race.enc.ci,0,'player choice must be respected');
const solo=L.newState(sd,true,false);
solo.p.x=npc.x-14;solo.p.y=L.GY-L.PH;solo.p.onGround=true;
L.step(solo,inp);assert.equal(solo.enc?.id,npc.enc,'solo still auto-triggers');
const win=L.newState(sd,false,true);
win.p.x=win.world.goal.x+10;win.p.y=L.GY-L.PH;win.p.onGround=true;
L.step(win,inp);assert.equal(win.enc?.id,'nomsa','Window 7 must not be skippable');
assert.ok(hazNorm/nNorm>19,'Normal mode should include more trap encounters than old build');
assert.ok(hazHell/nHell>hazNorm/nNorm,'Hell remains more demanding');
assert.ok(decoys>nNorm*0.35,'normal decoy checkpoints included on many seeds');

// v2.9: W / Up (jp) moves and jumps but never confirms a choice; Space / Enter (ok) confirms.
{
 const t=L.newState(sd,true,false),n=t.world.npcs[0];
 t.p.x=n.x-14;t.p.y=L.GY-L.PH;t.p.onGround=true;L.step(t,inp);
 for(let i=0;i<12;i++)L.step(t,inp);
 L.step(t,{...inp,ok:true});assert.equal(t.enc.stage,'choose','Space/Enter leaves the talk stage');
 for(let i=0;i<12;i++)L.step(t,inp);
 L.step(t,{...inp,jp:true,nav:1});assert.equal(t.enc.stage,'choose','W/S must not confirm');
 const want=t.enc.sel;assert.equal(want,1,'S moves the selection down');
 L.step(t,{...inp,jp:true,nav:-1});assert.equal(t.enc.stage,'choose','W must not confirm');assert.equal(t.enc.sel,0,'W moves up');
 L.step(t,{...inp,nav:1});L.step(t,{...inp,ok:true});assert.equal(t.enc.ci,1,'Space/Enter confirms the highlighted choice');
}
// v3.1: Any racer may change the clock, but the HOST limits all users.
assert.ok(html.includes('const CLOCK_ACTIONS=3,CLOCK_COOLDOWN=10000'),'three changes per player, 10 second cooldown');
assert.ok(html.includes('p.aj=(p.aj||0)+1'),'host debits timer usage');
assert.ok(html.includes('N.canClock=()=>'),'clients expose live timer eligibility');
assert.ok(html.includes('id="raceClockBar"'),'runners also have a timer UI');
assert.ok(html.includes('id="raceClkMinus"')&&html.includes('id="raceClkPlus"'),'runners can add or remove time');
// v3.2: the key reference must live AFTER both menu columns, not inside the right-side form.
const menuMarkup=html.split('id="pMenu"')[1].split('id="pLobby"')[0];
assert.ok(/<\/div>\s*<section class="menuKeys"/.test(menuMarkup),'menu controls belong below (not inside) the two columns');
assert.ok(menuMarkup.includes('<b>L</b> toggle full / LITE background'),'L key explained in always-visible menu controls');
assert.ok(html.includes('<span class="key">L toggle background (FULL / LITE)</span>'),'L key displayed below the game');
assert.ok(html.includes('.menuKeys .keyGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))'),'full-width controls footer uses a wide grid');
assert.ok(html.includes('<summary>More controls, traps &amp; multiplayer rules</summary>'),'expandable instructions are available');
assert.ok(html.includes('setInterval(()=>{if(!document.hidden)refreshBoards()},10000)'),'world board periodically refreshes when visible');
assert.ok(html.includes("else Net.sendFinish({fm:S.total,d:S.deaths,end:S.ending,sc,x:S.p.x});"),'finish checks include position for BFG');
// v2.9: world board works off-Netlify (itch.io) through the full site URL.
assert.ok(html.includes("const SCORE_API=") && !/fetch\('\/api\/scores/.test(html),'score calls use SCORE_API');
const fn=fs.readFileSync(path.join(__dirname,'..','netlify','functions','scores.mjs'),'utf8');
assert.ok(fn.includes("'access-control-allow-origin': '*'") && fn.includes("req.method === 'OPTIONS'"),'scores function sends CORS');
console.log(`PASS v3.2 | 240 deterministic seeds | ${count} reachable coins | ${shifted} adjusted | average hazards ${ (hazNorm/nNorm).toFixed(1)} Normal / ${(hazHell/nHell).toFixed(1)} Hell | ${decoys} decoy checkpoints | NPC, confirm-key, shared limited clock, live board and CORS checks`);

// v3.0: The stamp's moving underside must crush, but sides and an already
// stationary/down piston must not kill the player.
{
 const h={k:'stamp',x:100,w:90,per:200,ph:0};
 const under={x:130,y:L.GY-L.PH+4,w:L.PW-8,h:L.PH-8};
 assert.ok(L.stampCrush(h,145,under),'descending piston crushes a player directly beneath');
 assert.ok(!L.stampCrush(h,170,under),'stationary piston side contact is safe');
 assert.ok(!L.stampCrush(h,130,under),'raised piston is safe');
 assert.ok(!L.stampCrush(h,145,{...under,x:86}),'edge/side contact is not a crush');
}
// Teleport arrivals must have actual floor, not a hazard, checkpoint or a
// deadly fake checkpoint in the first 140 pixels of the landing lane.
{
 let total=0;
 for(let seed=0;seed<1000;seed++){
  const world=L.makeLevel(seed);
  for(const pd of world.pads.filter(p=>p.k==='tele')){
   total++;
   const a=pd.tx-10,b=pd.tx+L.PW+135;
   assert.ok(world.floors.some(f=>a>=f[0]&&b<=f[1]),'teleport needs real continuous landing floor: '+seed);
   for(const st of world.stamps)assert.ok(st.x>=b||st.x+40<=a,'stamp too close to exit on seed '+seed);
   for(const hz of world.hazards){if(hz.x===undefined)continue;
    assert.ok(hz.x>=b||hz.x+(hz.w||0)<=a||hz.k==='saw','hazard too close to portal exit on seed '+seed);
   }
  }
 }
 assert.ok(total>300,'should exercise a meaningful number of teleporters');
 console.log('PASS v3.0 portals:',total,'portal arrivals across 1000 seeds; stamp crush directions verified');
}
assert.equal(L.utcDailyDate(Date.parse('2026-10-18T23:59:59Z')),'2026-10-18');
assert.equal(L.utcDailyDate(Date.parse('2026-10-19T00:00:00Z')),'2026-10-19');
assert.equal(L.dailySeed('2026-10-18'),L.dailySeed('2026-10-18'));
assert.notEqual(L.dailySeed('2026-10-18'),L.dailySeed('2026-10-19'));
assert.ok(html.includes("seed==='daily'?'?daily=1'"),'menu daily leaderboard uses server daily filter');
assert.ok(html.includes("if(WB.daily.day!==d.day)renderMenuTop();"),'menu refreshes across midnight');
