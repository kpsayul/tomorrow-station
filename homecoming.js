'use strict';
// The homecoming arc uses the same movement, dialogue and save UI as chapters 1–4.
window.Homecoming = (() => {
 const version=2,keys={5:'five',6:'six',7:'seven',8:'eight'};
 const titles=['기억이 머무는 역','받는 이 없는 편지','첫차가 오는 방법','약속의 다른 쪽','돌려받지 않은 물건','엄마가 되기 전의 사람','마지막 시기에 있던 우리','같이 앉아 있는 동안'];
 const roomNames=['대합실','승강장','기록실','비 오는 기억','신호실','첫차 안','물결마을 항구','작은 식탁','등대 작업실','돌아온 역의 대합실','내 물건이 있는 기록실','부모의 젊은 날 · 축제','어린 날의 집과 도림역','병원의 기억 · 대기실','병원의 기억 · 병실','현재 · 도림역','현재 · 우리 집'];
 const scenes={
  5:[['five-arrival',9,240,218,'귀환 열차','돌아온 역'],['five-guest',9,110,194,'창가의 손님','잠깐 같이 앉기'],['five-box',10,130,191,'내 보관 상자','돌려받지 않은 물건'],['five-toy',10,348,191,'장난감 열차','열차 밑에 남은 이름']],
  6:[['six-festival',11,130,199,'고리 던지기 가판대','엄마가 되기 전'],['six-photos',11,348,207,'사진을 펼친 벤치','두 사람의 꿈'],['six-house',12,130,194,'작은 방의 밥상','추웠던 집의 밤'],['six-rain',12,348,212,'비 오는 날의 벤치','그 기억의 다음 장면'],['six-phone',10,348,233,'아버지에게 전화','지금 들려주고 싶은 이야기']],
  7:[['seven-box',10,130,191,'도시락통과 교대표','함께 있던 마지막 시기'],['seven-care',13,130,202,'교대표 위의 두 이름','우리에게도 쉬는 날이 필요했다'],['seven-tv',14,348,188,'병실의 텔레비전','같이 웃었던 저녁'],['seven-tired',14,133,214,'침대 옆 의자','지쳐 있던 다른 저녁'],['seven-empty',14,133,214,'비어 있는 침대','병원을 나오는 날'],['seven-deposit',10,348,233,'이름 보관 접수표','이름을 맡기기 전의 밤'],['seven-present',10,130,191,'열린 도시락통','기억을 보고 난 뒤'],['seven-call',10,348,233,'아버지에게 전화','오늘은 집에 가려고']],
  8:[['eight-leave',9,348,194,'백지와 출발 인사','이름을 가지고 집으로'],['eight-bread',15,105,198,'역 앞 빵집','이번에는 내가 사 갈게'],['eight-bench',15,322,213,'아버지 옆자리','같이 앉아 있는 동안'],['eight-train',15,322,213,'장난감 열차 꺼내기','아버지가 아는 엄마'],['eight-dinner',16,130,195,'부엌의 식탁','조금 탄 계란말이'],['eight-photos',16,348,195,'잘 나온 사진 봉투','엄마가 골라 둔 사진'],['eight-letter',16,348,195,'어린 나에게 답장','오늘 재미있었다고'],['eight-after',16,130,240,'목요일에 온 안부','이야기가 끝난 뒤에도']]
 };
 const legalRooms={5:[9,10],6:[10,11,12],7:[10,13,14],8:[9,15,16]};
 let activeScene=null;
 function setScene(id){activeScene=id;}
 function clearScene(){const changed=activeScene!==null;activeScene=null;return changed;}
 function view(state){
  const active=(scenes[state.chapter]||[]).findIndex(s=>s[0]===activeScene&&s[1]===state.room);
  const deposit=active>=0&&activeScene==='seven-deposit';
  return {index:active>=0?active:state.homecoming.steps[keys[state.chapter]],past:deposit||[11,12,13,14].includes(state.room),place:deposit?'이름을 맡기기 전의 기록실':roomNames[state.room]};
 }
 const fresh=()=>({version:1,steps:{five:0,six:0,seven:0,eight:0},nameRecovered:false,guestChoice:null,bread:null,recapPending:false});
 function normalise(raw,choice){
  const h=fresh();h.nameRecovered=choice==='name'||raw?.nameRecovered===true;
  for(const c of [5,6,7,8])h.steps[keys[c]]=Number.isInteger(raw?.steps?.[keys[c]])?Math.max(0,Math.min(scenes[c].length,raw.steps[keys[c]])):0;
  h.guestChoice=['quiet','listen'].includes(raw?.guestChoice)?raw.guestChoice:null;
  h.bread=['cream','walnut'].includes(raw?.bread)?raw.bread:null;
  h.recapPending=raw?.recapPending===true;return h;
 }
 function read(id,state){
  const entry=window.homecomingText[id];if(!entry)throw new Error('Unknown homecoming scene: '+id);
  const result=entry[state.night2.choice==='name'?'name':'letter'];
  return result.flatMap(line=>{
   // Keep each speaker separate and split long prose at sentence boundaries.
   const match=line.match(/^([^:]+):\s*(.*)$/),cue=match?match[1]+': ':'',body=match?match[2]:line;
   const sentences=body.match(/[^.!?。]+[.!?。]+(?:[」”’])?|[^.!?。]+$/g)||[body];
   const chunks=[];let chunk='';for(const sentence of sentences){if(chunk&&(chunk+' '+sentence).length>95){chunks.push(cue+chunk);chunk='';}chunk+=(chunk?' ':'')+sentence.trim();}if(chunk)chunks.push(cue+chunk);return chunks;
  });
 }
 return {version,keys,titles,roomNames,scenes,legalRooms,fresh,normalise,read,setScene,clearScene,view};
})();

