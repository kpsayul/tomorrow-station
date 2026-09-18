const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const SAVE='tomorrow-station-v1';
const legacy={x:348,y:177,room:0,met:true,ticket:true,cat:true,bell:true,choice:'hang',ended:true};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:1280,height:1100}});
 await context.addInitScript(({legacy,key})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(legacy));},{legacy,key:SAVE});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/game.js',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync('game.js','utf8').replace('requestAnimationFrame(frame);window.addEventListener','window.__check={get state(){return state},roomEntities,currentTask,allowed,interact,advance,move,get dialogue(){return conversation}};requestAnimationFrame(frame);window.addEventListener')}));
 const get=()=>page.evaluate(()=>structuredClone(window.__check.state));
 async function read(){await page.evaluate(()=>{let guard=0;while(window.__check.dialogue&&guard++<30){const d=window.__check.dialogue;if(d.choices&&d.index===d.lines.length-1)break;window.__check.advance();}});}
 async function approach(x,y){await page.evaluate(({x,y})=>{window.__check.state.x=x;window.__check.state.y=y;},{x,y});await page.waitForFunction(()=>!document.getElementById('interaction').hidden);}
 async function visit(x,y){await approach(x,y);await page.keyboard.press('e');await read();}
 async function pick(label){await page.getByRole('button',{name:label,exact:true}).click();await read();}
 await page.goto(process.env.GAME_URL || 'http://localhost:8080/tomorrow-station/');await page.locator('#continue').click();
 assert(await page.locator('#next-night').isVisible());assert.equal((await get()).chapter,1);
 await page.locator('#next-night').click();await read();assert.equal((await get()).chapter,2);
 const reachable=await page.evaluate(()=>{const t=window.__check,prev=t.state.room,result=[];for(let room=0;room<4;room++){t.state.room=room;const q=[[240,246]],seen=new Set(['240,246']);for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2]]){const a=x+dx,b=y+dy,key=a+','+b;if(!seen.has(key)&&t.allowed(a,b)){seen.add(key);q.push([a,b]);}}}for(const e of t.roomEntities())result.push({room,id:e.id,ok:q.some(([x,y])=>Math.hypot(x-e.x,y-e.y)<e.radius)});}t.state.room=prev;return result;});
 assert(reachable.every(e=>e.ok),JSON.stringify(reachable));
 await visit(431,224);assert.equal((await get()).room,0); // Locked until dialogue.
 await approach(348,177);await page.keyboard.press('e');assert((await page.locator('#line').textContent()).includes('문 위의 방울'));await read();assert((await get()).night2.met);
 await visit(431,224);assert.equal((await get()).room,2);
 await visit(240,239);assert.equal((await get()).night2.tuned,false);
 await visit(90,174);await visit(214,167);await visit(358,173);assert.equal((await get()).night2.clues.length,3);
 await page.locator('#journal-button').click();assert((await page.locator('#journal-content').textContent()).includes('처음엔 비밖에'));await page.locator('#close-journal').click();
 await page.screenshot({path:'screenshot-archive.png'});
 await visit(240,239);await pick('열차 소리');await pick('빗소리');await pick('휘파람');
 assert.equal((await get()).night2.tuned,false);assert.deepEqual((await get()).night2.sequence,[]);
 await visit(240,239);await pick('빗소리');await page.keyboard.press('Escape');
 await page.reload();await page.locator('#continue').click();assert.deepEqual((await get()).night2.sequence,['rain']);
 await visit(240,239);await pick('휘파람');await pick('열차 소리');assert.equal((await get()).room,3);assert((await get()).night2.tuned);
 await page.screenshot({path:'screenshot-memory.png'});
 await approach(151,195);await page.keyboard.press('e');await page.keyboard.press('Escape');assert.equal((await get()).night2.remembered,false);
 await visit(151,195);await pick('기다리던 사람이 안 와서.');assert((await get()).night2.remembered);
 await visit(240,253);assert.equal((await get()).room,2);
 await visit(240,257);assert.equal((await get()).room,0);
 await visit(240,253);assert.equal((await get()).room,1);
 await visit(348,186);assert((await get()).night2.catName);
 await visit(240,253);await visit(348,177);await pick('온. 내 이름을 돌려받을래요.');
 assert((await get()).night2.ended);assert.equal(await page.locator('#end-title').textContent(),'나를 데리러 온 나');assert.equal(await page.locator('#end-next-night').isVisible(),true);assert.equal(await page.locator('#end-next-night').textContent(),'세 번째 밤 시작 →');
 await page.reload();await page.locator('#continue').click();assert((await get()).night2.ended);
 await visit(348,177);assert.equal(await page.locator('#ending').isVisible(),false);
 await page.evaluate(()=>{window.__check.state.night2.ended=false;});
 await visit(348,177);await pick('이름은 조금 더 맡길게요. 편지는 가져갈래요.');assert.equal(await page.locator('#end-title').textContent(),'빈칸도 내 자리');
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:'screenshot-ending-mobile.png'});await page.locator('#return').click();
 // The other first-night choice changes the new opening dialogue.
 await page.evaluate(()=>{window.__check.state.night2.met=false;window.__check.state.choice='carry';});
 await approach(348,177);await page.keyboard.press('e');assert((await page.locator('#line').textContent()).includes('주머니에서 방울'));await read();
 assert.deepEqual(errors,[]);
 console.log('PASS: old-save migration; all 4 rooms reachable; both first-night callbacks; locked door; clues; wrong puzzle and retry; partial-puzzle reload; memory choice; return route; both second-night endings; ending reload; mobile layout; no browser errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
