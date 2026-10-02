import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';
import './mobile/build.mjs';

const root=resolve('.'),saveKey='tomorrow-station-v1';
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost'),native=url.pathname.startsWith('/native/');
 const base=native?resolve(root,'dist-mobile'):root;
 const relative=native?url.pathname.slice(7):url.pathname;
 const file=resolve(base,'.'+(relative==='/'?'/index.html':relative));
 if(!file.startsWith(base+sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const source=await readFile('game.js','utf8');
const hook=`window.__home={get state(){return state},get dialogue(){return conversation},advance,interact,move,currentTask,roomEntities,closest,allowed,save,normaliseSave,closeDialogue,
 prepare(chapter,choice){state=fresh();state.chapter=chapter;state.choice='carry';state.ended=true;state.night2={...freshNight2(),choice,met:true,remembered:true,catName:true,ended:true};state.night3.ended=true;state.night3.choice='rest';state.day4.ended=true;state.day4.choice='table';state.homecoming.nameRecovered=choice==='name';state.room=chapter===2?0:6;state.x=348;state.y=178;active=true;$('start').hidden=true;$('ending').hidden=true;closeDialogue();objective();save();}
};requestAnimationFrame(frame);window.addEventListener`;
const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[],overflow=[],book=[];
let checked=0;
try{
 await mkdir('artifacts',{recursive:true});
 for(const choice of ['name','letter']){
  const context=await browser.newContext({viewport:{width:640,height:320},hasTouch:true});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:source.replace('requestAnimationFrame(frame);window.addEventListener',hook)}));
  await page.goto(base+'/native/');await page.locator('#app-menu-open').waitFor();
  await page.evaluate(()=>document.body.classList.add('reading-large'));
  async function read(){
   const result=await page.evaluate(()=>{
    const t=window.__home,rows=[];let count=0;
    while(t.dialogue&&count++<300){
     const d=t.dialogue,p=d.pages[d.index],line=document.getElementById('line'),panel=document.getElementById('dialogue');
     rows.push({chapter:t.state.chapter,speaker:p.speaker,text:line.innerText,voices:[...new Set((p.turns||[]).filter(x=>!x.narration).map(x=>x.speaker))],overflow:line.scrollHeight-line.clientHeight,panelOverflow:panel.scrollHeight-panel.clientHeight});
     if(d.choices&&d.index===d.pages.length-1)break;
     t.advance();
    }
    if(count>=300)throw Error('Dialogue did not finish');return rows;
   });
   for(const row of result){assert(row.voices.length<=1,'Mixed speakers: '+row.text);if(row.overflow>1||row.panelOverflow>1)overflow.push({route:choice,...row});book.push({route:choice,...row});checked++;}
   return result.map(x=>x.text).join('\n');
  }
  async function use(id){await page.evaluate(id=>{const t=window.__home,e=t.roomEntities().find(x=>x.id===id);if(!e)throw Error('Missing entity '+id);const candidates=[];for(let x=e.x-e.radius;x<=e.x+e.radius;x+=2)for(let y=e.y-e.radius;y<=e.y+e.radius;y+=2){const distance=Math.hypot(e.x-x,e.y-y);if(distance<e.radius&&t.allowed(x,y))candidates.push({x,y,distance});}candidates.sort((a,b)=>a.distance-b.distance);const found=candidates.find(p=>{t.state.x=p.x;t.state.y=p.y;return t.closest()?.id===id;});if(!found)throw Error('Unreachable '+id);t.interact();},id);}
  const get=()=>page.evaluate(()=>structuredClone(window.__home.state));
  // Both bell endings must include the shared name-storage scene, not just one side of a ternary.
  await page.evaluate(()=>{const t=window.__home;t.prepare(1,'letter');Object.assign(t.state,{room:0,met:true,ticket:true,cat:true,bell:true,ended:false,choice:null});});
  await use('keeper');await read();await page.locator('#choices button').nth(choice==='name'?0:1).click();
  const firstEnding=await read();assert(firstEnding.includes('좋았던 일도'));assert(firstEnding.includes('나중의 나에게'));
  assert((await get()).ended);assert.equal((await get()).choice,choice==='name'?'carry':'hang');
  // The loss and the cost of returning a name are stated BEFORE either choice.
  await page.evaluate(choice=>{window.__home.prepare(2,choice);window.__home.state.night2.ended=false;window.__home.state.night2.choice=null;window.__home.state.homecoming.nameRecovered=false;},choice);
  await use('keeper');const reveal=await read();assert(reveal.includes('돌아가셨다고'));assert(reveal.includes('지금 돌려받아도'));
  await page.locator('#choices button').nth(choice==='name'?0:1).click();
  assert.equal((await get()).night2.ended,false);
  await page.keyboard.press('Escape');assert.equal((await get()).night2.ended,false);assert.equal((await get()).night2.choice,null,'Cancel does not commit a name choice');
  await use('keeper');await read();await page.locator('#choices button').nth(choice==='name'?0:1).click();await read();
  assert.equal((await get()).homecoming.nameRecovered,choice==='name');
  await page.evaluate(choice=>window.__home.prepare(4,choice),choice);
  await page.locator('#app-menu-open').click();await page.locator('#next-night').click();await read();
  let partialSaved=false,replayedHouse=false,replayedHospital=false;
  for(let guard=0;guard<100;guard++){
   const s=await get();const info=await page.evaluate(()=>{const t=window.__home,c=t.state.chapter,i=t.state.homecoming.steps[Homecoming.keys[c]];return {c,i,length:Homecoming.scenes[c].length,task:t.currentTask(),room:t.state.room};});
   if(info.i===info.length){
    if(info.c===8)break;
    await page.locator('#end-next-night').click();await read();continue;
   }
   assert(info.task.id,'Every unfinished scene has a reachable task');
   if(info.room!==info.task.room){await use(info.task.id);if(await page.locator('#dialogue').isVisible())await read();continue;}
   await use(info.task.id);
   if(info.c===7&&info.i===5)assert((await page.locator('#location').innerText()).includes('기억 · 이름을 맡기기 전의 기록실'));
   if(info.c===6&&info.i===2&&!partialSaved){
    await page.keyboard.press('Escape');assert.equal((await get()).homecoming.steps.six,2,'Cancel does not complete a scene');
    await page.evaluate(()=>window.__home.save());const before=await get();await page.reload();await page.locator('#app-menu-open').waitFor();await page.locator('#continue').click();assert.deepEqual((await get()).homecoming,before.homecoming,'Mid-chapter restore');
    await page.evaluate(()=>document.body.classList.add('reading-large'));await use(info.task.id);partialSaved=true;
   }
   if(choice==='letter'&&[5,6,7,8].includes(info.c)&&[1,2].includes(info.i))await page.screenshot({path:`artifacts/homecoming-${info.c}-${info.i}.png`});
   await read();
   if(await page.locator('#choices button').count()){
    const field=info.c===5?'guestChoice':'bread';
    // Abandon one option, reload, then choose the other. Only a finished scene commits it.
    await page.locator('#choices button').nth(choice==='name'?1:0).click();
    await page.keyboard.press('Escape');await page.evaluate(()=>window.__home.save());assert.equal((await get()).homecoming[field],null);
    await page.reload();await page.locator('#app-menu-open').waitFor();await page.locator('#continue').click();
    assert.equal((await get()).homecoming[field],null);await page.evaluate(()=>document.body.classList.add('reading-large'));
    await use(info.task.id);await read();await page.locator('#choices button').nth(choice==='name'?0:1).click();await read();
   }
   if(info.c===6&&info.i===3&&!replayedHouse){
    const before=await get();await use('hc-scene-2');
    assert.equal(await page.evaluate(()=>Homecoming.view(window.__home.state).index),2,'House replay uses the house, not the later rain scene');
    await page.screenshot({path:`artifacts/homecoming-replay-house-${choice}.png`});await read();assert.deepEqual((await get()).homecoming,before.homecoming);replayedHouse=true;
   }
   if(info.c===7&&info.i===4&&!replayedHospital){
    const before=await get();await use('hc-scene-4');await read();assert.equal(await page.locator('#choices button').count(),2);
    await page.locator('#choices button').first().click();assert.equal(await page.evaluate(()=>Homecoming.view(window.__home.state).index),3);
    await page.screenshot({path:`artifacts/homecoming-replay-hospital-${choice}.png`});await read();assert.deepEqual((await get()).homecoming,before.homecoming);replayedHospital=true;
   }
  }
  const final=await get();assert(final.journey2.eight.ended,'Full route reaches home and Thursday epilogue');assert(final.homecoming.nameRecovered);assert.equal(final.night2.choice,choice,'Final retrieval preserves chapter-2 choice history');assert.equal(final.day4.choice,'table');
  assert.equal(final.homecoming.bread,choice==='name'?'cream':'walnut');
  await page.locator('#credits-button').click();assert((await page.locator('#credits-description').innerText()).includes('아버지'));assert(!(await page.locator('#credits').innerText()).includes('우편'));await page.locator('#close-credits').click();await page.locator('#return').click();
  await page.screenshot({path:`artifacts/homecoming-home-${choice}.png`});
  await page.reload();await page.locator('#app-menu-open').waitFor();await page.locator('#continue').click();assert.deepEqual((await get()).homecoming,final.homecoming);
  await use('hc-scene-6');await read();assert.equal(await page.locator('#choices button').count(),2,'Photos and reply both remain available');
  await page.locator('#choices button').first().click();assert((await page.locator('#location').innerText()).startsWith('19:10'),'Replayed dinner is not labelled Thursday');await read();
  await use('hc-scene-6');await read();await page.locator('#choices button').nth(1).click();const reply=await read();assert(reply.includes('다음에 또 쓸게'));
  const letterRows=book.filter(row=>row.route===choice&&row.chapter===8&&/오늘 바다에 갔어|다음에 또 쓸게|오늘 바다에 다녀온 온이/.test(row.text));
  assert(letterRows.length>=3);assert(letterRows.every(row=>row.speaker.includes('답장')),'Every letter paragraph is labelled as On’s reply');
  assert.deepEqual((await get()).homecoming,final.homecoming,'Replays do not alter completed progress');
  // Exercise the original visible save-slot and journal UI with the finished book.
  await page.locator('#app-menu-open').click();await page.locator('#save-button').click();await page.locator('.slot-action').first().click();
  await page.locator('#app-menu-open').click();await page.locator('#journal-button').click();await page.locator('[data-journal-tab="history"]').click();await page.locator('#book-chapter').selectOption('8');assert((await page.locator('.history-entry').count())>80);await page.locator('#close-journal').click();
  await context.close();console.log('PASS full homecoming route: '+choice);
 }
 // Old later-arc saves retain their exact source, their early choices and a coherent restart point.
 for(const chapter of [4,5,6,7,8]){
  const context=await browser.newContext();const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:source.replace('requestAnimationFrame(frame);window.addEventListener',hook)}));
  await page.goto(base+'/');
  const old={chapter,room:chapter>=6?chapter*2-1:chapter===5?9:6,x:220,y:230,ended:true,choice:'hang',night2:{choice:'letter',ended:true},night3:{choice:'next',ended:true},day4:{ended:true,choice:'shore'},night5:{ended:true},history:[{chapter:2,speaker:'온',text:'옛 편지'},{chapter:6,speaker:'이음',text:'옛 우편 열차'}]};
  await page.evaluate(({old,key})=>localStorage.setItem(key,JSON.stringify(old)),{old,key:saveKey});await page.reload();await page.locator('#continue').click();
  const state=await page.evaluate(()=>window.__home.state);assert.equal(state.chapter,chapter===4?4:5);assert.equal(state.night2.choice,'letter');assert.equal(state.day4.choice,'shore');
  assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key+'-before-homecoming')),saveKey),old,'Original save preserved byte-equivalent in JSON');
  if(chapter>=5){assert.equal(state.room,9);assert.equal(state.homecoming.steps.five,0);assert(!state.history.some(x=>x.chapter>=5));}
  await context.close();
 }
 await writeFile('artifacts/homecoming-layout-audit.json',JSON.stringify(overflow,null,2));
 await writeFile('artifacts/homecoming-playthrough.json',JSON.stringify(book,null,2));
 assert.deepEqual(errors,[],'No browser errors');
 assert.deepEqual(overflow,[],`Text overflow; see artifacts/homecoming-layout-audit.json (${overflow.length})`);
 console.log(`PASS ${checked} dialogue pages at 640×320 / large text; both name routes, cancellation, choices, replay, save restoration, legacy migration and journal.`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
