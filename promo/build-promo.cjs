// Render original game scenery and typography; requires Playwright + Microsoft Edge.
// All preview hooks live only in intercepted localhost responses, never in game.js.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),media=path.join(root,'media');
const gameSite=process.env.GAME_URL||'http://localhost:8080/tomorrow-station/';
if(!['localhost','127.0.0.1'].includes(new URL(gameSite).hostname))throw Error('Use a local game server to build promotional assets.');
(async()=>{
 fs.mkdirSync(media,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const hook=`window.__promo={scene(n){closeDialogue();keys.clear();state=fresh();state.met=true;state.ticket=true;state.room=n===0?0:n===3?10:1;state.chapter=n>=2?5:1;state.x=n===1?333:n===2?123:240;state.y=n===1?185:n===2?204:242;if(n===2)state.night5.met=true;objective();if(n===1){interact();advance();advance();}if(n===2)interact();},get line(){return conversation?.lines[conversation.index]||'';}};`;
  await page.route('**/game.js',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(root,'game.js'),'utf8').replace('requestAnimationFrame(frame);window.addEventListener',hook+'requestAnimationFrame(frame);window.addEventListener')}));
  await page.goto(gameSite+'?preview=1');await page.locator('#begin').click();await page.evaluate(()=>document.fonts.ready);
  await page.addStyleTag({content:'#target-marker,#interaction{visibility:hidden}'});
  await page.evaluate(()=>window.__promo.scene(1));await page.waitForTimeout(120);
  const covers=await page.evaluate(()=>{
   function cover(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),compact=w<800;
    x.fillStyle='#10232e';x.fillRect(0,0,w,h);x.imageSmoothingEnabled=false;x.drawImage(document.getElementById('game'),compact?-15:300,compact?110:40,compact?780:1040,compact?468:624);
    const g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,'#101e2cff');g.addColorStop(compact?.6:.45,'#101e2cf0');g.addColorStop(1,'#101e2c35');x.fillStyle=g;x.fillRect(0,0,w,h);x.strokeStyle='#8ca98b70';x.strokeRect(24,24,w-48,h-48);
    const tx=(t,a,b,size,color='#f0efe0',weight=600)=>{x.font=`${weight} ${size}px "Malgun Gothic",sans-serif`;x.fillStyle=color;x.fillText(t,a,b);};
    const left=compact?48:64;tx('NIGHT PLATFORM',left,compact?68:92,compact?15:18,'#c5dfb9');tx('내일 분실물',left,compact?151:221,compact?48:70);tx('보관소',left,compact?216:309,compact?48:70);
    tx('이름을 잃어버린 당신이,',left,compact?289:382,compact?21:28,'#d2dfd6',500);tx('다른 사람들의 분실물을 찾는 밤.',left,compact?325:427,compact?21:28,'#d2dfd6',500);
    x.fillStyle='#c5dfb9';x.fillRect(left,compact?367:481,compact?288:354,48);tx('무료 · 설치·가입 없이 바로 플레이',left+15,compact?397:512,compact?17:21,'#23392e',700);
    tx('여덟 이야기 · 작은 퍼즐 · 당신의 선택',left,compact?453:572,compact?16:20,'#b2c8bd',500);return c.toDataURL('image/png').split(',')[1];
   }return {og:cover(1200,630),itch:cover(630,500)};
  });
  fs.writeFileSync(path.join(media,'og-cover.png'),Buffer.from(covers.og,'base64'));fs.writeFileSync(path.join(media,'itch-cover.png'),Buffer.from(covers.itch,'base64'));
  for(const [scene,name] of [[0,'station'],[1,'talking-cat'],[3,'rooftop']]){await page.evaluate(n=>window.__promo.scene(n),scene);await page.waitForTimeout(100);await page.locator('.scene-stage').screenshot({path:path.join(media,'scene-'+name+'.png')});}
  if(process.env.COVERS_ONLY==='1'){console.log('Updated covers and screenshots.');return;}
  const video=await page.evaluate(async()=>{
   const canvas=document.createElement('canvas');canvas.width=720;canvas.height=1280;const ctx=canvas.getContext('2d');
   const mime=['video/mp4;codecs="avc1,mp4a.40.2"'].find(t=>MediaRecorder.isTypeSupported(t));if(!mime)throw Error('A browser with H.264 and AAC recording support is required.');
   const Audio=window.AudioContext||window.webkitAudioContext,audio=new Audio(),destination=audio.createMediaStreamDestination();await audio.resume();
   const notes=[261.63,329.63,392,493.88,440,392,329.63,293.66];
   for(let i=0;i<22;i++){const o=audio.createOscillator(),v=audio.createGain(),at=audio.currentTime+i*.68;o.type='sine';o.frequency.value=notes[i%notes.length];v.gain.setValueAtTime(0,at);v.gain.linearRampToValueAtTime(.055,at+.04);v.gain.exponentialRampToValueAtTime(.0001,at+1.7);o.connect(v);v.connect(destination);o.start(at);o.stop(at+1.75);}
   const stream=canvas.captureStream(30);for(const track of destination.stream.getAudioTracks())stream.addTrack(track);
   const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2000000,audioBitsPerSecond:96000}),chunks=[],frames={};
   const stopped=new Promise((resolve,reject)=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=reject;recorder.onstop=resolve;});
   let start=performance.now(),previous=-1,animation;
   function draw(now){const seconds=(now-start)/1000,phase=seconds<4?0:seconds<8?1:seconds<12?2:3;if(phase!==previous){window.__promo.scene(phase);previous=phase;}
    ctx.fillStyle='#101e2c';ctx.fillRect(0,0,720,1280);ctx.strokeStyle='#839f7960';ctx.strokeRect(24,24,672,1232);
    const text=(t,x,y,size,color='#f0efe0',weight=600)=>{ctx.font=`${weight} ${size}px "Malgun Gothic",sans-serif`;ctx.fillStyle=color;ctx.fillText(t,x,y);};
    text('NIGHT PLATFORM',48,98,18,'#c5dfb9');
    const titles=[['잃어버린 건','물건뿐일까?'],['이 역의 고양이는','말을 걸어온다.'],['아무것도 잃지 않아도,','머물러도 되는 곳.'],['내일 분실물','보관소']][phase];
    text(titles[0],48,207,44);text(titles[1],48,269,44);
    ctx.imageSmoothingEnabled=false;ctx.drawImage(document.getElementById('game'),48,330,624,374);ctx.strokeStyle='#8ca18d';ctx.strokeRect(48,330,624,374);
    ctx.fillStyle='#1d333e';ctx.fillRect(48,744,624,209);
    const lines=phase===0?['이름을 잃어버린 당신이,','다른 사람들의 분실물을 찾는 밤.']:phase===1?['“왜 그렇게 봐?','너도 말하잖아.”']:phase===2?['“이름을 맡기면,','다 잊나요?”']:['여덟 이야기와 작은 퍼즐.','그 끝에 남는, 당신의 선택.'];
    text(phase===1?'고양이':phase===2?'처음 온 손님':'내일 분실물 보관소',72,790,19,'#c5dfb9');for(let i=0;i<lines.length;i++)text(lines[i],72,849+i*46,29,'#eff2e8',500);
    ctx.fillStyle='#c5dfb9';ctx.fillRect(48,1010,624,67);text(phase===3?'무료로 바로 플레이 →':'설치·가입 없이 즐기는 한국어 이야기',72,1054,25,'#20372e',700);
    text('kpsayul.github.io/tomorrow-station',48,1145,23,'#c8d8cb',500);text('소리를 켜도, 조용히 읽어도 괜찮아요.',48,1190,19,'#91aaa4',400);
    if(seconds>[2,6,10,14][phase]&&!frames[phase])frames[phase]=canvas.toDataURL('image/png').split(',')[1];
    animation=requestAnimationFrame(draw);
   }
   draw(start);recorder.start();await new Promise(r=>setTimeout(r,15000));cancelAnimationFrame(animation);recorder.stop();await stopped;
   for(const t of stream.getTracks())t.stop();await audio.close();const blob=new Blob(chunks,{type:'video/mp4'});
   const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});return {data,frames};
  });
  fs.writeFileSync(path.join(media,'tomorrow-station-15s.mp4'),Buffer.from(video.data,'base64'));
  for(const [key,value] of Object.entries(video.frames))fs.writeFileSync(path.join(root,`screenshot-promo-frame-${key}.png`),Buffer.from(value,'base64'));
  console.log('Built 1200x630 link cover, 630x500 itch cover, 3 screenshots and 15s 720x1280 MP4 with original synthesized music.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
