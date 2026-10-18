// In-memory Netlify Blobs simulation: test daily filtering and UTC rollovers
// against the actual deployed Function source, not a separate imitation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
async function main(){
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 const browser=vm.runInNewContext(html.split('/*LOGIC_START*/')[1].split('/*LOGIC_END*/')[0]+'\nLogic;');
 const store=new Map();
 globalThis.__scoresTestStore=()=>({
  get:async key=>store.get(key)||null,
  setJSON:async(key,value)=>{store.set(key,JSON.parse(JSON.stringify(value)))}
 });
 globalThis.__scoresTestDay='2026-10-18';
 let src=fs.readFileSync(path.join(__dirname,'..','netlify','functions','scores.mjs'),'utf8');
 src=src.replace("import { getStore } from '@netlify/blobs';",'const getStore=globalThis.__scoresTestStore;');
 src=src.replace("const utcDay = () => new Date().toISOString().slice(0, 10);",'const utcDay = () => globalThis.__scoresTestDay;');
 const url='data:text/javascript;base64,'+Buffer.from(src).toString('base64');
 const mod=await import(url);
 const fetchScore=(method,query='',body=null)=>mod.default(new Request('https://score-test.example/api/scores'+query,{method,headers:body?{'content-type':'application/json'}:{},body:body?JSON.stringify(body):undefined}));
 const get=async query=>(await fetchScore('GET',query)).json();
 const send=async(row)=>(await fetchScore('POST','',row)).json();
 const row=(id,seed)=>({id,name:'Player',score:4200,t:5000,d:2,c:40,e:'id',seed,hell:false,mp:false});
 const s1=browser.dailySeed(globalThis.__scoresTestDay);
 const first=await get('?daily=1');assert.equal(first.day,'2026-10-18');assert.equal(first.seed,s1);assert.equal(first.rows.length,0);
 const post1=await send(row('first',s1));assert.equal(post1.dailyRank,1);
 const allDay=await get('?daily=1');assert.equal(allDay.rows.length,1);
 const postOther=await send(row('other',s1+1));assert.equal(postOther.dailyRank,null);
 assert.equal((await get('?daily=1')).rows.length,1,'other-seed score excluded');
 assert.equal((await get()).rows.length,2,'all-time still keeps other seeds');
 assert.equal((await get('?seed='+s1)).rows.length,1,'seed board works');
 globalThis.__scoresTestDay='2026-10-19';
 const s2=browser.dailySeed(globalThis.__scoresTestDay);
 assert.notEqual(s1,s2);
 const newDay=await get('?daily=1');assert.equal(newDay.day,'2026-10-19');assert.equal(newDay.seed,s2);assert.equal(newDay.rows.length,0,'daily board resets at UTC midnight');
 const late=await send(row('yesterday',s1));assert.equal(late.dailyRank,null,'old run cannot enter new daily');
 assert.equal((await get('?daily=1')).rows.length,0);
 assert.equal((await send(row('today',s2))).dailyRank,1);
 assert.equal((await get('?daily=1')).rows[0].name,'Player');
 assert.equal((await get()).rows.length,4,'world list continues across rollover');
 const options=await fetchScore('OPTIONS');assert.equal(options.status,204);assert.equal(options.headers.get('access-control-allow-origin'),'*');
 console.log('PASS v3.0 backend | UTC midnight rollover | daily seed agreement | cross-device shared store | CORS');
}
main().catch(e=>{console.error(e);process.exitCode=1});
