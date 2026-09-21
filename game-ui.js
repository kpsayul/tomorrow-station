'use strict';
window.createGameComfort=function(api){
 const $=id=>document.getElementById(id),backupKey='tomorrow-station-v1-before-import';
 const roomNames=['대합실','승강장','기록실','비 오는 기억','신호실','첫차 안','물결마을 항구','작은 식탁','등대 작업실','당직실','옥상 정원','밤 우편열차','끊어진 철교','유리도시 광장','반송 기록청','중앙 우편국','새벽의 연결교'];
 const maps={1:[[0,1]],2:[[0,1],[0,2],[2,3]],3:[[0,1],[0,2],[2,3],[1,4],[1,5]],4:[[6,7],[6,8]],5:[[0,1],[0,9],[9,10]],6:[[11,12]],7:[[13,14]],8:[[15,16]]};
 let notes=[],tab='notes',pendingImport=null,importGeneration=0;
 function paragraph(value,container=$('journal-content')){const p=document.createElement('p');p.textContent=value;container.append(p);return p;}
 function renderJournal(){
  const container=$('journal-content');container.replaceChildren();
  for(const button of document.querySelectorAll('[data-journal-tab]'))button.setAttribute('aria-pressed',String(button.dataset.journalTab===tab));
  if(tab==='notes'){for(const note of notes)paragraph(note);return;}
  if(tab==='history'){
   const history=api.state().history||[];
   if(!history.length)paragraph('아직 읽은 대화가 없어요. 앞으로 읽는 대화가 여기에 남아요.');
   for(const entry of [...history].reverse()){const row=document.createElement('article');row.className='history-entry';const speaker=document.createElement('strong'),line=document.createElement('p');speaker.textContent=entry.speaker;line.textContent=entry.text;row.append(speaker,line);container.append(row);}
   return;
  }
  paragraph(`지금 있는 곳: ${roomNames[api.state().room]}`);
  const summary=paragraph('현재 이야기에서 이어진 길이에요. 문 가까이에서 E / Enter 또는 말 걸기를 누르면 이동해요.');summary.className='map-description';
  for(const [from,to] of maps[api.state().chapter]){const row=document.createElement('div');row.className='map-connection';for(const id of [from,to]){const node=document.createElement('span');node.textContent=roomNames[id];node.className='map-place';if(id===api.state().room){node.classList.add('current');node.setAttribute('aria-current','location');}row.append(node);if(id===from){const arrow=document.createElement('span');arrow.textContent='↔';arrow.setAttribute('aria-hidden','true');row.append(arrow);}}container.append(row);}
  paragraph(api.currentTask().detail);
 }
 for(const button of document.querySelectorAll('[data-journal-tab]'))button.onclick=()=>{tab=button.dataset.journalTab;renderJournal();};
 function showJournal(currentNotes){notes=currentNotes;tab='notes';renderJournal();$('journal').showModal();}
 // Only authored speaker cues change the speaker. Quoted names and stage
 // directions must never be used to guess who is speaking.
 function dialoguePage(defaultSpeaker,line){
  const state=api.state(),player=state.night2.remembered||state.chapter>=3?'온 · 주인공':'당신 · 주인공';
  const names={'당신':player,'온':player,'당신의 답장':player+' · 답장','당신의 기록':player+' · 기록','당신의 엽서':player+' · 엽서','어제의 온':'온 · 어제의 메모','어린 온의 편지':'어린 온 · 편지','당신의 안내 방송':player+' · 안내 방송'};
  const label=name=>names[name]||name;
  const cue=/^(당신의 답장|당신의 기록|당신의 엽서|어린 온의 편지|어제의 온|어린 온|우산을 쓴 아이|아이|당신|온|여울|나루|후추|고양이|03호|백지|모래|이음|서린|결|연|담|손님|이야기):\s*(.*)$/;
  const turns=[];let tagged=false;
  for(const part of line.split('\n')){
   const match=part.match(cue);
   if(match){tagged=true;turns.push({speaker:label(match[1]),text:match[2],narration:match[1]==='이야기'});}
   else if(turns.length)turns[turns.length-1].text+='\n'+part;
   else turns.push({speaker:'이야기',text:part,narration:true});
  }
  if(!tagged)return {speaker:label(defaultSpeaker),portrait:label(defaultSpeaker),text:line,turns:null};
  return {turns};
 }
 function renderDialogue(page){
  $('speaker').textContent=page.speaker;portrait(page.portrait);$('line').replaceChildren();
  if(!page.turns){$('line').textContent=page.text;return;}
  for(const turn of page.turns){
   const block=document.createElement('span');block.className=turn.narration?'dialogue-narration':'dialogue-turn';
   const content=document.createElement('span');content.textContent=turn.text;block.append(content);$('line').append(block);
  }
 }
 function dialoguePages(speaker,lines){
  return lines.flatMap(line=>{
   const parsed=dialoguePage(speaker,line);if(!parsed.turns)return [parsed];
   const pages=[];let turns=[],voice=null;
   function flush(){if(!turns.length)return;pages.push({speaker:voice||'이야기',portrait:voice||'이야기',turns,text:turns.map(t=>t.narration?t.text:`${t.speaker}: ${t.text}`).join('\n')});turns=[];voice=null;}
   for(const turn of parsed.turns){
    if(!turn.narration&&voice&&voice!==turn.speaker)flush();
    if(!turn.narration)voice=turn.speaker;
    turns.push(turn);
   }
   flush();return pages;
  });
 }
 function remember(dialogue,page){if(dialogue.index<=(dialogue.recorded??-1))return;dialogue.recorded=dialogue.index;const history=api.state().history;history.push({speaker:page.speaker,text:page.text,chapter:api.state().chapter});if(history.length>80)history.splice(0,history.length-80);}
 function portrait(speaker){
  const ctx=$('portrait').getContext('2d'),r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};ctx.clearRect(0,0,32,32);r(0,0,32,32,'#29414c');
  if(speaker.includes('주인공')){r(8,23,17,9,'#c49b75');r(10,8,14,16,'#d7b99e');r(8,5,18,7,'#303643');r(8,10,4,8,'#303643');r(14,16,2,3,'#37434b');r(22,16,2,3,'#37434b');r(17,21,4,1,'#b08174');r(7,24,20,4,'#b55b5b');r(8,27,5,5,'#b55b5b');return;}
  if(/후추|고양이/.test(speaker)){r(7,12,19,14,'#d4d6b8');r(7,7,5,8,'#d4d6b8');r(21,7,5,8,'#d4d6b8');r(11,18,2,3,'#32434f');r(21,18,2,3,'#32434f');r(16,22,3,2,'#bc8d80');return;}
  if(/03호|자판기/.test(speaker)){r(6,4,21,26,'#a46b61');r(9,7,15,13,'#86aba4');r(11,11,3,3,'#324650');r(19,11,3,3,'#324650');r(10,24,13,3,'#2a424d');r(23,21,2,2,'#dfc590');return;}
  if(!/여울|백지|검표원|나루|모래|손님|당신|아이|이음|서린|배달원 결|우편소 · 결/.test(speaker)){r(9,7,15,21,'#c3c5a6');r(12,12,9,2,'#708d85');r(12,17,9,2,'#708d85');r(12,22,6,2,'#708d85');return;}
  const keeper=/여울|백지|검표원/.test(speaker),guest=/손님/.test(speaker);r(7,24,19,8,keeper?'#8fa79b':guest?'#9b85a2':/나루|배달원 결|우편소 · 결/.test(speaker)?'#76a1a8':/서린/.test(speaker)?'#7f95a4':/이음/.test(speaker)?'#ae8166':'#c49b75');r(9,8,15,17,'#d7b99e');r(7,5,19,7,keeper?'#506e75':'#534a50');r(7,10,4,8,keeper?'#a0aca1':'#534a50');r(13,16,2,3,'#37434b');r(22,16,2,3,'#37434b');r(17,22,4,1,'#b08174');if(keeper)r(5,10,23,3,'#c2c6a2');
 }
 function transition(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const scene=$('scene-stage');for(const animation of scene.getAnimations())animation.cancel();scene.animate([{opacity:.45},{opacity:1}],{duration:220,easing:'ease-out'});}
 function readBackup(){try{return api.normaliseSave(JSON.parse(localStorage.getItem(backupKey)));}catch{return null;}}
 function prepareSaveMenu(){importGeneration++;pendingImport=null;$('import-preview').hidden=true;$('import-status').textContent='파일을 다른 기기로 옮긴 뒤 가져오면 이어서 할 수 있어요.';$('import-file').value='';$('export-save').disabled=!api.active()&&!api.readSave();}
 $('export-save').onclick=()=>{
  const snapshot=api.active()?api.state():api.readSave();if(!snapshot)return;
  const savedAt=new Date().toISOString(),payload={format:'tomorrow-station',version:1,savedAt,state:snapshot};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`tomorrow-station-${savedAt.slice(0,19).replaceAll(':','-')}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('import-status').textContent='현재 진행을 저장 파일로 내보냈어요. 파일을 보관하거나 다른 기기로 옮겨주세요.';
 };
 $('import-save').onclick=()=>$('import-file').click();
 $('import-file').onchange=async()=>{
  const generation=++importGeneration,file=$('import-file').files[0];pendingImport=null;$('import-preview').hidden=true;if(!file)return;
  try{
   if(file.size>512*1024)throw new Error('저장 파일은 512KB 이하여야 해요.');
   const input=JSON.parse(await file.text());if(generation!==importGeneration)return;
   if(input?.format!=='tomorrow-station'||input.version!==1)throw new Error('이 게임에서 내보낸 저장 파일을 선택해주세요.');
   const snapshot=api.normaliseSave(input.state);if(!snapshot)throw new Error('저장 내용이 올바르지 않아요. 다른 파일을 선택해주세요.');
   pendingImport=snapshot;$('import-summary').textContent=api.saveSummary(snapshot);$('import-date').textContent=api.formatSavedAt(input.savedAt);$('import-preview').hidden=false;$('import-status').textContent='아래 내용을 확인한 뒤 불러오세요. 직접 저장 3칸은 유지되고, 현재 진행은 복구용으로 남아요.';
  }catch(error){if(generation!==importGeneration)return;$('import-status').textContent=error instanceof SyntaxError?'파일을 읽을 수 없어요. 올바른 JSON 저장 파일을 선택해주세요.':error.message;}
 };
 $('apply-import').onclick=()=>{
  if(!pendingImport)return;
  const previous=api.active()?api.state():api.readSave();
  try{if(previous)localStorage.setItem(backupKey,JSON.stringify({...previous,savedAt:new Date().toISOString()}));}
  catch{$('import-status').textContent='현재 진행을 복구용으로 보관하지 못했어요. 브라우저의 저장 공간을 확인해주세요.';return;}
  const snapshot=pendingImport;pendingImport=null;api.restore(snapshot,'가져온 파일');
 };
 $('review-journey').onclick=$('credits-button').onclick=()=>{
  api.keys.clear();const list=$('credits-choices');list.replaceChildren();
  const s=api.state();for(const line of [s.choice==='carry'?'여울은 방울을 가지고 길을 나섰다.':'여울은 돌아올 문에 방울을 걸었다.',s.night2.choice==='name'?'당신은 온이라는 이름을 돌려받았다.':'당신은 이름의 빈칸까지 안고 걸었다.',s.night3.choice==='rest'?'역에는 쉬어갈 자리가 남았다.':'역에는 함께 다음으로 갈 자리가 생겼다.',s.day4.choice==='table'?'바닷가 식탁에 의자를 하나 더 놓았다.':'두 사람이 나란히 바다를 걷도록 했다.',s.night5.guestChoice==='quiet'?'누군가에게 말없이 쉴 시간을 주었다.':'누군가의 처음 꺼내는 이야기를 들었다.'])paragraph(line,list);
  const j=s.journey2;
  if(j.six.ended)paragraph(j.six.choice==='public'?'반송 원본을 공개하고 드러난 이름에 대해 책임지기로 했다.':'발신인의 이름을 가리고, 배달원의 증언을 지켰다.',list);
  if(j.seven.ended)paragraph(j.seven.choice==='square'?'광장의 목소리로 지워진 주소에 답했다.':'집마다 봉함 답장을 받으며 늦은 대답을 기다렸다.',list);
  if(j.eight.ended)paragraph(j.eight.policy==='local'?'각 역에 주소를 확인할 권한을 나누었다.':'중앙과 역이 서로 확인하는 약속을 세웠다.',list);
  $('credits-eyebrow').textContent=j.eight.ended?'TWO JOURNEYS, SEVENTEEN STATIONS':'THE FIRST JOURNEY, COMPLETE';
  $('credits-description').textContent=j.eight.ended?'방울의 반납 영수증에서 시작한 길이 열일곱 노선의 수신 확인으로 이어졌습니다.':'방울 하나를 찾으러 시작한 밤이 누군가의 첫 휴가가 되었습니다.';
  $('credits').showModal();
 };
 $('close-credits').onclick=()=>$('credits').close();
 $('credits').addEventListener('close',()=>api.canvas.focus({preventScroll:true}));
 return {showJournal,dialoguePages,renderDialogue,remember,portrait,transition,prepareSaveMenu,readBackup};
};
