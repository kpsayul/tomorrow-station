const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const SAVE='tomorrow-station-v1';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:1280,height:1100}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/game.js',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync('game.js','utf8').replace('requestAnimationFrame(frame);window.addEventListener','window.__check={get state(){return state},frame,keys,allowed,move,objective,begin};requestAnimationFrame(frame);window.addEventListener')}));
 await page.goto(process.env.GAME_URL||'http://localhost:8080/tomorrow-station/');
 await page.locator('#load-button').click();
 assert.equal(await page.locator('#save-slots button:disabled').count(),4);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#save-menu').isVisible(),false);
 await page.locator('#begin').click();
 const snapshot=()=>page.evaluate(()=>structuredClone(window.__check.state));
 const position=()=>page.evaluate(()=>({x:window.__check.state.x,y:window.__check.state.y}));
 const resetPosition=()=>page.evaluate(()=>{window.__check.state.x=180;window.__check.state.y=243;});
 async function distance(shift=false){await resetPosition();await page.locator('#game').focus();if(shift)await page.keyboard.down('Shift');await page.keyboard.down('ArrowRight');await page.waitForTimeout(450);await page.keyboard.up('ArrowRight');if(shift)await page.keyboard.up('Shift');return (await position()).x-180;}
 const walk=await distance(),sprint=await distance(true);
 assert(walk>25&&walk<65,`walk ${walk}`);assert(sprint>walk*1.5,`walk=${walk}, run=${sprint}`);
 await page.locator('#run-toggle').click();assert.equal(await page.locator('#run-toggle').getAttribute('aria-pressed'),'true');
 const toggled=await distance();assert(toggled>walk*1.5);
 // Running remains constrained by the world and furniture.
 await page.evaluate(()=>{window.__check.state.x=300;window.__check.state.y=229;});
 await page.keyboard.down('ArrowUp');await page.waitForTimeout(350);await page.keyboard.up('ArrowUp');
 assert(await page.evaluate(()=>window.__check.allowed(window.__check.state.x,window.__check.state.y)));
 await page.locator('#run-toggle').click();
 // Save before the very first conversation: this also exercises fresh saves.
 await resetPosition();const first=await snapshot();await page.locator('#save-button').click();
 const paused=await position();await page.keyboard.down('ArrowRight');await page.waitForTimeout(160);await page.keyboard.up('ArrowRight');assert.deepEqual(await position(),paused);
 await page.locator('#save-slots .save-slot').nth(0).getByRole('button').click();
 assert.equal(await page.locator('#save-menu').isVisible(),false);
 const slot1=await page.evaluate(key=>localStorage.getItem(key),`${SAVE}-slot-1`);assert(slot1);
 // A later automatic save must not overwrite manual slot 1.
 await page.evaluate(()=>{window.__check.state.met=true;window.__check.state.ticket=true;window.__check.move(1,240,235);});
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),`${SAVE}-slot-1`),slot1);
 await page.locator('#save-button').click();await page.locator('#save-slots .save-slot').nth(1).getByRole('button').click();
 const second=await snapshot();
 await page.locator('#load-button').click();await page.locator('#save-slots .save-slot').nth(0).getByRole('button').click();
 assert.equal((await snapshot()).met,false);assert.deepEqual(await position(),{x:first.x,y:first.y});
 // Slots survive a full page reload and can be loaded from the title screen.
 await page.reload();assert(await page.locator('#continue').isVisible());await page.locator('#load-button').click();
 await page.locator('#save-slots .save-slot').nth(1).getByRole('button').click();assert.equal((await snapshot()).room,second.room);assert((await snapshot()).ticket);
 // Save and restore a partially solved second-night puzzle.
 await page.evaluate(()=>{const s=window.__check.state;s.chapter=2;s.ended=true;s.night2.met=true;s.night2.clues=['rain','whistle','train'];s.night2.sequence=['rain'];window.__check.move(2,240,241);});
 await page.locator('#save-button').click();await page.locator('#save-slots .save-slot').nth(2).getByRole('button').click();
 await page.evaluate(()=>{const s=window.__check.state;s.night2.sequence=['rain','whistle'];s.night2.tuned=true;window.__check.move(3,240,237);});
 await page.locator('#load-button').click();await page.locator('#save-slots .save-slot').nth(2).getByRole('button').click();
 assert.equal((await snapshot()).room,2);assert.deepEqual((await snapshot()).night2.sequence,['rain']);assert.equal((await snapshot()).night2.tuned,false);
 // Updating one slot leaves the other two intact.
 const slot2=await page.evaluate(key=>localStorage.getItem(key),`${SAVE}-slot-2`);
 await page.locator('#save-button').click();assert.equal(await page.locator('#save-slots .save-slot').first().getByRole('button').textContent(),'덮어쓰기');
 await page.locator('#save-slots .save-slot').first().getByRole('button').click();assert.equal(await page.evaluate(key=>localStorage.getItem(key),`${SAVE}-slot-2`),slot2);
 await page.setViewportSize({width:390,height:844});await page.locator('#load-button').click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:'screenshot-save-mobile.png'});await page.locator('#close-save-menu').click();
 // Replaying revised chapters preserves the complete previous journey and manual slots.
 const priorReplay=await snapshot(),manualBeforeReplay=await page.evaluate(key=>localStorage.getItem(key),SAVE+'-slot-3');
 await page.reload();await page.locator('#begin').click();assert.equal((await snapshot()).chapter,1);assert.equal((await snapshot()).met,false);
 assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).chapter,SAVE),1);
 await page.reload();await page.locator('#load-button').click();
 await page.locator('.save-slot').filter({hasText:'처음부터 시작하기 전 진행'}).getByRole('button').click();
 const restored=await snapshot();delete restored.savedAt;delete priorReplay.savedAt;assert.deepEqual(restored,priorReplay);
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),SAVE+'-slot-3'),manualBeforeReplay);
 const beforeRefusedRestart=await snapshot();
 await page.evaluate(()=>{const write=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.endsWith('-before-restart'))throw new DOMException('Full','QuotaExceededError');return write.call(this,key,value);};window.__check.begin(false);Storage.prototype.setItem=write;});
 assert.deepEqual(await snapshot(),beforeRefusedRestart);assert((await page.locator('#save-status').textContent()).includes('이전 진행을 보관하지 못했어요'));
 // Malformed data is handled without changing the current session.
 await page.evaluate(key=>localStorage.setItem(key,'{broken'),`${SAVE}-slot-2`);
 const before=await snapshot();await page.locator('#load-button').click();assert(await page.locator('#save-slots .save-slot').nth(1).getByRole('button').isDisabled());await page.keyboard.press('Escape');assert.deepEqual(await snapshot(),before);
 // A rejected write reports failure and keeps existing manual data intact.
 await page.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};});
 await page.locator('#save-button').click();await page.locator('#save-slots .save-slot').first().getByRole('button').click();assert((await page.locator('#save-menu-description').textContent()).includes('저장하지 못했어요'));
 await page.evaluate(()=>Storage.prototype.setItem=window.originalSetItem);
 assert.deepEqual(errors,[]);
 console.log(`PASS: walk ${walk.toFixed(1)}, Shift run ${sprint.toFixed(1)}, toggle run ${toggled.toFixed(1)}; collisions; paused menus; 3 manual slots; independent autosave; title-screen loading; puzzle restoration; overwrite isolation; invalid data; write failure; mobile layout.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
