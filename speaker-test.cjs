const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/game.js',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync('game.js','utf8').replace('requestAnimationFrame(frame);window.addEventListener','window.__check={get state(){return state},speak,interact,move,save,get dialogue(){return conversation}};requestAnimationFrame(frame);window.addEventListener')}));
  await page.goto(process.env.GAME_URL||'http://localhost:8080/tomorrow-station/');await page.locator('#begin').click();
  // Actual first-night question: the player speaks under their own identity,
  // without revealing the name before the memory scene.
  await page.evaluate(()=>{const t=window.__check;Object.assign(t.state,{met:true,bell:true});t.move(0,348,177);t.interact();});
  assert.equal(await page.locator('#speaker').textContent(),'당신 · 주인공');
  assert((await page.locator('.dialogue-turn').textContent()).includes('어제 돌려받으셨다면서요'));
  assert((await page.locator('.dialogue-narration').textContent()).includes('방울과 영수증'));
  const playerPortrait=await page.locator('#portrait').evaluate(canvas=>canvas.toDataURL());
  await page.locator('#next').click();assert.equal(await page.locator('#speaker').textContent(),'역무원 · 여울');
  assert.notEqual(await page.locator('#portrait').evaluate(canvas=>canvas.toDataURL()),playerPortrait);
  const historyCount=await page.evaluate(()=>window.__check.state.history.length);
  await page.locator('#previous').click();assert.equal(await page.locator('#speaker').textContent(),'당신 · 주인공');
  assert.equal(await page.evaluate(()=>window.__check.state.history.length),historyCount);
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.__check.state.ended),false);
  // Naming the cat has two speakers on the same page. The player's label also
  // stays clear on the branch where the name tag is left in storage.
  await page.evaluate(()=>{const t=window.__check;t.state.chapter=2;Object.assign(t.state.night2,{remembered:true,choice:'letter'});t.move(1,348,186);t.interact();});
  assert.deepEqual(await page.locator('.dialogue-speaker').allTextContents(),['온 · 주인공\n','후추\n']);
  assert.equal(await page.locator('#speaker').textContent(),'온 · 주인공 / 후추');
  await page.setViewportSize({width:320,height:568});await page.locator('#dialogue').scrollIntoViewIfNeeded();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#next').scrollIntoViewIfNeeded();assert(await page.locator('#next').isVisible());
  await page.screenshot({path:'screenshot-speaker-mobile.png',fullPage:true});await page.keyboard.press('Escape');
  // A later real scene used to put On's question under Baekji's portrait.
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(()=>{const t=window.__check;t.state.chapter=5;t.move(0,348,177);t.interact();});
  await page.locator('#next').click();assert.equal(await page.locator('#speaker').textContent(),'온 · 주인공');
  assert((await page.locator('.dialogue-turn').textContent()).includes('나루의 편지도'));
  assert.equal(await page.locator('#portrait').evaluate(canvas=>canvas.toDataURL()),playerPortrait);
  await page.screenshot({path:'screenshot-speaker-desktop.png'});await page.keyboard.press('Escape');
  // Speaker-looking words in prose, unknown field names, and HTML are text.
  await page.evaluate(()=>window.__check.speak('후추',['온. 왜 여울 이름을 쳐다봐?\n주소: 물결마을\n<img src=x onerror=alert(1)>']));
  assert.equal(await page.locator('#speaker').textContent(),'후추');assert.equal(await page.locator('#line img').count(),0);assert.equal(await page.locator('.dialogue-speaker').count(),0);
  await page.keyboard.press('Escape');
  // Callback/choice boundaries stay on their original pages; going backwards
  // or cancelling must not complete the conversation or duplicate history.
  await page.evaluate(()=>{const t=window.__check;t.speak('대화',['서린: 기록을 고칠까요?\n당신: 우리 것도요.','당신: <b>그대로 적어주세요.</b>'],()=>{t.state.speakerCompleted=true;});});
  await page.setViewportSize({width:844,height:390});await page.locator('#next').click();
  assert.equal(await page.locator('#speaker').textContent(),'온 · 주인공');assert.equal(await page.locator('#line b').count(),0);
  assert.equal(await page.evaluate(()=>window.__check.state.speakerCompleted),undefined);
  await page.locator('#previous').click();await page.locator('#next').click();await page.locator('#next').click();
  assert.equal(await page.evaluate(()=>window.__check.state.speakerCompleted),true);
  await page.reload();await page.locator('#continue').click();await page.locator('#journal-button').click();await page.locator('[data-journal-tab="history"]').click();
  assert((await page.locator('#journal-content').textContent()).includes('온 · 주인공: 우리 것도요.'));
  assert((await page.locator('#journal-content').textContent()).includes('당신 · 주인공: 어제 돌려받으셨다면서요.'));
  assert.equal(await page.locator('#journal-content b').count(),0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);console.log('PASS: real On dialogue before/after name reveal; mixed speakers; distinct portrait; narration; previous/cancel/completion; saved history; safe text; 320px portrait and 844px landscape.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
