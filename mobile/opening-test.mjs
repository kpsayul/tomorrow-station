import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

// Run after mobile:build; keep this test read-only while layout tests are active.
const root=resolve('dist-mobile');
const server=createServer(async(request,response)=>{
  const pathname=new URL(request.url,'http://localhost').pathname;
  const file=resolve(root,pathname==='/'?'index.html':'.'+pathname);
  if(!file.startsWith(root+sep)){response.writeHead(403).end();return;}
  try{response.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');response.end(await readFile(file));}
  catch{response.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({channel:'msedge',headless:true});
const source=(await readFile('game.js','utf8')).replace('requestAnimationFrame(frame);window.addEventListener','window.__opening={get state(){return state},get dialogue(){return conversation},move,interact,advance,normaliseSave,roomEntities,currentTask,allowed};requestAnimationFrame(frame);window.addEventListener');
try{
  for(const choice of ['ask','pretend'])for(const ending of ['carry','hang']){
    const page=await browser.newPage({viewport:{width:640,height:320},hasTouch:true});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/game.js',route=>route.fulfill({contentType:'text/javascript',body:source}));
    const state=()=>page.evaluate(()=>structuredClone(window.__opening.state));
    const visit=(room,x,y)=>page.evaluate(({room,x,y})=>{const t=window.__opening;t.move(room,x,y);t.interact();},{room,x,y});
    const read=()=>page.evaluate(()=>{
      const t=window.__opening,lines=[];
      for(let i=0;i<60&&t.dialogue;i++){
        const d=t.dialogue,p=d.pages[d.index];lines.push(p.text);
        const line=document.getElementById('line');
        if(line.scrollHeight>line.clientHeight+1)throw Error('Small-screen large-type overflow: '+p.text);
        if(new Set((p.turns||[]).filter(t=>!t.narration).map(t=>t.speaker)).size>1)throw Error('Mixed speakers');
        if(d.choices&&d.index===d.pages.length-1)return lines.join('\n');
        t.advance();
      }
      if(t.dialogue)throw Error('Unbounded dialogue');return lines.join('\n');
    });
    await page.goto(url);await page.locator('#app-menu-open').waitFor();await page.locator('#begin').click();
    await page.locator('#app-text-size').click();
    assert.equal((await state()).room,1);
    assert((await page.locator('#line').textContent()).includes('밀어 넣었다'));
    assert.equal(await page.evaluate(()=>window.__opening.dialogue.pages.length),2);
    assert(await page.evaluate(()=>window.__opening.allowed(window.__opening.state.x,window.__opening.state.y)));
    await read();
    const choose=()=>page.locator('#choices button').nth(choice==='ask'?0:1).click();
    await choose();await page.keyboard.press('Escape');
    assert.equal((await state()).openingChoice,null);assert.equal((await state()).met,false);
    await page.reload();await page.locator('#app-menu-open').waitFor();await page.locator('#continue').click();
    assert(await page.locator('#dialogue').isVisible(),'An unfinished opening is recoverable after reload');
    await read();await choose();await read();
    assert.equal((await state()).openingChoice,choice);assert((await state()).met);
    assert.equal(await page.evaluate(()=>window.__opening.currentTask().id),'bench');
    assert.equal(await page.evaluate(()=>window.__opening.roomEntities().some(e=>e.id==='keeper')),false,'Yeoul has returned to the lobby');
    await page.reload();await page.locator('#app-menu-open').waitFor();await page.locator('#continue').click();
    assert(!(await page.locator('#dialogue').isVisible()),'Completed opening is not replayed');
    assert.equal((await state()).openingChoice,choice);
    await visit(1,123,210);await page.keyboard.press('Escape');
    assert.equal((await state()).bell,false);assert.equal((await state()).ticket,false);
    await visit(1,123,210);const memory=await read();assert(memory.includes('인수자: 여울'));assert(memory.includes('감자'));
    assert((await state()).bell&&(await state()).ticket);assert.equal((await state()).cat,false);
    assert.equal(await page.evaluate(()=>window.__opening.currentTask().id),'return');
    await visit(0,348,177);const confession=await read();
    assert(confession.includes(choice==='ask'?'숨긴 걸 바로 물으셨죠':'못 본 척해주셨죠'));
    assert(confession.includes('마지막 분실물'));assert(confession.includes('역을 닫아야'));
    await page.locator('#choices button').nth(ending==='carry'?0:1).click();await read();
    assert((await state()).ended);assert.equal((await state()).choice,ending);
    assert((await page.locator('#end-text').textContent()).includes('이름은 돌려주지 마세요'));
    await page.reload();await page.locator('#app-menu-open').waitFor();await page.locator('#continue').click();
    assert.equal((await state()).openingChoice,choice);assert.equal((await state()).choice,ending);
    await visit(0,91,167);await read();
    await visit(1,348,186);await read();
    await visit(1,123,210);assert((await read()).includes('바다 보이는 집'),'The longer departure memory remains available on revisiting the bench');
    // The first decision also returns when Yeoul finally boards in chapter 3.
    await page.evaluate(()=>{const s=window.__opening.state;s.chapter=3;s.night3.announced=true;s.night3.ended=false;});
    await visit(1,240,190);const boarding=await read();
    assert(boarding.includes(choice==='ask'?'그날 바로 물어봐 주셔서':'오늘은 먼저 보여드릴게요'));
    assert.equal((await state()).room,5);assert((await state()).night3.ended);
    assert.deepEqual(errors,[]);await page.close();
    console.log(`PASS: ${choice}/${ending}; immediate choice; cancel/reload; direct bell discovery; two branch callbacks; first-night and boarding outcomes.`);
  }
  const page=await browser.newPage();
  await page.route('**/game.js',route=>route.fulfill({contentType:'text/javascript',body:source}));
  await page.goto(url);
  const migration=await page.evaluate(()=>{
    const base={x:91,y:167,room:0,met:true,firstQuestion:'name',ticket:true,cat:false,bell:false};
    const old=window.__opening.normaliseSave(base);
    const invalid=window.__opening.normaliseSave({...base,opening:'unknown',openingChoice:'ask'});
    return{old,invalid};
  });
  assert.equal(migration.old.opening,null);assert.equal(migration.old.openingChoice,null);
  assert.equal(migration.old.firstQuestion,'name');assert(migration.old.ticket);
  assert.equal(migration.invalid.opening,null);assert.equal(migration.invalid.openingChoice,null);
  await page.evaluate(s=>localStorage.setItem('tomorrow-station-v1',JSON.stringify(s)),migration.old);
  await page.reload();await page.locator('#continue').click();
  assert(!(await page.locator('#dialogue').isVisible()),'An old save never receives the new opening midway');
  assert.equal(await page.evaluate(()=>window.__opening.currentTask().id),'door');
  await page.close();console.log('PASS: legacy progress and first-question values preserved; invalid opening flags rejected.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