window.createHomecomingStory=function(api,minimum,maximum){
 const {speak,toast,save,objective,move,showEnding,rect,text,glow}=api;
 const S=()=>api.state(),H=()=>S().homecoming,C=()=>S().chapter;
 const index=()=>H().steps[Homecoming.keys[C()]],list=()=>Homecoming.scenes[C()];
 const inArc=()=>C()>=minimum&&C()<=maximum;
 const obstacles={
  9:[{x:73,y:177,w:76,h:21},{x:320,y:178,w:57,h:15}],
  10:[{x:94,y:174,w:72,h:15},{x:311,y:175,w:74,h:15}],
  11:[{x:80,y:137,w:90,h:34},{x:309,y:180,w:77,h:15}],
  12:[{x:91,y:166,w:78,h:15},{x:295,y:169,w:91,h:30}],
  13:[{x:92,y:184,w:75,h:15}],
  14:[{x:76,y:143,w:111,h:44},{x:322,y:139,w:57,h:33}],
  15:[{x:59,y:135,w:91,h:37},{x:282,y:184,w:80,h:15}],
  16:[{x:88,y:180,w:83,h:15},{x:309,y:180,w:77,h:15}]
 };
 const minY=Object.fromEntries([9,10,11,12,13,14,15,16].map(room=>[room,166]));
 function completed(c){if(c===5)S().night5.ended=true;else S().journey2[{6:'six',7:'seven',8:'eight'}[c]].ended=true;}
 function finishScene(i){
  if(i!==index())return;
  H().steps[Homecoming.keys[C()]]++;
  if(C()===8&&i===0)H().nameRecovered=true;
  if(C()===5&&i===1)S().night5.guestChoice=H().guestChoice;
  if(C()===8&&i===0)move(15,240,250);
  if(index()===list().length){
   completed(C());save();objective();
   const endings={5:['엄마가 웃고 있었다','장난감 열차 안에는 온이 태어나기 전의 밤이 남아 있었다.\n그 밤의 두 사람은 아직 엄마와 아빠가 아니었다.'],6:['지금도 연결되는 목소리','아버지에게 바다 사진을 보냈다.\n이제 남겨 둔 상자를 열어볼 수 있을 것 같았다.'],7:['나 기다릴 수 있어','다음 열차로 집에 간다고 말했다.\n아버지는 역으로 나오겠다고 했다.'],8:['같이 앉아 있는 동안','모든 일이 괜찮아진 것은 아니었다.\n그래도 오늘 재미있었던 일을 말할 사람이 있었다.\n\n책상 위에는 편지와 사진, 다른 색 바퀴가 달린 열차가 놓여 있었다.']};
   showEnding({eyebrow:C()===8?'END · TOGETHER AT HOME':`CHAPTER ${C()} · CONTINUED`,title:endings[C()][0],body:endings[C()][1],next:C()<8});
  }else{save();objective();}
 }
 function play(i,selected=null){
  if(i>index()){toast('먼저 '+list()[index()][5]+' 이야기를 읽어주세요.');return;}
  const id=list()[i][0];
  if(id==='five-guest'&&!H().guestChoice&&!selected){
   speak('이야기',['이야기: 창가의 손님이 접수표를 접었다 폈다 하고 있었다.'],null,[
    {text:'먼저 앉을 자리를 내어준다.',action:()=>play(i,'quiet')},
    {text:'필요한 것이 있는지 물어본다.',action:()=>play(i,'listen')}
   ]);return;
  }
  if(id==='eight-bread'&&!H().bread&&!selected){
   speak('온',['이야기: 아버지는 팥빵을 좋아한다. 나는 어떤 빵을 먹을까.'],null,[
    {text:'크림빵을 고른다.',action:()=>play(i,'cream')},
    {text:'호두빵을 고른다.',action:()=>play(i,'walnut')}
   ]);return;
  }
  let lines=Homecoming.read(id,S());
  if(id==='five-guest'&&(H().guestChoice||selected)==='listen')lines=['온: 필요한 게 있으면 말해 주세요.',...lines];
  if(id==='seven-care')lines.push(...Homecoming.read('seven-friends',S()));
  if(id==='eight-leave'&&!H().nameRecovered)lines=[...Homecoming.read('eight-name',S()),...lines];
  if(id==='eight-bread'&&(H().bread||selected)==='walnut')lines=lines.map(line=>line.replace('크림빵','호두빵'));
  if(id==='five-arrival'&&H().recapPending)lines=[
   '이야기: 가방 안에 이름 보관 접수표가 남아 있었다. 온은 어젯밤 자신이 쓴 말을 읽었다.',
   '어제의 온: 엄마가 떠난 뒤로, 엄마를 생각하면 마지막 병실부터 떠오릅니다. 오늘은 그 생각 없이 자고 싶습니다.',
   '이야기: 좋은 기억도 함께 흐려진다는 설명을 들었다는 서명. 아버지에게 이 역의 주소를 보냈다는 메모도 있었다.',
   S().night2.choice==='name'?'온: 이름을 찾으니 그때 일도 같이 돌아왔어. 그래도 지금은 집에 가 보고 싶어.':'온: 무슨 일이 있었는지는 알겠어. 기억은 조금만 더 맡겨 두자.',...lines];
  Homecoming.setScene(id);objective();
  speak('이야기',lines,()=>{
   if(i===index()){
    if(id==='five-guest')H().guestChoice=H().guestChoice||selected;
    if(id==='eight-bread')H().bread=H().bread||selected;
    if(id==='five-arrival')H().recapPending=false;
   }
   finishScene(i);
  });
 }
 function start(next=5){
  if(!inArc()&&next!==minimum)return;
  const previous=next===5?S().day4.ended:next===6?S().night5.ended:next===7?S().journey2.six.ended:S().journey2.seven.ended;
  if(C()!==next-1||!previous)return;
  S().chapter=next;move(Homecoming.scenes[next][0][1],240,250);play(0);
 }
 function exits(room){
  const link=(id,x,y,label,to)=>({id,x,y,label,radius:25,to});
  if(C()===5)return room===9?[link('hc-record-door',405,254,'기록실로',10)]:[link('hc-lobby-door',240,266,'대합실로',9)];
  if(C()===6){
   if(room===11)return [link('hc-child-door',240,266,'어린 날의 기억으로',12),link('hc-record-door',405,254,'현재 기록실로',10)];
   if(room===12)return [link('hc-festival-door',80,256,'축제의 기억으로',11),link('hc-record-door',405,254,'현재 기록실로',10)];
   return [link('hc-replay',240,255,'열차의 기억 다시 보기',11)];
  }
  if(C()===7){
   if(room===10)return [link('hc-care-door',240,266,'병원의 기억으로',13)];
   if(room===13)return [link('hc-hospital-door',405,254,'병실의 기억으로',14),link('hc-record-door',80,254,'현재 기록실로',10)];
   return [link('hc-waiting-door',80,254,'보호자 대기실로',13),link('hc-record-door',405,254,'현재 기록실로',10)];
  }
  if(room===15)return [link('hc-house-door',405,254,'아버지와 집으로',16)];
  if(room===16)return [link('hc-dorim-door',80,256,'도림역 둘러보기',15)];
  return [];
 }
 function roomEntities(room){
  if(!inArc())return [];
  const spots=new Map();
  list().forEach((scene,i)=>{if(scene[1]!==room)return;const key=`${scene[2]},${scene[3]}`;const prev=spots.get(key);if(!prev||i<=index())spots.set(key,{id:'hc-scene-'+i,x:scene[2],y:scene[3],label:scene[4],radius:29});});
  return [...spots.values(),...exits(room),{id:'hc-cat',x:250,y:244,label:'후추',radius:23}];
 }
 function handle(id){
  if(!inArc())return false;
  if(id.startsWith('hc-scene-')){
   const i=Number(id.slice(9)),scene=list()[i];
   if(Number.isInteger(i)&&scene){
    const replays=list().map((s,n)=>({s,n})).filter(({s,n})=>n<index()&&s[1]===scene[1]&&s[2]===scene[2]&&s[3]===scene[3]);
    if(i<index()&&replays.length>1)speak('다시 읽기',['이야기: 어떤 장면을 다시 볼까요?'],null,replays.map(({s,n})=>({text:s[5],action:()=>play(n)})));
    else play(i);
   }
   return true;
  }
  const exit=exits(S().room).find(e=>e.id===id);
  if(exit){if(C()===8&&exit.to===16&&index()<4){speak('재문',['재문: 조금만 더 앉았다 가자. 네가 가져온 것도 보고.']);return true;}move(exit.to,240,249);return true;}
  if(id==='hc-cat'){speak('후추',[index()===list().length?'후추: 조금 더 있어도 되지?':'후추: 여기 있을게. 천천히 봐.']);return true;}
  return false;
 }
 function task(){
  if(index()===list().length)return {step:C()===8?'이야기 끝':'다음 장',title:C()===8?'같이 앉아 있는 동안':Homecoming.titles[C()],detail:C()===8?'집의 사진과 답장, 목요일의 안부를 다시 읽을 수 있어요. 메모의 읽은 이야기에도 여정이 남습니다.':'다음 이야기 버튼으로 이어가세요. 읽은 장면은 가까이 가서 다시 살펴볼 수 있어요.'};
  const scene=list()[index()];let id='hc-scene-'+index(),detail=scene[4]+' 가까이 가서 살펴보세요.';
  if(S().room!==scene[1]){
   const direct=exits(S().room).find(e=>e.to===scene[1]);
   const via=direct||exits(S().room).find(e=>C()===6?e.to===11:C()===7?e.to===13:e.to===16)||exits(S().room)[0];
   if(via){id=via.id;detail=via.label+'로 이동하세요.';}
  }
  return {step:`${index()+1} / ${list().length}`,title:scene[5],detail,id,room:scene[1]};
 }
 function journal(){return [`제${C()}장 · ${Homecoming.titles[C()-1]}`,task().detail,S().night2.choice==='name'?'2장에서 이름을 돌려받았다. 좋은 날과 마지막 시기의 기억이 함께 돌아왔다.':H().nameRecovered?'이름을 잠시 맡긴 뒤, 집으로 떠나기 전에 돌려받았다.':'이름은 아직 맡겨 두었다. 물건에 남은 장면을 통해 내 이야기를 알아가는 중이다.',...list().slice(0,index()).map(scene=>'읽은 장면 · '+scene[5])];}
 function worker(x,y,coat,hair='#51464a',old=false){rect(x-8,y+1,18,4,'#182a3444');rect(x-6,y-19,13,19,coat);rect(x-5,y-30,11,12,'#dab89c');rect(x-7,y-33,15,7,old?'#89918b':hair);rect(x+2,y-24,1,2,'#34404a');rect(x-5,y,4,7,'#38434c');rect(x+3,y,4,7,'#38434c');}
 function table(x,y,w=54){rect(x-w/2,y-10,w,15,'#a98764');rect(x-w/2+4,y+5,4,12,'#5f4f46');rect(x+w/2-8,y+5,4,12,'#5f4f46');}
 function toy(x,y){rect(x,y,20,9,'#ceaa5d');rect(x+2,y-5,10,5,'#b27663');rect(x+2,y+9,4,4,'#786b5b');rect(x+14,y+9,4,4,'#a5bba7');}
 function draw(room){
  const sceneView=Homecoming.view(S()),sceneIndex=sceneView.index,past=sceneView.past,warm=room===16||room===11;
  rect(0,0,480,288,warm?'#4b4548':past?'#44515a':'#273e4a');rect(20,155,440,123,warm?'#887761':'#63716f');
  for(let y=171;y<278;y+=23)rect(20,y,440,1,warm?'#b09a752c':'#9fb3a226');
  for(const x of [45,205,365]){rect(x,73,70,60,past?'#293d50':'#486777');rect(x+3,76,64,3,'#a4b5aa');rect(x+33,76,3,54,'#a9b0a2');rect(x,132,70,5,'#b3a482');}
  text(sceneView.place,240,49,'#e9e0c6',8,'center');
  text(past?'물건에 남은 기억':C()===8&&sceneIndex>=7?'다음 목요일':'현재',240,65,'#cbd7c5',6,'center');
  if(room===9){rect(73,177,76,13,'#a78968');rect(73,194,76,4,'#68544a');worker(109,185,'#9e8fa0');table(348,188,57);worker(348,170,'#8ba795');rect(52,96,29,50,'#a96660');text('03',66,123,'#e4d1a2',7,'center');}
  if(room===10){table(130,184,72);rect(104,165,50,20,'#9e856b');rect(111,169,21,7,'#d8c7a3');rect(137,166,13,17,'#cecfbd');table(348,185,73);toy(337,169);rect(335,217,26,12,'#759794');for(let x=165;x<320;x+=45){rect(x,83,32,58,'#7b7468');for(let y=92;y<136;y+=16)rect(x+4,y,24,8,'#bcb291');}}
  if(room===11){for(let x=30;x<460;x+=32){rect(x,86,2,15,'#907e6a');rect(x-4,98,10,9,'#e3c67e');}rect(84,142,82,29,'#a4716d');rect(80,137,90,9,'#d6af85');toy(119,151);worker(104,185,'#899a8a');worker(155,185,'#b58b73');table(348,190,77);rect(322,177,19,11,'#e9d9b8');rect(347,179,19,11,'#dfd1b5');}
  if(room===12){if(sceneIndex<=2){table(130,176,78);toy(117,160);worker(99,165,'#8d9b89');worker(163,163,'#b18b77');rect(295,169,91,39,'#869e9c');rect(301,172,26,11,'#d5ceaf');worker(328,199,'#b39b7b');}else{rect(46,136,388,6,'#c5b38a');rect(314,185,69,13,'#9b7e5f');worker(320,189,'#88998a');worker(342,195,'#b79975');worker(368,189,'#b58b76');for(let x=35;x<455;x+=21)rect(x,102+(x%13),1,15,'#a4c1c760');}}
  if(room===13){rect(80,163,99,18,'#9aaea5');table(130,194,75);rect(110,179,34,14,'#ddd4b5');worker(95,178,'#909d94',undefined,true);worker(174,188,'#b8977a');}
  if(room===14){rect(76,143,111,44,'#9fb4ae');rect(81,148,102,28,'#d5d7c6');rect(83,148,26,13,'#f0e6ce');rect(75,139,5,55,'#718b8c');if(sceneIndex<4)worker(119,168,'#c0b9a6');rect(322,139,57,33,'#263b49');rect(327,144,47,23,sceneIndex===2?'#a59c75':'#647d82');rect(336,173,29,4,'#384e56');table(133,218,24);}
  if(room===15){rect(59,135,91,37,'#b99670');rect(54,128,101,9,'#b57869');text('빵',105,152,'#f5e1b7',9,'center');for(let x=73;x<145;x+=21)rect(x,162,13,7,'#dbb078');rect(282,184,80,15,'#9e8564');worker(322,190,'#8c9a8e',undefined,true);rect(381,101,41,47,'#7b9898');for(let y=107;y<147;y+=11)rect(386,y,31,8,'#a2b4a7');}
  if(room===16){table(130,190,83);rect(110,174,14,9,'#dacbaf');rect(140,174,14,9,'#dacbaf');worker(91,179,'#8f9f8d',undefined,true);table(348,190,77);rect(327,173,21,14,'#ead9b7');toy(352,173);rect(326,96,30,31,'#ac9474');rect(331,100,20,23,'#7c9b93');rect(91,232,76,13,'#a28c72');rect(130,233,17,9,'#819e92');glow(240,102,93,'#f2dca119');}
  const catX=250,catY=244;rect(catX-8,catY-8,18,9,'#c8d3bc');rect(catX+4,catY-15,9,11,'#d7dec7');rect(catX+4,catY-18,3,5,'#d7dec7');rect(catX+10,catY-18,3,5,'#d7dec7');
  for(const exit of exits(room)){rect(exit.x-18,exit.y+6,36,3,'#bcc5a4');text(exit.label,exit.x,exit.y-8,'#e6e8cd',6,'center');}
 }
 return {start,handle,task,journal,roomEntities,obstacles,minY,draw,drawScene:draw,drawOffice:()=>draw(9),drawGarden:()=>draw(10),lobbyExtras(){},platformExtras(){},normaliseRoute:()=>[]};
};
