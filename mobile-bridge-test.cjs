const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
(async()=>{
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve('.',pathname==='/'?'index.html':'.'+pathname);
  if(!file.startsWith(path.resolve('.')+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.exportResult=true;window.tomorrowNative={saveFile:async(blob,filename)=>{window.lastExport={filename,type:blob.type,size:blob.size,text:blob.type==='application/json'?await blob.text():null};if(window.exportResult==='error')throw Error('Disk unavailable');return window.exportResult;},copy:async text=>{window.copied=text;},share:async data=>{window.shared=data;}};});
  await page.route('**/game.js',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync('game.js','utf8').replace('requestAnimationFrame(frame);window.addEventListener','window.__check={get state(){return state},speak,get dialogue(){return conversation}};requestAnimationFrame(frame);window.addEventListener')}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.locator('#begin').click();
  await page.locator('#save-button').click();await page.locator('#export-save').click();
  await page.waitForFunction(()=>document.getElementById('import-status').textContent.includes('선택한 위치'));
  const exported=await page.evaluate(()=>window.lastExport);assert.equal(exported.type,'application/json');assert.equal(JSON.parse(exported.text).state.chapter,1);
  for(const [result,message] of [[false,'취소'],['error','내보내지 못']]){
   await page.evaluate(value=>window.exportResult=value,result);await page.locator('#export-save').click();
   await page.waitForFunction(message=>document.getElementById('import-status').textContent.includes(message),message);assert(await page.locator('#export-save').isEnabled());
  }
  assert.equal(await page.evaluate(()=>window.dispatchEvent(new Event('tomorrow-back',{cancelable:true}))),false);assert(!(await page.locator('#save-menu').isVisible()));
  await page.evaluate(()=>window.__check.speak('여울',['여울: 잠깐.\n당신: 네?'],()=>{window.badCompletion=true;}));
  assert.equal(await page.evaluate(()=>window.dispatchEvent(new Event('tomorrow-back',{cancelable:true}))),false);assert.equal(await page.evaluate(()=>window.badCompletion),undefined);
  await page.evaluate(()=>{window.__check.state.firstQuestion='name';window.dispatchEvent(new CustomEvent('tomorrow-app-state',{detail:{isActive:false}}));});
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('tomorrow-station-v1')).firstQuestion),'name');
  await page.evaluate(()=>window.exportResult=true);await page.locator('#share-game').click();await page.locator('#copy-share-link').click();assert((await page.evaluate(()=>window.copied)).startsWith('https://kpsayul.github.io/'));
  await page.locator('#native-share').click();assert.equal((await page.evaluate(()=>window.shared)).title,'내일 분실물 보관소');
  await page.locator('#download-share-card').click();await page.waitForFunction(()=>document.getElementById('share-status').textContent.includes('선택한 위치'));
  assert.equal((await page.evaluate(()=>window.lastExport)).type,'image/png');assert((await page.evaluate(()=>window.lastExport.size))>1000);
  assert.deepEqual(errors,[]);console.log('PASS: native export success/cancel/error, valid JSON and PNG, clipboard/share adapters, Android back closes menus/dialogue without completing it, background save.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
