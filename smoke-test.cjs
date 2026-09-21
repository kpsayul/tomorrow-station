// Development smoke check: requires Playwright (not needed to play).
const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/game.js',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync('game.js','utf8').replace("requestAnimationFrame(frame);window.addEventListener", "window.__check={get state(){return state},entities,allowed,interact,advance,get dialogue(){return conversation}};requestAnimationFrame(frame);window.addEventListener")}));
 await page.goto(process.env.GAME_URL || 'http://localhost:8080/tomorrow-station/');
 await page.locator('#begin').click();
 // Check all interactable objects can be reached from the starting position.
 const reachable=await page.evaluate(()=>{const t=window.__check,result=[];for(let room=0;room<2;room++){t.state.room=room;const queue=[[240,230]],seen=new Set(['240,230']);for(let n=0;n<queue.length;n++){const [x,y]=queue[n];for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2]]){const a=x+dx,b=y+dy,k=a+','+b;if(!seen.has(k)&&t.allowed(a,b)){seen.add(k);queue.push([a,b]);}}}for(const e of t.entities[room])result.push({id:e.id,reachable:queue.some(([x,y])=>Math.hypot(x-e.x,y-e.y)<e.radius)});}t.state.room=0;return result;});
 assert(reachable.every(e=>e.reachable),JSON.stringify(reachable));
 async function visit(id,x,y){await page.evaluate(({x,y})=>{window.__check.state.x=x;window.__check.state.y=y;window.__check.interact();},{x,y});}
 async function read(){await page.evaluate(()=>{let guard=0;while(window.__check.dialogue&&guard++<60){const d=window.__check.dialogue;if(d.choices&&d.index===d.lines.length-1)break;window.__check.advance();}});}
 await visit('keeper',348,177);await read();await page.getByRole('button',{name:'방금 “이번에도”라고 했죠?',exact:true}).click();await read();assert(await page.evaluate(()=>window.__check.state.met));
 await visit('machine',91,167);await read();assert(await page.evaluate(()=>window.__check.state.ticket));
 await visit('door',240,253);assert.equal(await page.evaluate(()=>window.__check.state.room),1);
 await visit('cat',348,186);await read();assert(await page.evaluate(()=>window.__check.state.cat));
 await visit('bench',123,205);await read();assert(await page.evaluate(()=>window.__check.state.bell));
 await visit('return',240,253);await visit('keeper',348,177);
 await read();
 await page.locator('#choices button').first().click();await read();
 assert(await page.locator('#ending').isVisible());assert.equal(await page.locator('#end-title').textContent(),'기다림을 데리고');
 await page.reload();await page.locator('#continue').click();assert(await page.evaluate(()=>window.__check.state.ended));
 await page.locator('#journal-button').click();assert(await page.locator('#journal').isVisible());await page.locator('#close-journal').click();
 await page.screenshot({path:'screenshot-desktop.png'});
 // Run the other ending from the same collected-item state.
 await page.evaluate(()=>{window.__check.state.ended=false;});
 await visit('keeper',348,177);await read();
 await page.locator('#choices button').nth(1).click();await read();assert.equal(await page.locator('#end-title').textContent(),'돌아올 자리');
 await page.locator('#return').click();await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
 await page.screenshot({path:'screenshot-mobile.png'});
 await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');
 assert.deepEqual(errors,[]);console.log('PASS: reachable objects, quest progression, both endings, save/load, journal, mobile layout, audio; no browser errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
