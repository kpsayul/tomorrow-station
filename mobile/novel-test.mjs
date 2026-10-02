import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, extname, sep } from 'node:path';
import './build.mjs';

const root = resolve('dist-mobile');
const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  const file = resolve(root, path === '/' ? 'index.html' : '.' + path);
  if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try { response.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml' })[extname(file)] || 'application/octet-stream'); response.end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

// Use the same authored scenes and completion callbacks as a real playthrough.
// The chapter suites separately walk every puzzle, gate and ending branch.
const scenes = [
  { chapter: 1, room: 0, x: 348, y: 177 },
  ...[2,3,4].map(chapter => ({ chapter, start: true })),
  { chapter: 2, room: 3, x: 151, y: 202, choice: 1 },
  { chapter: 2, room: 1, x: 348, y: 186, progress: { night2: { remembered: true } } },
  { chapter: 2, room: 0, x: 348, y: 177, progress: { night2: { met: true, remembered: true, catName: true } }, choice: 0 },
  { chapter: 3, entity: 'board' },
  ...['keeper','machine','cat'].map(entity => ({ chapter: 3, entity, progress: { night3: { board: true } } })),
  ...[0,1].map(choice => ({ chapter: 3, entity: 'inspector', progress: { night3: { board: true, witnesses: ['keeper','machine','cat'] } }, choice })),
  { chapter: 3, entity: 'inspector', progress: { night3: { inspector: true } } },
  ...[0,1,2].map(index => ({ chapter: 3, entity: `signal-${index}`, progress: { night3: { inspector: true } } })),
  { chapter: 3, entity: 'console', progress: { night3: { inspector: true, signals: ['store','wait','go'] } } },
  ...[0,1].map(choice => ({ chapter: 3, entity: 'console', progress: { night3: { signalDone: true, inspector: true } }, choice })),
  { chapter: 3, entity: 'train-door', progress: { night3: { announced: true, choice: 'next' } } },
  { chapter: 4, entity: 'cafe-owner', progress: { day4: { notice: true } } },
  { chapter: 4, entity: 'naru', progress: { day4: { notice: true, letter: true } } },
  { chapter: 4, entity: 'light-console', progress: { day4: { met: true, mirrors: [1,1,0] } } },
  ...[0,1].map(choice => ({ chapter: 4, entity: 'naru', progress: { day4: { met: true, lit: true } }, choice })),
];
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  await mkdir('artifacts', { recursive: true });
  const page = await browser.newPage({ viewport: { width: 640, height: 320 }, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/game.js', async route => route.fulfill({ contentType: 'text/javascript', body: (await readFile('game.js', 'utf8')).replace('requestAnimationFrame(frame);window.addEventListener', `
    window.__novel={
      get state(){return state},get dialogue(){return conversation},advance,speak,save,normaliseSave,
      prepare(spec){
        state=fresh();active=true;$('start').hidden=true;$('ending').hidden=true;closeDialogue();
        state.chapter=spec.chapter;state.choice='carry';state.night2.choice='name';
        for(const [key,value] of Object.entries(spec.progress||{})){
          if(key==='journey2'){for(const [part,data] of Object.entries(value))Object.assign(state.journey2[part],data);}
          else Object.assign(state[key],value);
        }
        if(spec.start){state.chapter--;state.ended=true;for(const key of ['night2','night3','day4','night5'])state[key].ended=true;for(const key of ['six','seven'])state.journey2[key].ended=true;
          if(spec.chapter>=6)secondJourney.start(spec.chapter);else [null,null,secondNight,thirdNight,fourthDay,fifthStory][spec.chapter].start();return;}
        if(!spec.entity){move(spec.room,spec.x,spec.y);interact();return;}
        for(let room=0;room<=16;room++){
          state.room=room;let entity;try{entity=(roomEntities()||[]).find(e=>e.id===spec.entity);}catch{continue;}
          if(entity){move(room,entity.x,entity.y);interact();return;}
        }
        throw Error('Missing scene '+spec.entity);
      }
    };requestAnimationFrame(frame);window.addEventListener`) }));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.locator('#app-menu-open').waitFor();
  await page.evaluate(() => { document.body.classList.add('reading-large'); });
  const overflow = [], manuscript = [], archive = [];
  let pageCount = 0;
  for (const [index, spec] of scenes.entries()) {
    await page.evaluate(spec => window.__novel.prepare(spec), spec);
    assert(await page.locator('#dialogue').isVisible(), JSON.stringify(spec));
    if(spec.chapter===1||spec.entity==='archive')await page.screenshot({path:`artifacts/novel-${spec.chapter===1?'opening':'letter'}.png`});
    const collected = await page.evaluate(() => {
      const t=window.__novel, result=[];let guard=0;
      while(t.dialogue&&guard++<300){
        const d=t.dialogue,p=d.pages[d.index],line=document.getElementById('line'),panel=document.getElementById('dialogue');
        result.push({speaker:p.speaker,text:line.innerText,overflow:line.scrollHeight-line.clientHeight,panelOverflow:panel.scrollHeight-panel.clientHeight,voices:[...new Set((p.turns||[]).filter(t=>!t.narration).map(t=>t.speaker))]});
        if(d.choices&&d.index===d.pages.length-1)break;
        t.advance();
      }
      return result;
    });
    const record = entries => {
      for(const entry of entries){
        assert(entry.voices.length<=1,'Separate speakers in '+entry.text);
        assert(!entry.text.startsWith('속마음:')&&!entry.text.startsWith('나루의 편지:'),'Authored cues are rendered, not printed');
        if(entry.overflow>1||entry.panelOverflow>1)overflow.push({scene:index,chapter:spec.chapter,...entry});
        manuscript.push(`제${spec.chapter}장 / ${entry.speaker}\n${entry.text}`);pageCount++;
        archive.push({chapter:spec.chapter,speaker:entry.speaker,text:entry.text});
      }
    };
    record(collected);
    if(spec.chapter===3&&spec.entity==='inspector'&&spec.choice===0)await page.screenshot({path:'artifacts/novel-third-choice.png'});
    if(spec.chapter===3&&spec.entity==='signal-0')await page.screenshot({path:'artifacts/novel-third-signal.png'});
    if(spec.choice!==undefined){
      await page.locator('#choices button').nth(spec.choice).click();
      const selected=await page.evaluate(()=>{const t=window.__novel,result=[];let guard=0;while(t.dialogue&&guard++<300){const d=t.dialogue,p=d.pages[d.index],line=document.getElementById('line'),panel=document.getElementById('dialogue');result.push({speaker:p.speaker,text:line.innerText,overflow:line.scrollHeight-line.clientHeight,panelOverflow:panel.scrollHeight-panel.clientHeight,voices:[...new Set((p.turns||[]).filter(t=>!t.narration).map(t=>t.speaker))]});t.advance();}return result;});record(selected);
    }
  }
  await writeFile('artifacts/novel-manuscript.txt',manuscript.join('\n\n'), 'utf8');
  await writeFile('artifacts/novel-layout-audit.json',JSON.stringify(overflow,null,2),'utf8');
  await page.evaluate(archive=>{window.__novel.state.history=archive;window.__novel.save();},archive);
  await page.locator('#app-menu-open').click();await page.locator('#journal-button').click();await page.locator('[data-journal-tab="history"]').click();
  await page.locator('#book-chapter').selectOption('1');await page.screenshot({path:'artifacts/novel-book.png'});await page.locator('#close-journal').click();
  // A complete book and a legacy save survive normalisation, export limits and reload.
  await page.evaluate(()=>{const t=window.__novel;t.state.history=Array.from({length:600},(_,i)=>({chapter:Math.floor(i/75)+1,speaker:'이야기',text:'책장 '+i}));t.save();});
  await page.reload();await page.locator('#app-menu-open').waitFor();await page.locator('#continue').click();
  assert.equal(await page.evaluate(()=>window.__novel.state.history.length),600);
  await page.locator('#app-menu-open').click();await page.locator('#journal-button').click();await page.locator('[data-journal-tab="history"]').click();
  assert.equal(await page.locator('.book-chapter-title').count(),8);
  assert.equal(await page.locator('.history-entry p').first().textContent(),'책장 0');
  await page.locator('#book-chapter').selectOption('4');assert.equal(await page.locator('.history-entry').count(),75);assert.equal(await page.locator('.history-entry p').first().textContent(),'책장 225');
  await page.screenshot({path:'artifacts/novel-bookmarks.png'});
  const bounded=await page.evaluate(()=>{const t=window.__novel,s=t.normaliseSave({...t.state,history:Array.from({length:1200},()=>({chapter:8,speaker:'온',text:'가'.repeat(2000)}))});return {size:new Blob([JSON.stringify({format:'tomorrow-station',version:1,state:s})]).size,entries:s.history.length};});
  assert(bounded.size<512*1024&&bounded.entries>0,'Story archive remains importable');
  assert.deepEqual(errors,[]);
  console.log(`Reviewed ${pageCount} pages across ${scenes.length} scenes in chapters 1–4; ${overflow.length} text/layout overflows. 600-page book restoration, chapter filter, export bound passed.`);
  assert.deepEqual(overflow,[],'Main story should fit on a small landscape phone in large type; see artifacts/novel-layout-audit.json');
} finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }

// The replacement chapters have their own complete-route layout audit.
await import('../homecoming-test.mjs');
