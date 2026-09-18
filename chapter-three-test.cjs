// Development check: requires Playwright; game itself has no dependencies.
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const SAVE='tomorrow-station-v1';
const legacy={x:348,y:177,room:0,chapter:2,met:true,ticket:true,cat:true,bell:true,choice:'hang',ended:true,night2:{met:true,clues:['rain','whistle','train'],sequence:[],tuned:true,remembered:true,catName:true,answer:'alone',choice:'name',ended:true}};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const variant of [{bell:'hang',name:'name',broadcast:'next',title:'다음은 같이'},{bell:'carry',name:'letter',broadcast:'rest',title:'쉬어가도, 떠나도'}]){
   const context=await browser.newContext({viewport:{width:1440,height:1000}});
   const seed={...legacy,choice:variant.bell,night2:{...legacy.night2,choice:variant.name}};
   await context.addInitScript(({seed,key})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(seed));},{seed,key:SAVE});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/game.js',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync('game.js','utf8').replace('requestAnimationFrame(frame);window.addEventListener','window.__check={get state(){return state},roomEntities,currentTask,closest,allowed,interact,advance,get dialogue(){return conversation}};requestAnimationFrame(frame);window.addEventListener')}));
   const get=()=>page.evaluate(()=>structuredClone(window.__check.state));
   async function read(){await page.evaluate(()=>{let guard=0;while(window.__check.dialogue&&guard++<40){const d=window.__check.dialogue;if(d.choices&&d.index===d.lines.length-1)break;window.__check.advance();}});}
   async function approach(id){
    await page.evaluate(id=>{
     const t=window.__check,e=t.roomEntities().find(e=>e.id===id);if(!e)throw new Error('Missing entity '+id);
     const candidates=[];for(let x=e.x-e.radius;x<=e.x+e.radius;x+=2)for(let y=e.y-e.radius;y<=e.y+e.radius;y+=2){const distance=Math.hypot(e.x-x,e.y-y);if(distance<e.radius&&t.allowed(x,y))candidates.push({x,y,distance});}
     candidates.sort((a,b)=>a.distance-b.distance);
     for(const c of candidates){t.state.x=c.x;t.state.y=c.y;if(t.closest()?.id===id)return;}
     throw new Error('Unreachable entity '+id);
    },id);await page.locator('#game').focus();
   }
   async function visit(id){await approach(id);await page.keyboard.press('e');await read();}
   async function pick(label){await page.getByRole('button',{name:label,exact:true}).click();await read();}
   async function store(index){await page.locator('#save-button').click();await page.locator('#save-slots .save-slot').nth(index-1).getByRole('button').click();}
   async function load(index){await page.locator('#load-button').click();await page.locator('#save-slots .save-slot').nth(index-1).getByRole('button').click();}
   await page.goto(process.env.GAME_URL||'http://localhost:8080/tomorrow-station/');await page.locator('#continue').click();
   assert.equal(await page.locator('#next-night').textContent(),'세 번째 밤 시작 →');
   assert.deepEqual((await get()).night3.signals,[null,null,null]);
   await page.locator('#next-night').click();await read();assert.equal((await get()).chapter,3);assert.deepEqual((await get()).night2,seed.night2);
   await visit('keeper');assert.deepEqual((await get()).night3.witnesses,[]); // Board gate.
   await visit('door');await visit('roof-door');assert.equal((await get()).room,1);await visit('return');
   await approach('board');await page.keyboard.press('e');await page.keyboard.press('Escape');assert.equal((await get()).night3.board,false);
   await visit('board');assert((await get()).night3.board);
   await visit('machine');await visit('door');
   await approach('cat');await page.keyboard.press('e');assert((await page.locator('#line').textContent()).startsWith(variant.name==='name'?'온.':'친구.'));await read();
   await visit('return');await approach('keeper');await page.keyboard.press('e');assert((await page.locator('#line').textContent()).includes(variant.bell==='hang'?'문 위의 방울':'주머니 속 방울'));await read();
   assert.deepEqual((await get()).night3.witnesses,['machine','cat','keeper']);
   await visit('keeper');assert.equal((await get()).night3.witnesses.length,3);
   await visit('door');await visit('roof-door');assert.equal((await get()).room,4);
   await visit('signal-0');assert.deepEqual((await get()).night3.signals,[null,null,null]);
   await visit('inspector');await pick(variant.broadcast==='next'?'떠나면, 여기 있던 일도 없어지나요?':'아직 떠나고 싶지 않은 사람은요?');assert((await get()).night3.inspector);
   await page.locator('#journal-button').click();assert((await page.locator('#journal-content').textContent()).includes('어제 → 보관선'));await page.locator('#close-journal').click();
   await visit('signal-0');await pick('보관선');await store(1);
   await page.locator('#load-button').click();assert((await page.locator('#save-slots').textContent()).includes('세 번째 밤 · 신호실 · 신호 연결 1 / 3'));await page.keyboard.press('Escape');
   await page.reload();await page.locator('#continue').click();assert.deepEqual((await get()).night3.signals,['store',null,null]);
   await visit('signal-1');await pick('출발선');await visit('signal-2');await pick('출발선');
   await approach('console');await page.keyboard.press('e');await page.locator('#next').click();assert((await page.locator('#line').textContent()).includes('아직」: 대기선'));await read();assert.equal((await get()).night3.signalDone,false);
   assert.deepEqual((await get()).night3.signals,['store','go','go']);
   await visit('signal-1');await pick('대기선');await visit('console');assert((await get()).night3.signalDone);
   await page.screenshot({path:`screenshot-signals-${variant.broadcast}.png`});
   await store(2);
   // Cancelled broadcasts must not commit a branch, including across reload.
   await visit('console');await page.locator('#choices button').first().click();await page.keyboard.press('Escape');
   assert.equal((await get()).night3.announced,false);assert.equal((await get()).night3.choice,null);
   await load(1);assert.deepEqual((await get()).night3.signals,['store',null,null]);assert.equal((await get()).night3.signalDone,false);
   await load(2);assert((await get()).night3.signalDone);await visit('console');await pick(variant.broadcast==='next'?'다음역 — 같이 다음으로 가는 곳.':'쉼표역 — 쉬었다 다시 가도 되는 곳.');
   assert.equal((await get()).night3.choice,variant.broadcast);assert((await get()).night3.announced);
   await visit('roof-back');assert.equal((await get()).room,1);
   await page.screenshot({path:`screenshot-first-train-${variant.broadcast}.png`});
   // All objects, including the train door and both new rooms, have a path from the entrance.
   const reachable=await page.evaluate(()=>{const t=window.__check,prev=t.state.room,result=[];for(let room=0;room<6;room++){t.state.room=room;const q=[[240,246]],seen=new Set(['240,246']);for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2]]){const a=x+dx,b=y+dy,key=a+','+b;if(!seen.has(key)&&t.allowed(a,b)){seen.add(key);q.push([a,b]);}}}for(const e of t.roomEntities())result.push({room,id:e.id,ok:q.some(([x,y])=>Math.hypot(x-e.x,y-e.y)<e.radius)});}t.state.room=prev;return result;});
   assert(reachable.every(e=>e.ok),JSON.stringify(reachable));
   await visit('train-door');assert((await get()).night3.ended);assert.equal((await get()).room,5);assert.equal(await page.locator('#end-title').textContent(),variant.title);assert.equal(await page.locator('#end-next-night').isVisible(),true);assert.equal(await page.locator('#end-next-night').textContent(),'바닷가 이야기 시작 →');
   await page.setViewportSize({width:390,height:844});await page.locator('#return').scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:`screenshot-third-ending-${variant.broadcast}.png`});
   await page.locator('#return').click();await visit('rider-keeper');await visit('rider-cat');await visit('postcard');await visit('sea-window');
   await page.screenshot({path:`screenshot-carriage-mobile-${variant.broadcast}.png`});
   await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:`screenshot-carriage-${variant.broadcast}.png`});
   await store(3);await page.reload();await page.locator('#continue').click();assert.equal((await get()).room,5);assert((await get()).night3.ended);
   await visit('ride-back');assert.equal((await get()).room,0);await approach('keeper');await page.keyboard.press('e');assert.equal(await page.locator('#speaker').textContent(),'여울이 남긴 쪽지');await read();await visit('machine');await visit('archive-door');assert.equal((await get()).room,2);
   await visit('ledger');await visit('recorder');assert.equal((await get()).room,3);await visit('child');await visit('memory-back');await visit('archive-back');
   await visit('door');await approach('cat');await page.keyboard.press('e');assert.equal(await page.locator('#speaker').textContent(),'후추의 자리');await read();await visit('train-door');assert.equal((await get()).room,5);assert.equal(await page.locator('#ending').isVisible(),false);
   assert.deepEqual(errors,[]);console.log(`PASS: ${variant.bell}/${variant.name}/${variant.broadcast}; legacy save, callbacks, dialogue cancellation, gates, signal retry, manual and auto saves, all six rooms reachable, ending, mobile, epilogue and revisit, no browser errors.`);
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
