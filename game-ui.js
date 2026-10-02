'use strict';
window.createGameComfort=function(api){
 const $=id=>document.getElementById(id),backupKey='tomorrow-station-v1-before-import';
 const roomNames=Homecoming.roomNames;
 const maps={1:[[0,1]],2:[[0,1],[0,2],[2,3]],3:[[0,1],[0,2],[2,3],[1,4],[1,5]],4:[[6,7],[6,8]],5:[[9,10]],6:[[10,11],[11,12],[12,10]],7:[[10,13],[13,14],[14,10]],8:[[9,15],[15,16]]};
 const chapterTitles=Homecoming.titles;
 let notes=[],tab='notes',historyChapter='all',pendingImport=null,importGeneration=0;
 function paragraph(value,container=$('journal-content')){const p=document.createElement('p');p.textContent=value;container.append(p);return p;}
 function renderJournal(){
  const container=$('journal-content');container.replaceChildren();
  $('journal').classList.toggle('reading-book',tab==='history');
  for(const button of document.querySelectorAll('[data-journal-tab]'))button.setAttribute('aria-pressed',String(button.dataset.journalTab===tab));
  if(tab==='notes'){for(const note of notes)paragraph(note);return;}
  if(tab==='history'){
   const history=api.state().history||[];
   if(!history.length){paragraph('아직 읽은 이야기가 없어요. 앞으로 읽는 장면이 순서대로 남아요.');return;}
   const chapters=[...new Set(history.map(entry=>entry.chapter))].sort((a,b)=>a-b);
   if(historyChapter!=='all'&&!chapters.includes(Number(historyChapter)))historyChapter='all';
   const label=document.createElement('label'),select=document.createElement('select');label.className='book-chapter-picker';label.textContent='다시 읽을 장';select.id='book-chapter';
   for(const value of ['all',...chapters]){const option=document.createElement('option');option.value=String(value);option.textContent=value==='all'?'읽은 이야기 전체':`제${value}장 · ${chapterTitles[value-1]}`;select.append(option);}
   select.value=historyChapter;select.onchange=()=>{historyChapter=select.value;renderJournal();$('book-chapter').focus();};label.append(select);container.append(label);
   for(const chapter of chapters){
    if(historyChapter!=='all'&&Number(historyChapter)!==chapter)continue;
    const heading=document.createElement('h3');heading.className='book-chapter-title';heading.textContent=`제${chapter}장 · ${chapterTitles[chapter-1]}`;container.append(heading);
    for(const entry of history.filter(entry=>entry.chapter===chapter)){const row=document.createElement('article');row.className='history-entry';const speaker=document.createElement('strong'),line=document.createElement('p');speaker.textContent=entry.speaker;line.textContent=entry.text;row.append(speaker,line);container.append(row);}
   }
   return;
  }
  paragraph(`지금 있는 곳: ${roomNames[api.state().room]}`);
  const summary=paragraph('현재 이야기에서 이어진 길이에요. 출입구 안으로 걸어가면 다음 공간으로 이동해요. 기억 재생기 같은 장치는 대화·조사로 작동시켜요.');summary.className='map-description';
  for(const [from,to] of maps[api.state().chapter]){const row=document.createElement('div');row.className='map-connection';for(const id of [from,to]){const node=document.createElement('span');node.textContent=roomNames[id];node.className='map-place';if(id===api.state().room){node.classList.add('current');node.setAttribute('aria-current','location');}row.append(node);if(id===from){const arrow=document.createElement('span');arrow.textContent='↔';arrow.setAttribute('aria-hidden','true');row.append(arrow);}}container.append(row);}
  paragraph(api.currentTask().detail);
 }
 for(const button of document.querySelectorAll('[data-journal-tab]'))button.onclick=()=>{tab=button.dataset.journalTab;renderJournal();};
 function showJournal(currentNotes){notes=currentNotes;tab='notes';renderJournal();$('journal').showModal();}
 // Only authored speaker cues change the speaker. Quoted names and stage
 // directions must never be used to guess who is speaking.
 function dialoguePage(defaultSpeaker,line){
  const state=api.state(),player=state.night2.remembered||state.chapter>=3?'온 · 주인공':'당신 · 주인공';
  const names={'수진':'수진 · 어머니','재문':'재문 · 아버지','과거의 온':'온 · 지난 기억','당신':player,'온':player,'속마음':player+' · 속마음','나루의 편지':'나루 · 편지','당신의 답장':player+' · 답장','당신의 기록':player+' · 기록','당신의 엽서':player+' · 엽서','어제의 온':'온 · 어제의 메모','어린 온의 편지':'어린 온 · 편지','당신의 안내 방송':player+' · 안내 방송'};
  const label=name=>names[name]||name;
  const cue=/^(당신의 답장|당신의 기록|당신의 엽서|어린 온의 편지|나루의 편지|어제의 온|과거의 온|수진|재문|어린 온|우산을 쓴 아이|아이|당신|온|여울|나루|후추|고양이|03호|백지|모래|이음|서린|결|연|담|손님|이야기|속마음):\s*(.*)$/;
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
  $('speaker').textContent=page.speaker;portrait(page.portrait);$('line').replaceChildren();$('line').scrollTop=0;
  $('speaker').dataset.chapter=`제${api.state().chapter}장 · ${chapterTitles[api.state().chapter-1]}`;
  if(!page.turns){$('line').textContent=page.text;return;}
  for(const turn of page.turns){
   const block=document.createElement('span');block.className=turn.narration?'dialogue-narration':turn.speaker.includes('속마음')?'dialogue-turn dialogue-thought':'dialogue-turn';
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
 // Keep a whole playthrough while leaving room in the 512 KB save-file envelope.
 function trimHistory(history){let characters=0,start=history.length;while(start>0&&history.length-start<1200){const entry=history[start-1],size=entry.speaker.length+entry.text.length;if(characters+size>100000)break;characters+=size;start--;}if(start)history.splice(0,start);return history;}
 function remember(dialogue,page){if(dialogue.index<=(dialogue.recorded??-1))return;dialogue.recorded=dialogue.index;const history=api.state().history;history.push({speaker:page.speaker,text:page.text,chapter:api.state().chapter});trimHistory(history);}
 function portrait(speaker){
  const ctx=$('portrait').getContext('2d'),r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};ctx.clearRect(0,0,32,32);r(0,0,32,32,'#29414c');
  if(speaker.includes('주인공')||speaker.includes('지난 기억')){r(8,23,17,9,'#c49b75');r(10,8,14,16,'#d7b99e');r(8,5,18,7,'#303643');r(8,10,4,8,'#303643');r(14,16,2,3,'#37434b');r(22,16,2,3,'#37434b');r(17,21,4,1,'#b08174');r(7,24,20,4,'#b55b5b');r(8,27,5,5,'#b55b5b');return;}
  if(/후추|고양이/.test(speaker)){r(7,12,19,14,'#d4d6b8');r(7,7,5,8,'#d4d6b8');r(21,7,5,8,'#d4d6b8');r(11,18,2,3,'#32434f');r(21,18,2,3,'#32434f');r(16,22,3,2,'#bc8d80');return;}
  if(/03호|자판기/.test(speaker)){r(6,4,21,26,'#a46b61');r(9,7,15,13,'#86aba4');r(11,11,3,3,'#324650');r(19,11,3,3,'#324650');r(10,24,13,3,'#2a424d');r(23,21,2,2,'#dfc590');return;}
  if(!/수진|재문|연|여울|백지|검표원|나루|모래|손님|당신|아이|이음|서린|배달원 결|우편소 · 결/.test(speaker)){r(9,7,15,21,'#c3c5a6');r(12,12,9,2,'#708d85');r(12,17,9,2,'#708d85');r(12,22,6,2,'#708d85');return;}
  const keeper=/여울|백지|검표원/.test(speaker),guest=/손님/.test(speaker);r(7,24,19,8,keeper?'#8fa79b':guest?'#9b85a2':/나루|배달원 결|우편소 · 결/.test(speaker)?'#76a1a8':/서린/.test(speaker)?'#7f95a4':/이음/.test(speaker)?'#ae8166':'#c49b75');r(9,8,15,17,'#d7b99e');r(7,5,19,7,keeper?'#506e75':'#534a50');r(7,10,4,8,keeper?'#a0aca1':'#534a50');r(13,16,2,3,'#37434b');r(22,16,2,3,'#37434b');r(17,22,4,1,'#b08174');if(keeper)r(5,10,23,3,'#c2c6a2');
 }
 function transition(){const scene=$('scene-stage');for(const animation of scene.getAnimations())animation.cancel();if(document.body.classList.contains('native-app')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;scene.animate([{opacity:.45},{opacity:1}],{duration:220,easing:'ease-out'});}
 function readBackup(){try{return api.normaliseSave(JSON.parse(localStorage.getItem(backupKey)));}catch{return null;}}
 function prepareSaveMenu(){importGeneration++;pendingImport=null;$('import-preview').hidden=true;$('import-status').textContent='파일을 다른 기기로 옮긴 뒤 가져오면 이어서 할 수 있어요.';$('import-file').value='';$('export-save').disabled=!api.active()&&!api.readSave();}
 $('export-save').onclick=async()=>{
  const snapshot=api.active()?api.state():api.readSave();if(!snapshot)return;
  const savedAt=new Date().toISOString(),payload={format:'tomorrow-station',version:1,savedAt,state:snapshot};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),filename=`tomorrow-station-${savedAt.slice(0,19).replaceAll(':','-')}.json`;
  if(window.tomorrowNative){
   $('export-save').disabled=true;
   try{const saved=await window.tomorrowNative.saveFile(blob,filename);$('import-status').textContent=saved?'선택한 위치에 저장 파일을 내보냈어요.':'저장 파일 내보내기를 취소했어요.';}
   catch{$('import-status').textContent='파일을 내보내지 못했어요. 저장 위치를 다시 선택해주세요.';}
   finally{$('export-save').disabled=false;}
   return;
  }
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
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
  const s=api.state();for(const line of [s.choice==='carry'?'여울은 방울을 가지고 길을 나섰다.':'여울은 돌아올 문에 방울을 걸었다.',s.night2.choice==='name'?'2장에서 이름과 함께 기억을 돌려받았다.':'2장에서는 편지를 챙기고, 기억은 조금 더 맡겨 두었다.',s.night3.choice==='rest'?'역에는 쉬어갈 자리가 남았다.':'역에는 함께 다음으로 갈 자리가 생겼다.',s.day4.choice==='table'?'바닷가 식탁에 의자를 하나 더 놓았다.':'두 사람이 나란히 바다를 걷도록 했다.',s.night5.guestChoice==='quiet'?'누군가에게 말없이 쉴 시간을 주었다.':'창가의 손님에게 필요한 것이 있는지 물었다.'])paragraph(line,list);
  if(s.homecoming.steps.six>0)paragraph('엄마와 아빠가 되기 전 두 사람의 시간을 보았다.',list);
  if(s.homecoming.steps.seven>0)paragraph('함께 웃기도, 지쳐서 다투기도 했던 날들을 다시 보았다.',list);
  if(s.journey2.eight.ended)paragraph(s.night2.choice==='name'?'돌려받은 기억을 가지고 아버지와 다시 앉았다.':'잠시 맡겼던 이름을 돌려받고 아버지에게 돌아왔다.',list);
  $('credits-eyebrow').textContent=s.journey2.eight.ended?'TOGETHER AT HOME':'OUR JOURNEY';
  $('credits-description').textContent=s.journey2.eight.ended?'어린 자신에게 답장을 쓰고, 아버지와 함께 사진을 펼쳤습니다.':'방울 하나에서 시작한 여행이 함께 앉아 있을 집으로 이어집니다.';
  $('credits').showModal();
 };
 $('close-credits').onclick=()=>$('credits').close();
 $('credits').addEventListener('close',()=>api.canvas.focus({preventScroll:true}));
 return {showJournal,dialoguePages,renderDialogue,remember,trimHistory,portrait,transition,prepareSaveMenu,readBackup};
};
