const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/game.js',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync('game.js','utf8').replace('requestAnimationFrame(frame);window.addEventListener','window.__layout={get state(){return state},interact,speak};requestAnimationFrame(frame);window.addEventListener')}));
 await page.goto(process.env.GAME_URL||'http://localhost:8080/tomorrow-station/');
 await page.locator('#begin').click();
 const initial=await page.evaluate(()=>JSON.stringify(window.__layout.state));
 const results=[];
 for(const size of [{width:2560,height:1440},{width:1440,height:900},{width:1280,height:720},{width:1024,height:768},{width:800,height:650},{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
  await page.setViewportSize(size);await page.waitForTimeout(80);
  const geometry=await page.evaluate(()=>{
   const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
   return {world:box('#game'),labels:box('#world-labels'),rail:box('.side-panel'),guide:box('#guide'),overflow:document.documentElement.scrollWidth>innerWidth,state:JSON.stringify(window.__layout.state)};
  });
  assert(!geometry.overflow,`horizontal overflow ${JSON.stringify(size)}`);
  assert(Math.abs(geometry.world.width/geometry.world.height-5/3)<.01,`stretched canvas ${JSON.stringify(size)}`);
  assert(Math.abs(geometry.world.width-geometry.labels.width)<1&&Math.abs(geometry.world.height-geometry.labels.height)<1,'world labels detached from scenery');
  assert.equal(geometry.state,initial,'resize changed game progress');
  if(size.width>=1100)assert(geometry.rail.x>=geometry.world.right,'wide layout should use side panel');
  if(size.width<700)assert(geometry.rail.y>=geometry.world.bottom,'portrait layout should stack');
  results.push({size,scene:`${geometry.world.width.toFixed(0)}×${geometry.world.height.toFixed(0)}`});
  if(size.width===1440||size.width===390||size.width===844){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`screenshot-responsive-${size.width}.png`});}
 }
 // Long choice dialogue remains usable through a live resize.
 await page.evaluate(()=>window.__layout.speak('역무원 · 여울',['다시 찾아가도 괜찮아요. 오늘 전부 찾지 않아도 되고요.\n편지를 가져가시겠어요?'],null,[{text:'온. 내 이름을 돌려받을래요.',action:()=>{}},{text:'이름은 조금 더 맡길게요. 편지는 가져갈래요.',action:()=>{}}]));
 for(const size of [{width:1440,height:900},{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
  await page.setViewportSize(size);
  const info=await page.evaluate(()=>{const d=document.getElementById('dialogue'),c=document.getElementById('game').getBoundingClientRect(),r=d.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,top:r.top,bottom:c.bottom,line:getComputedStyle(document.getElementById('line')).fontSize,text:document.getElementById('line').textContent};});
  assert(!info.overflow);assert(parseFloat(info.line)>=15);assert(info.text.includes('편지를 가져가시겠어요?'));
  if(size.width<700)assert(info.top>=info.bottom-1,'portrait dialogue should not cover scene');
  await page.locator('#choices button').last().scrollIntoViewIfNeeded();assert(await page.locator('#choices button').last().isVisible());
  if(size.width===390)await page.screenshot({path:'screenshot-responsive-dialogue.png'});
 }
 await page.keyboard.press('Escape');
 for(const size of [{width:320,height:568},{width:844,height:390}]){
  await page.setViewportSize(size);await page.locator('#load-button').click();
  await page.locator('#close-save-menu').scrollIntoViewIfNeeded();await page.locator('#close-save-menu').click();
  assert.equal(await page.locator('#save-menu').isVisible(),false);
 }
 // Touch devices still expose movement controls after rotating to landscape.
 const touch=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
 touch.on('pageerror',e=>errors.push(e.message));await touch.goto(process.env.GAME_URL||'http://localhost:8080/tomorrow-station/');await touch.locator('#begin').click();
 const touchLayout=await touch.evaluate(()=>{const controls=document.querySelector('.mobile-controls'),box=controls.getBoundingClientRect(),rail=document.querySelector('.side-panel').getBoundingClientRect();return {visible:getComputedStyle(controls).display!=='none',x:box.left,y:box.top,railX:rail.left,height:innerHeight};});
 assert(touchLayout.visible&&touchLayout.x>=touchLayout.railX&&touchLayout.y<touchLayout.height);
 await touch.screenshot({path:'screenshot-responsive-touch.png'});await touch.close();
 assert.deepEqual(errors,[]);console.log('PASS: live resize, 8 viewport sizes, scene aspect ratio, label alignment, unchanged progress, readable choice dialogue, scrollable save menu, touch landscape controls.');console.log(results);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
