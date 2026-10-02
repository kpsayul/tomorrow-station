import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import './build.mjs';

const root=resolve('dist-mobile');
const server=createServer(async(request,response)=>{
  const pathname=new URL(request.url,'http://localhost').pathname;
  const file=resolve(root,pathname==='/'?'index.html':'.'+pathname);
  if(!file.startsWith(root+sep)){response.writeHead(403).end();return;}
  try{response.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');response.end(await readFile(file));}
  catch{response.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:'msedge',headless:true});
const source=(await readFile('game.js','utf8')).replace('requestAnimationFrame(frame);window.addEventListener',`
  let testClock=1000;
  window.__walk={
    get state(){return state},get dialogue(){return conversation},keys,move,speak,closeDialogue,restore,advance,begin,
    prepare(chapter,room,unlocked=true){
      state=fresh();state.chapter=chapter;active=true;clearInput();closeDialogue();$('start').hidden=true;$('ending').hidden=true;
      state.night2.met=unlocked;state.night3.witnesses=unlocked?['keeper','machine','cat']:[];
      state.night3.announced=unlocked;state.night3.ended=unlocked;state.day4.letter=unlocked;state.night5.met=unlocked;state.homecoming.steps.eight=unlocked?4:0;
      move(room,240,230);
    },
    approach(id){
      const e=roomEntities().find(e=>e.id===id);if(!e)throw Error('Missing '+id);
      const side=e.x>370,up=id==='train-door';
      move(state.room,side?e.x-30:e.x,side?e.y:e.y+(up?24:-22));
      return side?'ArrowRight':up?'ArrowUp':'ArrowDown';
    },
    tick(count=1){for(let i=0;i<count;i++){testClock+=1000/60;frame(testClock);}}
  };window.addEventListener`).replaceAll('requestAnimationFrame(frame);','');
const routes=[
  [1,0,'door',1],[1,1,'return',0],
  [2,0,'door',1],[2,1,'return',0],[2,0,'archive-door',2],[2,2,'archive-back',0],[2,3,'memory-back',2],
  [3,0,'door',1],[3,1,'return',0],[3,0,'archive-door',2],[3,2,'archive-back',0],[3,3,'memory-back',2],
  [3,1,'roof-door',4],[3,4,'roof-back',1],[3,1,'train-door',5],[3,5,'ride-back',0],
  [4,6,'cafe-door',7],[4,7,'cafe-back',6],[4,6,'lighthouse-door',8],[4,8,'lighthouse-back',6],
  [5,9,'hc-record-door',10],[5,10,'hc-lobby-door',9],
  [6,11,'hc-child-door',12],[6,12,'hc-festival-door',11],[6,11,'hc-record-door',10],[6,12,'hc-record-door',10],
  [7,10,'hc-care-door',13],[7,13,'hc-hospital-door',14],[7,14,'hc-waiting-door',13],[7,13,'hc-record-door',10],[7,14,'hc-record-door',10],
  [8,15,'hc-house-door',16],[8,16,'hc-dorim-door',15]
];
try{
  const page=await browser.newPage({viewport:{width:800,height:400},hasTouch:true});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/game.js',route=>route.fulfill({contentType:'text/javascript',body:source}));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.locator('#app-menu-open').waitFor();
  const tick=count=>page.evaluate(count=>window.__walk.tick(count),count);
  const room=()=>page.evaluate(()=>window.__walk.state.room);
  for(const [chapter,from,id,to] of routes){
    const key=await page.evaluate(({chapter,from,id})=>{window.__walk.prepare(chapter,from);return window.__walk.approach(id);},{chapter,from,id});
    await page.keyboard.down(key);await tick(30);
    assert.equal(await room(),to,`Chapter ${chapter}: walk through ${id} without pressing interact`);
    const arrived=await page.evaluate(()=>({x:window.__walk.state.x,y:window.__walk.state.y}));
    // A held key generates repeated keydown events on real keyboards.
    await page.evaluate(key=>window.dispatchEvent(new KeyboardEvent('keydown',{key,repeat:true})),key);await tick(90);
    assert.equal(await room(),to,'Held input cannot bounce straight back');
    assert.deepEqual(await page.evaluate(()=>({x:window.__walk.state.x,y:window.__walk.state.y})),arrived,'Arrival stops movement');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('tomorrow-station-v1')).room),to,'Arrival autosaves');
    await page.keyboard.up(key);
  }
  for(const [chapter,from,id] of [[2,0,'archive-door'],[3,1,'roof-door'],[4,6,'lighthouse-door'],[8,15,'hc-house-door']]){
    const key=await page.evaluate(({chapter,from,id})=>{window.__walk.prepare(chapter,from,false);return window.__walk.approach(id);},{chapter,from,id});
    await page.keyboard.down(key);await tick(30);await page.keyboard.up(key);
    assert.equal(await room(),from,'Story lock remains enforced');
    assert(await page.locator('#dialogue').isVisible(),'Locked passage explains the missing condition');
    await page.evaluate(()=>window.__walk.closeDialogue());
    await page.keyboard.down(key);await tick(6);await page.keyboard.up(key);
    assert(!(await page.locator('#dialogue').isVisible()),'Staying inside a locked doorway does not reopen its dialogue');
    await page.keyboard.down('ArrowLeft');await tick(25);await page.keyboard.up('ArrowLeft');
    await page.keyboard.down('ArrowRight');await tick(30);await page.keyboard.up('ArrowRight');
    assert(await page.locator('#dialogue').isVisible(),'Leaving and entering the doorway allows another attempt');
  }
  // Boarding starts the authored scene; walking never skips its completion.
  await page.evaluate(()=>{window.__walk.prepare(3,1);window.__walk.state.night3.ended=false;window.__walk.approach('train-door');});
  await page.keyboard.down('ArrowUp');await tick(30);await page.keyboard.up('ArrowUp');
  assert.equal(await room(),1);assert(await page.locator('#dialogue').isVisible());
  await page.evaluate(()=>window.__walk.closeDialogue());
  assert.equal(await page.evaluate(()=>window.__walk.state.night3.ended),false,'Cancelled boarding does not complete the chapter');
  await page.evaluate(()=>window.__walk.approach('train-door'));
  await page.keyboard.down('ArrowUp');await tick(30);await page.keyboard.up('ArrowUp');
  await page.evaluate(()=>{for(let i=0;i<40&&window.__walk.dialogue;i++)window.__walk.advance();});
  assert.equal(await room(),5);assert(await page.locator('#ending').isVisible());

  // Old saves can place the player directly inside a doorway.
  await page.evaluate(()=>{const test=window.__walk;test.prepare(2,0);const snapshot=structuredClone(test.state);snapshot.x=431;snapshot.y=224;test.restore(snapshot,'test');});
  await tick(60);assert.equal(await room(),0,'Loading inside a doorway stays in the saved room');
  await page.keyboard.down('ArrowRight');await tick(6);await page.keyboard.up('ArrowRight');
  assert.equal(await room(),0,'An occupied arrival doorway stays disarmed');
  await page.keyboard.down('ArrowLeft');await tick(25);await page.keyboard.up('ArrowLeft');
  await page.keyboard.down('ArrowRight');await tick(30);await page.keyboard.up('ArrowRight');
  assert.equal(await room(),2,'Doorway re-arms after walking away');

  await page.evaluate(()=>{window.__walk.prepare(2,2);window.__walk.move(2,240,240);});
  await page.keyboard.down('ArrowUp');await tick(8);await page.keyboard.up('ArrowUp');
  assert(!(await page.locator('#dialogue').isVisible()),'Walking beside a puzzle does not activate it');
  assert.equal(await room(),2);

  await page.evaluate(()=>{window.__walk.prepare(1,0);window.__walk.approach('door');});
  await tick(1);await page.locator('#app-menu-open').click();
  await page.keyboard.down('ArrowDown');await tick(30);await page.keyboard.up('ArrowDown');
  assert.equal(await room(),0,'Pause menu blocks walking through exits');
  await page.locator('#app-menu-close').click();
  const stick=await page.locator('#app-stick').boundingBox();
  const x=stick.x+stick.width/2,y=stick.y+stick.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+55);await tick(30);
  assert.equal(await room(),1,'Actual joystick input walks through the doorway');
  assert(!(await page.locator('#app-stick').evaluate(el=>el.classList.contains('held'))),'Arrival releases the joystick');
  const arrived=await page.evaluate(()=>window.__walk.state.y);
  await page.mouse.move(x+4,y+55);await tick(60);await page.mouse.up();
  assert.equal(await room(),1);assert.equal(await page.evaluate(()=>window.__walk.state.y),arrived,'Still-held finger cannot restart movement after arrival');
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${routes.length} chapter/door routes without clicking; all 4 story locks; boarding completion/cancellation; no arrival bounce; save/load; puzzle isolation; pause and actual joystick release.`);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
