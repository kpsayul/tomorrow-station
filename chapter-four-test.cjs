// Development check: Playwright is only needed for testing, not playing.
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const SAVE='tomorrow-station-v1';
const legacy={x:240,y:235,room:5,chapter:3,met:true,ticket:true,cat:true,bell:true,choice:'hang',ended:true,night2:{met:true,clues:['rain','whistle','train'],sequence:[],tuned:true,remembered:true,catName:true,answer:'alone',choice:'name',ended:true},night3:{board:true,witnesses:['keeper','machine','cat'],inspector:true,signals:['store','wait','go'],signalDone:true,announced:true,choice:'next',ended:true}};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const variant of [{bell:'hang',name:'name',station:'next',choice:'table',photos:true,title:'식탁에 남겨둔 자리'},{bell:'carry',name:'letter',station:'rest',choice:'shore',photos:false,title:'나란히 걷는 속도'}]){
   const context=await browser.newContext({viewport:{width:1440,height:1000}}),errors=[];
   const seed={...legacy,choice:variant.bell,night2:{...legacy.night2,choice:variant.name},night3:{...legacy.night3,choice:variant.station}};
   await context.addInitScript(({seed,key})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(seed));},{seed,key:SAVE});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/game.js',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync('game.js','utf8').replace('requestAnimationFrame(frame);window.addEventListener','window.__check={get state(){return state},roomEntities,currentTask,closest,allowed,interact,advance,traceLight:fourthDay.traceLight,get dialogue(){return conversation}};requestAnimationFrame(frame);window.addEventListener')}));
   const get=()=>page.evaluate(()=>structuredClone(window.__check.state));
   async function read(){await page.evaluate(()=>{let guard=0;while(window.__check.dialogue&&guard++<40){const d=window.__check.dialogue;if(d.choices&&d.index===d.lines.length-1)break;window.__check.advance();}});}
   async function approach(id){await page.evaluate(id=>{
    const t=window.__check,e=t.roomEntities().find(e=>e.id===id);if(!e)throw new Error('Missing entity '+id);
    const points=[];for(let x=e.x-e.radius;x<=e.x+e.radius;x+=2)for(let y=e.y-e.radius;y<=e.y+e.radius;y+=2){const distance=Math.hypot(x-e.x,y-e.y);if(distance<e.radius&&t.allowed(x,y))points.push({x,y,distance});}
    points.sort((a,b)=>a.distance-b.distance);for(const p of points){t.state.x=p.x;t.state.y=p.y;if(t.closest()?.id===id)return;}
    throw new Error('Cannot approach '+id);
   },id);await page.locator('#game').focus();}
   async function visit(id){await approach(id);await page.keyboard.press('e');await read();}
   async function store(index){await page.locator('#save-button').click();await page.locator('#save-slots .save-slot').nth(index-1).getByRole('button').click();}
   async function load(index){await page.locator('#load-button').click();await page.locator('#save-slots .save-slot').nth(index-1).getByRole('button').click();}
   await page.goto(process.env.GAME_URL||'http://localhost:8080/tomorrow-station/');await page.locator('#continue').click();
   assert.equal(await page.locator('#next-night').textContent(),'바닷가 이야기 시작 →');assert.deepEqual((await get()).day4.mirrors,[0,0,1]);
   await page.locator('#next-night').click();await read();assert.equal((await get()).chapter,4);assert.equal((await get()).room,6);assert.deepEqual((await get()).night3,seed.night3);
   const reachable=await page.evaluate(()=>{const t=window.__check,prev=t.state.room,result=[];for(let room=6;room<=8;room++){t.state.room=room;const q=[[240,250]],seen=new Set(['240,250']);for(let n=0;n<q.length;n++){const [x,y]=q[n];for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2]]){const a=x+dx,b=y+dy,key=a+','+b;if(!seen.has(key)&&t.allowed(a,b)){seen.add(key);q.push([a,b]);}}}for(const e of t.roomEntities())result.push({room,id:e.id,reachable:q.some(([x,y])=>Math.hypot(x-e.x,y-e.y)<e.radius)});}t.state.room=prev;return result;});
   assert(reachable.every(e=>e.reachable),JSON.stringify(reachable));
   assert.equal(await page.evaluate(()=>window.__check.allowed(240,170)),false,'sea should be outside walkable harbor');
   await visit('postbox');assert.equal((await get()).day4.ended,false);await visit('lighthouse-door');assert.equal((await get()).room,6);
   await visit('cafe-door');await visit('cafe-owner');assert.equal((await get()).day4.letter,false);await visit('cafe-back');
   await approach('harbor-notice');await page.keyboard.press('e');await page.keyboard.press('Escape');assert.equal((await get()).day4.notice,false);await visit('harbor-notice');
   if(variant.photos){await visit('photo-sea');await visit('photo-sea');assert.deepEqual((await get()).day4.photos,['sea']);}
   await page.screenshot({path:`screenshot-harbor-${variant.choice}.png`});
   await visit('cafe-door');await visit('cafe-owner');assert((await get()).day4.letter);
   if(variant.photos)await visit('photo-meal');
   await visit('cafe-menu');await visit('cafe-back');await visit('lighthouse-door');assert.equal((await get()).room,8);
   await visit('mirror-0');assert.deepEqual((await get()).day4.mirrors,[0,0,1]);await visit('photo-light');assert(!(await get()).day4.photos.includes('light'));
   await approach('naru');await page.keyboard.press('e');const meeting=await page.evaluate(()=>window.__check.dialogue.lines.join('\n'));
   assert(meeting.includes(variant.bell==='hang'?'네가 돌아올 문':'아직 갖고 있었네'));assert(meeting.includes(variant.name==='name'?'온도 좀 도와줄래':'친구도 좀 도와줄래'));await read();assert((await get()).day4.met);
   // Every mirror combination is traced, including the three different wrong exits.
   const paths=await page.evaluate(()=>{const t=window.__check,original=t.state.day4.mirrors,result=[];for(let n=0;n<8;n++){t.state.day4.mirrors=[(n>>2)&1,(n>>1)&1,n&1];result.push({mirrors:t.state.day4.mirrors,trace:t.traceLight()});}t.state.day4.mirrors=original;return result;});
   assert.deepEqual(paths.filter(p=>p.trace.solved).map(p=>p.mirrors),[[1,1,0]]);assert(paths.every(p=>p.trace.segments.length>0&&p.trace.segments.length<=4));
   await visit('light-console');assert.equal((await get()).day4.lit,false);
   await visit('mirror-0');assert.deepEqual((await get()).day4.mirrors,[1,0,1]);await store(1);
   await page.locator('#load-button').click();assert((await page.locator('#save-slots').textContent()).includes('바닷가 이야기 · 등대 작업실 · 등대 빛길 퍼즐'));await page.keyboard.press('Escape');
   await page.reload();await page.locator('#continue').click();assert.deepEqual((await get()).day4.mirrors,[1,0,1]);
   await visit('mirror-1');await visit('mirror-2');assert(await page.evaluate(()=>window.__check.traceLight().solved));
   await load(1);assert.deepEqual((await get()).day4.mirrors,[1,0,1]);assert.equal(await page.evaluate(()=>window.__check.traceLight().solved),false);
   await visit('mirror-1');await visit('mirror-2');await page.screenshot({path:`screenshot-lighthouse-${variant.choice}.png`});
   await approach('light-console');await page.keyboard.press('e');await page.keyboard.press('Escape');assert.equal((await get()).day4.lit,false);await visit('light-console');assert((await get()).day4.lit);
   const locked=[...(await get()).day4.mirrors];await visit('mirror-0');assert.deepEqual((await get()).day4.mirrors,locked);
   if(variant.photos){await visit('photo-light');assert.equal((await get()).day4.photos.length,3);}
   await page.locator('#journal-button').click();assert((await page.locator('#journal-content').textContent()).includes('첫 거울에서 아래로'));await page.locator('#close-journal').click();
   await store(2);await visit('naru');await page.locator('#choices button').first().click();await page.keyboard.press('Escape');assert.equal((await get()).day4.reunited,false);assert.equal((await get()).day4.choice,null);
   await page.reload();await page.locator('#continue').click();assert.equal((await get()).day4.choice,null);
   await visit('naru');await page.setViewportSize({width:320,height:568});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.getByRole('button',{name:variant.choice==='table'?'식탁에 한 자리 더 만들자.':'둘이 먼저 바다를 걸어봐.',exact:true}).click();await read();assert((await get()).day4.reunited);assert.equal((await get()).day4.choice,variant.choice);
   await page.setViewportSize({width:1440,height:1000});
   if(variant.choice==='table'){await visit('breakfast');await page.screenshot({path:'screenshot-reunion-table.png'});await visit('cafe-back');}else await visit('harbor-keeper');
   await approach('postbox');await page.keyboard.press('e');assert((await page.evaluate(()=>window.__check.dialogue.lines.join('\n'))).includes(variant.station==='next'?'다음역':'쉼표역'));await page.keyboard.press('Escape');assert.equal((await get()).day4.ended,false);
   await visit('postbox');assert((await get()).day4.ended);assert.equal(await page.locator('#end-title').textContent(),variant.title);assert.equal(await page.locator('#end-next-night').isVisible(),true);
   await page.setViewportSize({width:390,height:844});await page.locator('#return').scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:`screenshot-fourth-ending-${variant.choice}.png`});
   await page.locator('#return').click();await store(3);await page.reload();await page.locator('#continue').click();assert((await get()).day4.ended);
   if((await get()).room===6)await visit('cafe-door');
   await approach('cafe-radio');await page.keyboard.press('e');const reply=await page.evaluate(()=>window.__check.dialogue.lines.join('\n'));assert(reply.includes(variant.photos?'세 장을 번갈아':'고양이가 등대보다'));assert(reply.includes(variant.station==='rest'?'쉬어가겠다는 손님':'어디로 가는지 모른다는 손님'));await read();
   await visit('cafe-owner');await visit('cafe-back');await visit('lighthouse-door');await visit('naru');await visit('lighthouse-back');
   await load(2);assert.equal((await get()).day4.reunited,false);assert.equal((await get()).day4.ended,false);await load(3);assert((await get()).day4.ended);
   assert.deepEqual(errors,[]);console.log(`PASS: ${variant.bell}/${variant.name}/${variant.station}/${variant.choice}; legacy save, 3 reachable new rooms, gates, callbacks, all 8 light paths, partial save, manual restore, cancelled choices, optional photos ${variant.photos?'3':'0'}, ending, mobile, radio epilogue, no browser errors.`);
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
