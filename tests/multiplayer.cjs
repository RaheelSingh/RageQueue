// Shared Net module loaded verbatim in independent VM browser-like sandboxes.
// This tests host authority, cooldown/quota and BFG global settlement via BroadcastChannel.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const logicCode=html.split('/*LOGIC_START*/')[1].split('/*LOGIC_END*/')[0];
const netCode=html.split('const Net=(()=>{')[1].split('// ============================================================ music:')[0];
assert.ok(netCode&&logicCode);
const registry=new Map();let clock=1_800_000_000_000;
class TestDate extends Date {static now(){return clock}}
class FakeBC{
 constructor(name){this.name=name;if(!registry.has(name))registry.set(name,new Set());registry.get(name).add(this)}
 postMessage(data){for(const ch of registry.get(this.name)||[])if(ch!==this)queueMicrotask(()=>ch.onmessage?.({data}));}
 close(){registry.get(this.name)?.delete(this)}
}
const mk=()=>{
 const timers=[];
 const ctx={console,Date:TestDate,Math,Map,Set,BroadcastChannel:FakeBC,queueMicrotask,
  setInterval:(fn)=>{timers.push(fn);return timers.length},clearInterval:()=>{},setTimeout,clearTimeout};
 vm.createContext(ctx);
 const L=vm.runInContext(logicCode+'\nLogic;',ctx);
 ctx.Logic=L;
 return {N:vm.runInContext('const Net=(()=>{'+netCode+'\nNet;',ctx),L,pump:()=>timers.forEach(fn=>fn())};
};
const settle=()=>new Promise(resolve=>setImmediate(resolve));
async function pair(seed){
 const a=mk(),b=mk();await a.N.hostRoom('Alice','bc','ABCD');
 await b.N.joinRoom('Bob','bc','ABCD');await settle();a.N.startRace(seed);await settle();
 assert.equal(a.N.players.length,2);assert.equal(b.N.players.length,2);return [a,b];
}
const fin=(ctx,end='id',x=1500)=>ctx.N.sendFinish({fm:5000,d:1,sc:5000,end,x});
async function clockTest(){
 const [a,b]=await pair(867530);
 fin(a);await settle();assert.ok(b.N.clk&&a.N.clk,'last call starts after first finisher');
 assert.ok(b.N.canClock(),'RUNNER can alter last call');
 let before=b.N.clk.rem;
 b.N.adjClock(1);await settle();assert.ok(b.N.clk.rem>before+29000,'runner added time');
 assert.equal(b.N.clockStatus().left,2);
 b.N.adjClock(-1);await settle();assert.equal(b.N.clockStatus().left,2,'cooldown rejects immediate change');
 for(let i=0;i<2;i++){
  clock+=10001;b.N.pushState({x:123,y:400});await settle();a.pump();await settle();b.N.adjClock(-1);await settle();assert.equal(b.N.clockStatus().left,1-i);
 }
 clock+=10001;b.N.pushState({x:123,y:400});await settle();a.pump();await settle();b.N.adjClock(1);await settle();assert.equal(b.N.clockStatus().left,0,'3 actions total max');
 assert.ok(!b.N.canClock(),'budget exhaustion disables further actions');
 assert.equal(a.N.clockStatus().left,3,'other players retain own independent budget');
 a.N.leave();b.N.leave();
}
async function bfgTest(){
 const probe=mk();let seed=0;while(!probe.L.isBfg(seed))seed++;
 const [a,b]=await pair(seed);
 const world=a.L.makeLevel(seed);const pos=world.bfgAt;
 assert.ok(Number.isFinite(pos),'BFG spawns on special seed');
 let finaleA=null,finaleB=null,blastA=null,blastB=null;
 a.N.cb.final=m=>finaleA=m;b.N.cb.final=m=>finaleB=m;
 a.N.cb.bfg=m=>blastA=m;b.N.cb.bfg=m=>blastB=m;
 fin(a,'id',2000);await settle();
 assert.equal(a.N.me().w,1);
 fin(b,'bfg',pos);await settle();
 const ap=a.N.me(),bp=b.N.me();
 assert.equal(ap.end,'dnf','early winner demoted to DNF');
 assert.equal(bp.end,'bfg','BFG finder wins immediately');
 assert.equal(ap.sc,0);assert.equal(ap.w,0,'early winner loses race win');
 assert.equal(bp.w,1);assert.equal(a.N.phase,'done');
 assert.equal(blastA?.winner,b.N.id);assert.equal(blastB?.winner,b.N.id);
 assert.equal(finaleA?.reason,'bfg');assert.equal(finaleB?.reason,'bfg');
 // Neither host nor peer accepts late finishing or clock messages.
 fin(a);await settle();assert.equal(a.N.me().end,'dnf');
 assert.ok(!a.N.clk&&!b.N.clk);
 a.N.leave();b.N.leave();
}
async function naturalFinishTest(){
 const [a,b]=await pair(115221);let finA=null,finB=null;
 a.N.cb.final=m=>finA=m;b.N.cb.final=m=>finB=m;
 fin(a);await settle();assert.equal(finA,null,'do not settle while other racer may find the BFG');
 fin(b);await settle();assert.equal(finA.reason,'finished');assert.equal(finB.reason,'finished');
 assert.equal(a.N.phase,'done');a.N.leave();b.N.leave();
}
(async()=>{await clockTest();await bfgTest();await naturalFinishTest();console.log('PASS v3.1 multiplayer | host-enforced quota + cooldown, running-racer controls, BFG overrides earlier finishes and settles all racers, natural finalisation')})().catch(e=>{console.error(e);process.exitCode=1});
