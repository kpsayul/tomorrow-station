// Capture the real Android WebView on the isolated, windowless emulator.
// Screenshots are unmodified ADB captures; promotional art reuses the game's vector icon and canvas.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
import { setTimeout as delay } from 'node:timers/promises';
const {PNG}=createRequire(import.meta.url)('../node_modules/playwright-core/lib/utilsBundle.js');

const serial=process.env.ANDROID_SERIAL||'emulator-5580',app='io.github.kpsayul.tomorrowstation';
assert.equal(serial,'emulator-5580','Use only the isolated release-preparation emulator');
const adb=join(process.env.LOCALAPPDATA,'Android/Sdk/platform-tools/adb.exe');
const command=(...args)=>execFileSync(adb,['-s',serial,...args],{encoding:'utf8',windowsHide:true}).trim();
const out='artifacts/play-store';await mkdir(out,{recursive:true});
const pid=command('shell','pidof',app),port=command('forward','tcp:0',`localabstract:webview_devtools_remote_${pid}`);
let device,renderer,original;
try {
 device=await chromium.connectOverCDP(`http://127.0.0.1:${port}`,{noDefaults:true});
 const page=device.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('https://localhost'));
 assert(page,'Debug game WebView');page.setDefaultTimeout(15000);
 await page.waitForFunction(()=>!!window.tomorrowNative);
 original=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])));
 await page.addInitScript(()=>{const seed=sessionStorage.getItem('store-capture-seed');if(seed){localStorage.setItem('tomorrow-station-v1',seed);sessionStorage.removeItem('store-capture-seed');}});
 const base={storyVersion:2,x:240,y:226,room:0,chapter:1,met:true,ticket:true,cat:true,bell:false,choice:null,ended:false,history:[]};
 async function scene(patch){
  await page.evaluate(s=>{sessionStorage.setItem('store-capture-seed',JSON.stringify(s));localStorage.setItem('tomorrow-station-reading-size','normal');},{...base,...patch});
  await page.reload();await page.locator('#continue').click();
  await page.waitForFunction(()=>document.body.classList.contains('native-playing'));await delay(700);
  console.log('Android scene: '+await page.locator('#location').innerText());
 }
 async function capture(name){
  await delay(500);
  const focus=command('shell','dumpsys','window').split('\n').find(line=>line.includes('mCurrentFocus='));
  assert(focus?.includes(app),'A system dialog is covering the game: '+focus);
  const raw=execFileSync(adb,['-s',serial,'exec-out','screencap','-p'],{windowsHide:true,maxBuffer:15000000});
  const png=PNG.sync.read(raw);assert.equal(png.width,1920);assert.equal(png.height,1080);
  await writeFile(`${out}/${name}.png`,PNG.sync.write(png,{colorType:2}));
 }
 await scene({});await capture('phone-01-station');
 const stationCanvas=await page.locator('#game').evaluate(c=>c.toDataURL('image/png'));
 await scene({room:1,x:348,y:199,cat:false});await page.locator('#touch-action').click();
 await page.waitForFunction(()=>!document.getElementById('dialogue').hidden);
 // Reach the short exchange without inventing or rewriting in-game text.
 for(let i=0;i<8;i++){
  if((await page.locator('#line').innerText()).includes('너 말을 해'))break;
  await page.locator('#next').click();
 }
 assert((await page.locator('#line').innerText()).includes('너 말을 해'));await capture('phone-02-dialogue');
 await scene({chapter:2,room:3,x:237,y:235,ended:true,choice:'carry',night2:{met:true,clues:['rain','whistle','train'],tuned:true,remembered:false}});
 await capture('phone-03-memory');
 await scene({chapter:4,room:6,x:240,y:233,ended:true,choice:'carry',night2:{ended:true,choice:'name'},night3:{ended:true,announced:true,choice:'rest'},day4:{notice:true,letter:true,met:true,mirrors:[0,0,1]}});
 await capture('phone-04-harbor');

 renderer=await chromium.launch({channel:'msedge',headless:true});
 const art=await renderer.newPage({viewport:{width:512,height:512},deviceScaleFactor:1});
 const vector=await readFile('android/app/src/main/res/drawable/game_icon.xml','utf8');
 const paths=[...vector.matchAll(/<path android:fillColor="([^"]+)" android:pathData="([^"]+)"/g)].map(([,fill,d])=>`<path fill="${fill}" d="${d}"/>`).join('');
 assert(paths);await art.setContent(`<body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64">${paths}</svg></body>`);
 await art.screenshot({path:`${out}/icon-512.png`});
 await writeFile(`${out}/icon-512.png`,PNG.sync.write(PNG.sync.read(await readFile(`${out}/icon-512.png`)),{colorType:6}));
 await art.setViewportSize({width:1024,height:500});
 await art.setContent(`<html lang="ko"><style>*{box-sizing:border-box}body{margin:0;width:1024px;height:500px;background:#10202a;color:#f1edda;font-family:"Malgun Gothic",sans-serif;overflow:hidden}.scene{position:absolute;left:350px;top:25px;width:790px;height:474px;image-rendering:pixelated;opacity:.9}.shade{position:absolute;inset:0;background:linear-gradient(90deg,#10202a 0%,#10202af2 29%,#10202a99 49%,#10202a00 85%)}main{position:absolute;left:62px;top:80px}small{font-size:15px;letter-spacing:4px;color:#b9c8ab}h1{font-size:66px;line-height:1.22;letter-spacing:-4px;font-weight:700;margin:22px 0 24px}p{font-size:21px;line-height:1.6;color:#c3d1c7;margin:0}</style><body><img class="scene" src="${stationCanvas}"><div class="shade"></div><main><small>THE LOST &amp; FOUND OF TOMORROW</small><h1>내일<br>분실물 보관소</h1><p>두고 간 마음을 따라<br>조금씩, 집으로.</p></main></body></html>`);
 await art.evaluate(()=>document.fonts.ready);await art.screenshot({path:`${out}/feature-1024x500.png`});
 await writeFile(`${out}/feature-1024x500.png`,PNG.sync.write(PNG.sync.read(await readFile(`${out}/feature-1024x500.png`)),{colorType:2}));
 await writeFile(`${out}/capture-info.json`,JSON.stringify({source:'Unmodified ADB screenshots from the Android debug WebView',serial,android:command('shell','getprop','ro.build.version.release'),screen:command('shell','wm','size'),density:command('shell','wm','density'),package:app,notes:'1.8.1 game runtime; release changes signing and privacy/contact text, not these game scenes.'},null,2));
 console.log('Captured 4 actual Android screens, vector-derived 512px icon and 1024x500 feature graphic.');
} finally {
 if(original&&device){const page=device.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('https://localhost'));if(page)await page.evaluate(saved=>{localStorage.clear();for(const [k,v] of Object.entries(saved))localStorage.setItem(k,v);},original);}
 await device?.close();await renderer?.close();command('forward','--remove',`tcp:${port}`);
}
