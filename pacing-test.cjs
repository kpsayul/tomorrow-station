const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{for(const question of ['again','name']){
  const context=await browser.newContext({viewport:{width:1280,height:1000}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/game.js',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync('game.js','utf8').replace('requestAnimationFrame(frame);window.addEventListener','window.__check={get state(){return state},move,interact,advance,normaliseSave,get dialogue(){return conversation}};requestAnimationFrame(frame);window.addEventListener')}));
  const state=()=>page.evaluate(()=>structuredClone(window.__check.state));
  async function visit(room,x,y){await page.evaluate(({room,x,y})=>{const t=window.__check;t.move(room,x,y);t.interact();},{room,x,y});}
  async function read(){await page.evaluate(()=>{const t=window.__check;let guard=0;while(t.dialogue&&guard++<80){const d=t.dialogue;for(const p of d.pages){if(new Set((p.turns||[]).filter(t=>!t.narration).map(t=>t.speaker)).size>1)throw Error('Mixed speaker page');}if(d.choices&&d.index===d.lines.length-1)return;t.advance();}if(t.dialogue)throw Error('Dialogue did not finish');});}
  const choice=question==='again'?'방금 “이번에도”라고 했죠?':'제 이름도 알고 있나요?';
  await page.goto(process.env.GAME_URL||'http://localhost:8080/tomorrow-station/');await page.locator('#begin').click();
  await visit(0,348,177);assert.equal(await page.locator('#choices button').count(),2);assert.equal(await page.locator('#page').textContent(),'1 / 1');
  await page.getByRole('button',{name:choice,exact:true}).click();await page.keyboard.press('Escape');
  assert.equal((await state()).met,false);assert.equal((await state()).firstQuestion,null);
  await visit(0,348,177);await page.getByRole('button',{name:choice,exact:true}).click();await read();
  assert((await state()).met);assert.equal((await state()).firstQuestion,question);
  await page.reload();await page.locator('#continue').click();assert.equal((await state()).firstQuestion,question);
  await visit(0,91,167);assert((await page.evaluate(()=>window.__check.dialogue.lines.join('\n'))).includes(question==='name'?'이름도 맡기셨네요':'이미 직원이셔서'));await read();assert((await state()).ticket);
  assert.equal(await page.evaluate(()=>window.__check.normaliseSave({...window.__check.state,firstQuestion:'invalid'}).firstQuestion),null);
  // Each necessary sound clue should reward exploration after at most two pages.
  await page.evaluate(()=>{const s=window.__check.state;s.chapter=2;s.night2.met=true;});
  for(const [x,y] of [[90,174],[214,167],[358,173]]){await visit(2,x,y);assert(await page.evaluate(()=>window.__check.dialogue.pages.length<=2));await read();}
  assert.equal((await state()).night2.clues.length,3);
  // Give the player a decision before the reunion's longer emotional payoff.
  await page.evaluate(()=>{const s=window.__check.state;s.chapter=4;Object.assign(s.day4,{notice:true,letter:true,met:true,lit:true,mirrors:[1,1,0]});});
  await visit(8,403,241);assert(await page.evaluate(()=>window.__check.dialogue.pages.length<=9));await read();
  assert(!(await page.evaluate(()=>window.__check.dialogue.lines.join('\n'))).includes('버리려고'));
  await page.getByRole('button',{name:question==='again'?'식탁에 한 자리 더 만들자.':'둘이 먼저 바다를 걸어봐.',exact:true}).click();
  assert(await page.evaluate(()=>window.__check.dialogue.pages.length<=12));assert((await page.evaluate(()=>window.__check.dialogue.lines.join('\n'))).includes('버리려고'));
  assert.equal((await state()).day4.reunited,false);await page.keyboard.press('Escape');assert.equal((await state()).day4.choice,null);
  await visit(8,403,241);await read();await page.getByRole('button',{name:question==='again'?'식탁에 한 자리 더 만들자.':'둘이 먼저 바다를 걸어봐.',exact:true}).click();await read();assert((await state()).day4.reunited);
  assert.equal((await state()).day4.choice,question==='again'?'table':'shore');assert.deepEqual(errors,[]);
  console.log(`PASS: ${question}; immediate question, cancel/retry, saved branch consequence, bounded clue/reunion reading, payoff after choice, one speaker per page.`);await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
