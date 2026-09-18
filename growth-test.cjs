const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const site='https://kpsayul.github.io/tomorrow-station/';
const local=process.env.GAME_URL||'http://localhost:8080/tomorrow-station/';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 try{
  async function setup(options={}){
   const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true}),requests=[];
   if(options.optOut)await context.addInitScript(()=>localStorage.setItem('tomorrow-analytics-opt-out','1'));
   if(options.dnt)await context.addInitScript(()=>Object.defineProperty(navigator,'doNotTrack',{value:'1',configurable:true}));
   await context.route('https://www.googletagmanager.com/**',route=>{requests.push(route.request().url());return options.blocked?route.abort():route.fulfill({contentType:'text/javascript',body:'/* controlled test receiver: no real analytics traffic */'});});
   await context.route(site+'**',route=>{
    const url=new URL(route.request().url()),name=url.pathname.replace('/tomorrow-station/','')||'index.html';
    if(name.includes('..'))return route.abort();const filename=path.resolve(name.endsWith('/')?name+'index.html':name);if(!fs.existsSync(filename))return route.fulfill({status:404,body:'Not found'});
    let body=fs.readFileSync(filename);
    if(name==='analytics-config.js'&&options.configured)body=Buffer.from("window.TOMORROW_ANALYTICS={measurementId:'G-TEST123456'};");
    if(name==='game.js')body=Buffer.from(body.toString().replace('requestAnimationFrame(frame);window.addEventListener','window.__growth={get state(){return state},finish,advance,showEnding,get dialogue(){return conversation}};requestAnimationFrame(frame);window.addEventListener'));
    return route.fulfill({contentType:name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.png')?'image/png':'text/html',body});
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(site+(options.query||''));return {page,context,requests};
  }
  const {page,context,requests}=await setup({configured:true,query:'?utm_source=community&utm_medium=referral&utm_campaign=first_journey&private_note=do-not-send#secret'});
  const events=()=>page.evaluate(()=>window.dataLayer.filter(e=>e[0]==='event').map(e=>({name:e[1],...e[2]})));
  assert.equal(requests.length,1);assert.equal((await events()).filter(e=>e.name==='page_view').length,1);
  assert.equal((await events())[0].entry_source,'community');assert(!(await page.evaluate(()=>JSON.stringify(window.dataLayer))).includes('do-not-send'));assert(!(await page.evaluate(()=>JSON.stringify(window.dataLayer))).includes('#secret'));
  await page.locator('#begin').click();assert.equal((await events()).filter(e=>e.name==='game_start').length,1);assert.equal((await events()).filter(e=>e.name==='chapter_start'&&e.chapter===1).length,1);
  await page.evaluate(()=>window.__growth.finish('hang'));await page.keyboard.press('Escape');assert.equal((await events()).filter(e=>e.name==='chapter_complete').length,0);
  await page.evaluate(()=>{window.__growth.finish('hang');while(window.__growth.dialogue)window.__growth.advance();});assert.equal((await events()).filter(e=>e.name==='chapter_complete'&&e.chapter===1).length,1);
  await page.locator('#share-ending').click();assert((await page.locator('#share-message').textContent()).includes('돌아올 자리를 남겼다'));const previous=await page.evaluate(()=>JSON.stringify(window.__growth.state));await page.keyboard.down('ArrowRight');await page.waitForTimeout(180);await page.keyboard.up('ArrowRight');assert.equal(await page.evaluate(()=>JSON.stringify(window.__growth.state)),previous);
  const downloadEvent=page.waitForEvent('download');await page.locator('#download-share-card').click();const png=fs.readFileSync(await (await downloadEvent).path());assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{window.__copied=value;}},configurable:true}));await page.locator('#copy-share-link').click();assert((await page.evaluate(()=>window.__copied)).includes('utm_source=player'));assert((await page.locator('#share-status').textContent()).includes('복사했어요'));
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('Denied');}},configurable:true}));await page.locator('#copy-share-link').click();assert((await page.locator('#share-status').textContent()).includes('자동 복사가 안 되어'));assert.equal(await page.locator('#share-link').evaluate(e=>e.selectionEnd-e.selectionStart),(await page.locator('#share-link').inputValue()).length);
  await page.setViewportSize({width:320,height:568});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#download-share-card').scrollIntoViewIfNeeded();await page.screenshot({path:'screenshot-share-mobile.png'});await page.locator('#close-share').click();
  await page.evaluate(()=>Object.defineProperty(navigator,'share',{value:async()=>{throw new DOMException('Cancelled','AbortError');},configurable:true}));await page.locator('#share-ending').click();const count=(await events()).filter(e=>e.name==='share').length;await page.locator('#native-share').click();assert.equal((await events()).filter(e=>e.name==='share').length,count);await page.keyboard.press('Escape');
  await page.locator('#end-next-night').click();assert.equal((await events()).filter(e=>e.name==='chapter_start'&&e.chapter===2).length,1);await page.keyboard.press('Escape');await page.reload();await page.locator('#continue').click();assert.equal((await events()).filter(e=>e.name==='game_start').length,0);assert.equal((await events()).filter(e=>e.name==='game_resume').length,1);assert.equal((await events()).find(e=>e.name==='page_view').entry_source,'community');
  await context.close();
  for(const options of [{},{configured:true,optOut:true},{configured:true,dnt:true},{configured:true,query:'?preview=1'}]){const item=await setup(options);assert.equal(item.requests.length,0);assert.equal(await item.page.evaluate(()=>window.tomorrowMetrics.enabled),false);await item.page.locator('#begin').click();assert(await item.page.locator('#guide').isVisible());await item.context.close();}
  const blocked=await setup({configured:true,blocked:true});await blocked.page.locator('#begin').click();assert(await blocked.page.locator('#guide').isVisible());await blocked.context.close();
  const p=await browser.newPage({viewport:{width:390,height:844}});p.on('pageerror',e=>errors.push(e.message));await p.goto(local+'promo/');assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.locator('video').evaluate(v=>v.load());await p.waitForFunction(()=>document.querySelector('video').readyState>=1);const metadata=await p.locator('video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight}));assert.equal(metadata.width,720);assert.equal(metadata.height,1280);assert(metadata.duration>=14.5&&metadata.duration<17,JSON.stringify(metadata));await p.locator('video').evaluate(async v=>{v.muted=true;await v.play();});await p.waitForFunction(()=>document.querySelector('video').currentTime>.25);await p.locator('video').evaluate(v=>v.pause());await p.screenshot({path:'screenshot-promo-mobile.png'});
  await p.goto(local+'privacy.html');assert((await p.locator('#analytics-status').textContent()).includes('연결되어 있지 않으며'));await p.locator('#analytics-preference').click();assert.equal(await p.evaluate(()=>localStorage.getItem('tomorrow-analytics-opt-out')),'1');
  const assets=await p.request.get(local+'media/og-cover.png');assert.equal(assets.status(),200);const cover=await assets.body();assert.equal(cover.readUInt32BE(16),1200);assert.equal(cover.readUInt32BE(20),630);
  assert.deepEqual(errors,[]);console.log('PASS: configured/disabled/blocked analytics; source attribution; no query leakage; genuine completion events; milestone dedupe; share PNG and link; clipboard fallback; native cancellation; modal pause; 320px sharing; 720x1280 MP4 playback '+metadata.duration.toFixed(2)+'s; promo page; opt-out.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
