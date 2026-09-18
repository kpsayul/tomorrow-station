'use strict';
(() => {
const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');
const W=480,H=288,SAVE='tomorrow-station-v1',WALK_SPEED=96,RUN_SPEED=180;
const surface=document.createElement('canvas');surface.width=W;surface.height=H;
const g=surface.getContext('2d');ctx.imageSmoothingEnabled=false;
const freshNight2=()=>({met:false,clues:[],sequence:[],tuned:false,remembered:false,catName:false,answer:null,choice:null,ended:false});
const freshNight3=()=>({board:false,witnesses:[],inspector:false,signals:[null,null,null],signalDone:false,announced:false,choice:null,ended:false});
const freshDay4=()=>({notice:false,letter:false,met:false,mirrors:[0,0,1],lit:false,choice:null,reunited:false,photos:[],ended:false});
const freshNight5=()=>({met:false,guestChoice:null,cup:false,served:false,route:[],ticket:false,ready:false,watered:false,ended:false});
const fresh=()=>({x:240,y:224,room:0,met:false,ticket:false,cat:false,bell:false,choice:null,ended:false,chapter:1,night2:freshNight2(),night3:freshNight3(),day4:freshDay4(),night5:freshNight5(),history:[]});
let state=fresh(), active=false, conversation=null, keys=new Set(), time=0,last=0,toastTimer;
let audio=null,sound=false,musicTimer=null,noteIndex=0;
let runToggle=false,saveMenuMode='save',saveFailed=false;
const entities=[
 [{id:'keeper',x:348,y:150,label:'역무원',radius:29},{id:'machine',x:91,y:143,label:'자판기',radius:28},{id:'board',x:218,y:138,label:'안내판',radius:25},{id:'plant',x:424,y:147,label:'화분',radius:24},{id:'door',x:240,y:263,label:'승강장으로',radius:24}],
 [{id:'cat',x:348,y:176,label:'고양이',radius:27},{id:'bench',x:123,y:188,label:'오래된 벤치',radius:31},{id:'clock',x:235,y:175,label:'멈춘 시계',radius:25},{id:'return',x:240,y:264,label:'대합실로',radius:24}]
];
const secondNight=createSecondNight({state:()=>state,baseEntities:entities,speak,toast,tone,save,objective,move,showEnding,rect,text,glow,person,g});
const thirdNight=createThirdNight({state:()=>state,previousEntities:secondNight.roomEntities,speak,toast,tone,save,objective,move,showEnding,rect,text,glow,g});
const fourthDay=createFourthDay({state:()=>state,speak,toast,tone,save,objective,move,showEnding,rect,text,glow,person});
const fifthStory=createFifthStory({state:()=>state,speak,toast,tone,save,objective,move,showEnding,rect,text,glow,person});
const comfort=createGameComfort({state:()=>state,active:()=>active,readSave,normaliseSave,restore,saveSummary,formatSavedAt,currentTask,keys,canvas});
const sharing=createGameSharing({state:()=>state,keys,canvas});
function roomEntities(){return state.chapter===5?fifthStory.roomEntities(state.room):state.chapter===4?fourthDay.roomEntities(state.room):state.chapter===3?thirdNight.roomEntities(state.room):secondNight.roomEntities(state.room);}
function move(room,x=240,y=230){state.room=room;state.x=x;state.y=y;keys.clear();objective();save();comfort.transition();tone(293,.7);}
function stationTime(){return state.chapter===5?(state.night5.ended?'18:05':'17:00'):state.chapter===4?(state.day4.ended?'09:12':state.day4.lit?'08:40':'08:07'):state.chapter===3?(state.night3.ended?'06:12':state.night3.announced?'05:59':'00:10'):state.night2.ended?'00:09':state.ended?'00:08':'00:07';}
function nextChapter(){return state.chapter===1&&state.ended?2:state.chapter===2&&state.night2.ended?3:state.chapter===3&&state.night3.ended?4:state.chapter===4&&state.day4.ended?5:null;}
function nextChapterLabel(){return nextChapter()===5?'마지막 이야기 시작 →':nextChapter()===4?'바닷가 이야기 시작 →':nextChapter()===3?'세 번째 밤 시작 →':'두 번째 밤 시작 →';}
function floorY(room){return room===10?161:fourthDay.minY[room]??(room===1?173:138);}
function save(){try{localStorage.setItem(SAVE,JSON.stringify({...state,savedAt:new Date().toISOString()}));saveFailed=false;$('save-status').textContent='자동 저장됨 · '+new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});return true;}catch{$('save-status').textContent='자동 저장 실패 · 저장 메뉴에서 파일로 내보낼 수 있어요';if(!saveFailed)toast('자동 저장하지 못했어요. 저장 메뉴에서 진행을 파일로 보관해주세요.');saveFailed=true;return false;}}
function normaliseSave(s){if(s&&typeof s==='object'&&[0,1,2,3,4,5,6,7,8,9,10].includes(s.room)&&Number.isFinite(s.x)&&Number.isFinite(s.y)){
 const n={...freshNight2(),...s.night2};n.clues=Array.isArray(n.clues)?[...new Set(n.clues.filter(id=>['rain','whistle','train'].includes(id)))]:[];
 n.sequence=Array.isArray(n.sequence)&&n.sequence.length<3?[...new Set(n.sequence.filter(id=>['rain','whistle','train'].includes(id)))]:[];
 const p={...freshNight3(),...s.night3};p.witnesses=Array.isArray(p.witnesses)?[...new Set(p.witnesses.filter(id=>['keeper','machine','cat'].includes(id)))]:[];
 p.signals=Array.from({length:3},(_,i)=>Array.isArray(p.signals)&&['store','wait','go'].includes(p.signals[i])?p.signals[i]:null);
 const d={...freshDay4(),...s.day4};d.photos=Array.isArray(d.photos)?[...new Set(d.photos.filter(id=>['sea','meal','light'].includes(id)))]:[];
 d.mirrors=Array.from({length:3},(_,i)=>Array.isArray(d.mirrors)&&[0,1].includes(d.mirrors[i])?d.mirrors[i]:freshDay4().mirrors[i]);
 const f={...freshNight5(),...s.night5};f.route=fifthStory.normaliseRoute(f.route);f.guestChoice=['quiet','listen'].includes(f.guestChoice)?f.guestChoice:null;
 const chapter=[2,3,4,5].includes(s.chapter)?s.chapter:1,room=chapter===5?([0,1,9,10].includes(s.room)?s.room:0):chapter===4?([6,7,8].includes(s.room)?s.room:6):Math.min(s.room,chapter===1?1:chapter===2?3:5);
 const history=Array.isArray(s.history)?s.history.filter(e=>e&&typeof e.speaker==='string'&&typeof e.text==='string').slice(-80).map(e=>({speaker:e.speaker.slice(0,100),text:e.text.slice(0,2000),chapter:[1,2,3,4,5].includes(e.chapter)?e.chapter:chapter})):[];
 for(const [obj,defaults] of [[n,freshNight2()],[p,freshNight3()],[d,freshDay4()],[f,freshNight5()]])for(const key of Object.keys(defaults))if(typeof defaults[key]==='boolean')obj[key]=obj[key]===true;
 return {...fresh(),...s,chapter,room,night2:n,night3:p,day4:d,night5:f,history,x:Math.max(29,Math.min(449,s.x)),y:Math.max(floorY(room),Math.min(270,s.y))};
}return null;}
function readSave(){try{return normaliseSave(JSON.parse(localStorage.getItem(SAVE)));}catch{return null;}}
if(readSave())$('continue').hidden=false;
function modalOpen(){return $('journal').open||$('save-menu').open||$('credits').open||$('share-menu').open;}
function running(){return runToggle||keys.has('shift');}
function updateRunButton(){const button=$('run-toggle');button.setAttribute('aria-pressed',String(runToggle));button.firstChild.textContent=`달리기 ${runToggle?'ON':'OFF'} `;}
$('run-toggle').onclick=()=>{runToggle=!runToggle;updateRunButton();canvas.focus({preventScroll:true});};
function slotKey(index){return `${SAVE}-slot-${index}`;}
function readSlot(index){try{const entry=JSON.parse(localStorage.getItem(slotKey(index)));const snapshot=normaliseSave(entry?.state);return snapshot?{...entry,state:snapshot}:null;}catch{return null;}}
function saveSummary(snapshot){
 const places=['대합실','승강장','기록실','비 오는 기억','신호실','첫차 안','물결마을 항구','작은 식탁','등대 작업실','당직실','옥상 정원'];let progress;
 if(snapshot.chapter===5){const n=snapshot.night5;progress=n.ended?'첫 번째 여정 완료':n.ready?'백지 배웅하기':n.ticket?'백지의 승차권':n.served?'환승 시간표':n.guestChoice?'따뜻한 물 한 잔':'처음 온 손님';}
 else if(snapshot.chapter===4){const n=snapshot.day4;progress=n.ended?'바닷가 이야기 완료':n.reunited?'03호에게 엽서 보내기':n.lit?'여울과 나루의 이야기':n.met?'등대 빛길 퍼즐':n.letter?'나루를 만나러':n.notice?'반송된 편지':'마을에 도착';}
 else if(snapshot.chapter===3){const n=snapshot.night3;progress=n.ended?'첫 번째 아침':n.announced?'첫차에 오르기':n.signalDone?'새 안내 방송':n.inspector?`신호 연결 ${n.signals.filter(Boolean).length} / 3`:n.board?`다음 이야기 ${n.witnesses.length} / 3`:'사라진 역 이름';}
 else if(snapshot.chapter===2){const n=snapshot.night2;progress=n.ended?'두 번째 밤 완료':n.catName?'편지의 받는 사람':n.remembered?'고양이의 이름':n.tuned?'기억 속의 아이':n.met?`소리 단서 ${n.clues.length} / 3`:'새로 도착한 편지';}
 else progress=snapshot.ended?'첫 번째 밤 완료':snapshot.bell?'방울을 찾은 뒤':snapshot.cat?'벤치의 단서':snapshot.ticket?'내일행 표를 받은 뒤':snapshot.met?'역무원의 부탁':'첫 만남 전';
 return `${['첫 번째 밤','두 번째 밤','세 번째 밤','바닷가 이야기','마지막 이야기'][snapshot.chapter-1]} · ${places[snapshot.room]} · ${progress}`;
}
function formatSavedAt(value){const date=new Date(value);return Number.isNaN(date.getTime())?'이전 버전의 저장':date.toLocaleString('ko-KR',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});}
function storeSlot(index){
 try{localStorage.setItem(slotKey(index),JSON.stringify({version:1,savedAt:new Date().toISOString(),state}));}
 catch{$('save-menu-description').textContent='저장하지 못했어요. 브라우저의 저장 공간 설정을 확인하고 다시 시도해주세요.';return;}
 $('save-status').textContent=`저장 ${index} 완료 · ${formatSavedAt(new Date())}`;$('save-menu').close();toast(`저장 ${index}에 지금까지의 여정을 담았습니다.`);tone(523,.25);
}
function restore(snapshot,label){
 window.tomorrowMetrics?.track('game_resume',{chapter:snapshot.chapter});
 state=snapshot;active=true;keys.clear();$('start').hidden=true;$('ending').hidden=true;
 if($('journal').open)$('journal').close();if($('save-menu').open)$('save-menu').close();if($('credits').open)$('credits').close();if($('share-menu').open)$('share-menu').close();
 closeDialogue();objective();if(save()){$('save-status').textContent=`${label} 불러옴`;toast(`${label}에서 이어갑니다.`);}canvas.focus({preventScroll:true});
}
function renderSaveMenu(){
 $('save-slots').replaceChildren();
 function card(title,entry,action,empty=false){
  const row=document.createElement('section');row.className='save-slot';
  const info=document.createElement('div'),name=document.createElement('strong'),details=document.createElement('p'),date=document.createElement('small');
  name.textContent=title;details.textContent=entry?saveSummary(entry.state):'아직 저장된 여정이 없어요';date.textContent=entry?formatSavedAt(entry.savedAt||entry.state.savedAt):'비어 있음';
  info.append(name,details,date);const button=document.createElement('button');button.className='slot-action';button.textContent=action.label;button.disabled=empty;button.onclick=action.run;
  row.append(info,button);$('save-slots').append(row);
 }
 for(let index=1;index<=3;index++){
  const entry=readSlot(index);
  card(`저장 ${index}`,entry,{label:saveMenuMode==='save'?(entry?'덮어쓰기':'여기에 저장'):'불러오기',run:()=>{
   if(saveMenuMode==='save')storeSlot(index);else {const latest=readSlot(index);if(latest)restore(latest.state,`저장 ${index}`);else{renderSaveMenu();$('save-menu-description').textContent='이 저장을 읽을 수 없어요. 다른 저장을 선택해주세요.';}}
  }},saveMenuMode==='load'&&!entry);
 }
 if(saveMenuMode==='load'){
  const auto=readSave();card('자동 저장',auto?{state:auto,savedAt:auto.savedAt}:null,{label:'불러오기',run:()=>{const latest=readSave();if(latest)restore(latest,'자동 저장');else renderSaveMenu();}},!auto);
  const backup=comfort.readBackup();if(backup)card('파일 가져오기 전 진행',{state:backup,savedAt:backup.savedAt},{label:'복구하기',run:()=>{const latest=comfort.readBackup();if(latest)restore(latest,'가져오기 전 진행');}});
 }
}
function openSaveMenu(mode){
 if(mode==='save'&&!active)return;
 keys.clear();saveMenuMode=mode;$('save-menu-title').textContent=mode==='save'?'이 순간 저장하기':'어디서 이어갈까요?';
 $('save-menu-description').textContent=mode==='save'?'저장할 칸을 골라주세요. 덮어쓰기를 누르면 그 칸의 기록이 바뀝니다.':'선택한 시점으로 돌아갑니다. 지금 진행을 남기려면 먼저 저장해주세요.';
 renderSaveMenu();comfort.prepareSaveMenu();$('save-menu').showModal();
}
$('save-button').onclick=()=>openSaveMenu('save');$('load-button').onclick=()=>openSaveMenu('load');
$('close-save-menu').onclick=()=>$('save-menu').close();
$('save-menu').addEventListener('close',()=>{keys.clear();if(active)canvas.focus({preventScroll:true});});
function currentTask(){
 if(state.chapter===5)return fifthStory.task();
 if(nextChapter()===5)return {step:'마지막 이야기',title:'문을 닫는 사람 · 역으로',detail:'백지의 휴가 신청서에 아직 빈칸이 남았어요. 「마지막 이야기 시작」을 눌러 우리 역으로 돌아가세요.'};
 if(state.chapter===4)return fourthDay.task();
 if(nextChapter()===4)return {step:'다음 이야기',title:'약속의 다른 쪽 · 바닷가로',detail:'첫차가 물결마을에 도착해요. 「바닷가 이야기 시작」을 누르면 여울의 약속을 따라갈 수 있어요. 열차 안을 더 둘러봐도 괜찮아요.'};
 if(state.chapter===3)return thirdNight.task();
 if(nextChapter()===3)return {step:'다음 밤',title:'세 번째 밤 · 첫차가 오는 방법',detail:'분실물 표에 내일역의 이름이 적혔어요. 「세 번째 밤 시작」을 눌러 이야기를 이어가세요.'};
 if(state.chapter===2)return secondNight.task();
 if(state.ended)return {step:'다음 밤',title:'두 번째 밤 · 받는 이 없는 편지',detail:'역에 새 편지가 도착했어요. 「두 번째 밤 시작」을 눌러 이어서 만나보세요.'};
 const stage=!state.met?0:!state.ticket?1:!state.cat?2:!state.bell?3:4;
 const tasks=[
  {id:'keeper',room:0,title:'역무원에게 말 걸기',detail:'대합실 오른쪽 위 안내 데스크 앞으로 가세요. 아래쪽 벤치는 옆으로 돌아가면 돼요.'},
  {id:'machine',room:0,title:'자판기에서 단서 찾기',detail:'대합실 왼쪽 빨간 자판기 앞으로 가세요.'},
  {id:'cat',room:1,title:'고양이에게 표 보여주기',detail:'승강장 오른쪽의 하얀 고양이에게 말을 걸면 표를 자동으로 보여줘요.'},
  {id:'bench',room:1,title:'벤치 아래 조사하기',detail:'승강장 왼쪽 나무 벤치 앞에서 조사해보세요.'},
  {id:'keeper',room:0,title:'역무원에게 방울 돌려주기',detail:'대합실 오른쪽 위 역무원에게 말을 걸어주세요.'}
 ];
 const task={...tasks[stage],step:`0${stage+1} / 05`};
 if(state.room!==task.room){task.id=state.room?'return':'door';task.detail=`화면 맨 아래 중앙의 출구로 가서 E 또는 Enter를 눌러 ${task.room?'승강장':'대합실'}으로 이동하세요.`;}
 return task;
}
function objective(){
 const task=currentTask(),station=state.chapter>=3?thirdNight.stationName():'내일역';$('location').textContent=`${state.room===3?'오래전':stationTime()} · ${[`${station} 대합실`,'2번 승강장','잊힌 소리 기록실','비가 내리던 역','신호실','첫차 안','물결마을 항구','작은 식탁','등대 작업실','당직실','옥상 정원'][state.room]}`;
 $('objective').textContent=task.title;$('guide').hidden=!active;$('guide-step').textContent=task.step;$('guide-title').textContent=task.title;
 $('guide-detail').textContent=task.detail+((state.chapter===5?state.night5.ended:state.chapter===4?state.day4.ended:state.chapter===3?state.night3.ended:state.chapter===2?state.night2.ended:state.ended)?'':' 가까이서 E / Enter · 대화는 끝까지 읽어주세요.');
 $('next-night').hidden=!(active&&nextChapter());$('next-night').textContent=nextChapterLabel();
 $('chapter-label').textContent=['01 / 기억이 머무는 역','02 / 받는 이 없는 편지','03 / 첫차가 오는 방법','04 / 약속의 다른 쪽','05 / 문을 닫는 사람'][state.chapter-1];
 $('save-button').disabled=!active;$('review-journey').hidden=!(active&&state.chapter===5&&state.night5.ended);
}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3000);}
function tone(freq,duration=.4,volume=.025){if(!sound||!audio)return;const o=audio.createOscillator(),v=audio.createGain();o.type='sine';o.frequency.value=freq;v.gain.setValueAtTime(0,audio.currentTime);v.gain.linearRampToValueAtTime(volume,audio.currentTime+.025);v.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.connect(v);v.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}
function music(){const notes=[261.63,329.63,392,493.88,440,392,329.63,293.66,261.63,329.63,392,523.25,493.88,392,293.66,329.63];tone(notes[noteIndex++%notes.length],1.8,.018);if(noteIndex%4===1)tone(130.81,3,.016);}
$('sound').onclick=async()=>{try{audio ||= new (window.AudioContext||window.webkitAudioContext)();await audio.resume();sound=!sound;$('sound').textContent=sound?'소리 끄기 ♫':'소리 켜기 ♫';$('sound').setAttribute('aria-pressed',String(sound));if(sound){music();musicTimer=setInterval(music,680);}else clearInterval(musicTimer);}catch{toast('이 브라우저에서는 소리를 켤 수 없어요.');}};
function speak(speaker,lines,after=null,choices=null){keys.clear();conversation={speaker,lines,index:0,after,choices};$('dialogue').hidden=false;paintDialogue();tone(523,.1,.015);}
function paintDialogue(){const d=conversation;comfort.remember(d);comfort.portrait(d.speaker);$('previous').disabled=d.index===0;$('speaker').textContent=d.speaker;$('line').textContent=d.lines[d.index];$('page').textContent=`${d.index+1} / ${d.lines.length}`;$('choices').replaceChildren();const choose=d.index===d.lines.length-1&&d.choices;$('next').hidden=!!choose;if(choose){for(const c of d.choices){const b=document.createElement('button');b.textContent=c.text;b.onclick=()=>{closeDialogue();c.action();};$('choices').append(b);}}}
function closeDialogue(){conversation=null;$('dialogue').hidden=true;canvas.focus({preventScroll:true});}
function advance(){if(!conversation)return;const d=conversation;if(d.index<d.lines.length-1){d.index++;paintDialogue();tone(392,.07,.01);}else if(!d.choices){closeDialogue();if(d.after)d.after();objective();save();}}
$('next').onclick=advance;
$('previous').onclick=()=>{if(conversation&&conversation.index>0){conversation.index--;paintDialogue();}};
$('interaction').onclick=interact;
function closest(){let result=null,best=Infinity;for(const e of roomEntities()){const d=Math.hypot(e.x-state.x,e.y-state.y);if(d<e.radius&&d<best){best=d;result=e;}}return result;}
function interact(){if(!active||!$('ending').hidden||modalOpen())return;if(conversation){advance();return;}const e=closest();if(!e){toast('조금 더 가까이 다가가 보세요.');return;}
 if(fifthStory.handle(e.id)||fourthDay.handle(e.id)||thirdNight.handle(e.id)||secondNight.handle(e.id))return;
 switch(e.id){
 case 'keeper':
  if(!state.met)speak('역무원 · 여울',['이 시간에 손님이라니. 막차는 방금… 아니, 아주 오래전에 떠났어요.','이름이 기억나지 않나요? 괜찮아요. 이 역에서는 흔한 일이에요.\n저도 가끔 퇴근하는 법을 잊거든요.','혹시 작은 방울 하나를 찾아줄래요?\n누군가를 마중 나갈 때 늘 가지고 다니던 건데.','저쪽 자판기가 뭔가 봤을 거예요.\n잔돈보다 참견이 많은 친구라서요.'],()=>{state.met=true;toast('메모에 부탁을 적었습니다.');});
  else if(state.ended)speak('역무원 · 여울',['오늘은 역이 조금 덜 조용하네요.','내일도 문을 열어둘게요.\n물건을 잃어버리지 않아도 들러도 돼요.']);
  else if(!state.bell)speak('역무원 · 여울',[!state.ticket?'자판기에게 물어보세요.\n돈이 없다는 말부터 하면 삐치니까 조심하고요.':!state.cat?'표에 고양이 발자국이 있네요.\n승강장에 그 표의 주인이 있을 거예요.':'그 아이가 당신을 믿나 봐요.\n고양이가 가리킨 벤치를 살펴봤나요?']);
  else speak('역무원 · 여울',['…이 소리. 기억나요.','동생 가방에 달아줬던 방울이에요.\n길을 잃어도 소리를 따라 찾을 수 있도록.','마지막으로 다퉜던 날, 동생은 먼저 기차를 탔어요.\n저는 미안하다는 말 대신 “내일 얘기해”라고 했고요.','그 뒤로 매일 여기서 내일을 기다렸어요.\n이 방울을… 어떻게 하면 좋을까요?'],null,[{text:'가지고 가요. 기다림도 같이.',action:()=>finish('carry')},{text:'여기에 걸어요. 돌아올 수 있게.',action:()=>finish('hang')}]);
  break;
 case 'machine':
  if(!state.met)speak('자판기 · 03호',['영업 종료입니다. 감정 노동만 가능합니다.','주문은 역무원에게 먼저 해주세요.\n여긴 사연의 순서에도 예민하거든요.']);
  else if(!state.ticket)speak('자판기 · 03호',['방울이요? 개인정보라 알려드릴 수 없습니다.\n…농담인데 아무도 안 웃더라고요.','승강장의 고양이가 반짝이는 걸 물고 갔어요.\n이 표를 보여주면 상대는 해줄 겁니다.','[자판기가 따뜻한 종이 한 장을 내밀었다.]\n행선지: 내일 / 승객: 아직 정하지 않음','유효기간은 없어요.\n미루는 사람들에게 그 정도 배려는 해야죠.'],()=>{state.ticket=true;toast('주머니에 「내일행 표」를 넣었습니다.');});
  else speak('자판기 · 03호',[state.ended?'오늘의 무료 음료는 따뜻한 물입니다.\n종이컵은 없으니 마음으로 드세요.':'제 꿈은 바다가 보이는 곳으로 발령받는 거예요.\n염분 때문에 안 된대요. 현실적이죠?']);
  break;
 case 'board':speak('낡은 안내판',['내일역 이용 안내\n1. 놓친 열차를 쫓아 뛰지 마세요.','2. 두고 간 마음에는 이름을 적어주세요.\n3. 돌아온 분에게 “왜 이제 왔냐”고 묻지 마세요.','아래에 누군가 작은 글씨를 덧붙였다.\n“대신, 배고프지 않냐고 물어볼 것.”']);break;
 case 'plant':speak('이름표 없는 화분',['흙은 촉촉하다. 누군가 매일 돌보고 있는 것 같다.','이름표 뒷면에 적혀 있다.\n“아무 소식 없는 날에도 물은 줄 것.”']);break;
 case 'door':case 'return':move(1-state.room);break;
 case 'cat':
  if(!state.ticket)speak('고양이',['야옹.','고양이는 빈 주머니를 쳐다본다.\n당신보다 사정을 잘 아는 눈치다.']);
  else if(!state.cat)speak('고양이',['[내일행 표를 내밀었다.]','이거 아직도 발급하는구나.\n자판기 녀석, 은근히 정이 많다니까.','왜 그렇게 봐? 너도 말하잖아.','방울은 저쪽 벤치 아래에 뒀어.\n울리지 않는다고 버려진 물건인 줄 알았지.','참, 역무원에게는 내가 말한다고 하지 마.\n그러면 나한테도 근무표를 줄 거야.'],()=>{state.cat=true;toast('고양이가 왼쪽 벤치를 가리켰습니다.');});
  else speak('고양이',[state.ended?'좋은 밤이네.\n아직 아침이 안 왔다는 것만 빼면.':'기다리는 건 자신 있어. 고양이니까.\n하지만 저 사람은 고양이가 아니잖아.']);break;
 case 'bench':
  if(state.bell)speak('오래된 벤치',['나무 틈 사이에 작은 글씨가 새겨져 있다.\n“다음에는 꼭 같이 타기.”']);
  else if(!state.cat)speak('오래된 벤치',['두 사람이 오래 앉았던 자리처럼\n가운데만 반질반질하다.','벤치 아래에서 무언가 반짝이지만 잘 보이지 않는다.\n근처의 고양이가 당신을 유심히 바라본다.']);
  else speak('남겨진 기억',['[벤치 아래에서 작은 방울을 주웠다.]','“언니, 내일은 바다 보러 가자.”','“내일은 바빠. 다음에.”','“언니의 다음에는 기차가 안 와?”','잠깐, 멀리서 파도 소리가 들린 것 같았다.\n방울은 손바닥 안에서 아주 작게 울렸다.'],()=>{state.bell=true;tone(1046,1.8,.035);toast('「작은 방울」을 찾았습니다. 역무원에게 돌아가세요.');});break;
 case 'clock':speak('멈춘 시계',['시계는 12시 7분을 가리키고 있다.','고장 난 것 같지는 않다.\n누군가 한 문장을 끝내기를 기다리는 것 같다.']);break;
 }
}
function showEnding({eyebrow,title,body,next}){window.tomorrowMetrics?.track('chapter_complete',{chapter:state.chapter});clearTimeout(toastTimer);$('toast').classList.remove('show');$('end-eyebrow').textContent=eyebrow;$('end-title').textContent=title;$('end-text').textContent=body;$('end-next-night').hidden=!next;$('end-next-night').textContent=nextChapterLabel();$('return').textContent=state.chapter===4?'마을에 조금 더 머무르기 →':state.room===5?'열차에 조금 더 머무르기 →':'역에 조금 더 머무르기 →';$('credits-button').hidden=!(state.chapter===5&&state.night5.ended);$('ending').hidden=false;}
function finish(choice){state.choice=choice;speak('역무원 · 여울',choice==='carry'?['그럼… 오늘은 제가 먼저 가볼게요.','미안하다는 말은 너무 늦었을지 몰라도,\n보고 싶다는 말은 아직 할 수 있겠죠.','다음에 만나면 먼저 물어볼게요.\n배고프지 않냐고.']:['그래요. 이곳을 찾을 수 있게.','그렇다고 여기서만 기다리진 않을래요.\n내일은 바다에 가보려고요.','혹시 먼저 오면 전해주세요.\n이번엔 내가 자리를 맡아놓겠다고.'],()=>{state.ended=true;save();objective();showEnding({eyebrow:'END OF THE FIRST NIGHT',title:choice==='carry'?'기다림을 데리고':'돌아올 자리',body:choice==='carry'?'여울은 방울을 주머니에 넣었다.\n아주 오래 멈췄던 시계가 한 칸 움직였다.\n\n어떤 내일은, 우리가 먼저 찾아가야 온다.':'문 위에 작은 방울이 걸렸다.\n이제 누군가 돌아오면 소리가 날 것이다.\n\n기다리는 자리를 남겨두고, 걸어가도 괜찮다.',next:true});tone(523,2);});}
function begin(resume){state=resume?(readSave()||fresh()):fresh();active=true;$('start').hidden=true;$('ending').hidden=true;closeDialogue();objective();canvas.focus({preventScroll:true});window.tomorrowMetrics?.track(resume?'game_resume':'game_start',{chapter:state.chapter});if(!resume){window.tomorrowMetrics?.track('chapter_start',{chapter:1});toast('방향키로 걷고, 가까이서 E를 눌러보세요.');}}
$('begin').onclick=()=>begin(false);$('continue').onclick=()=>begin(true);$('return').onclick=()=>{$('ending').hidden=true;canvas.focus({preventScroll:true});};$('restart').onclick=()=>{begin(false);save();};
$('next-night').onclick=$('end-next-night').onclick=()=>{const next=nextChapter();if(!next)return;$('ending').hidden=true;closeDialogue();if(next===5)fifthStory.start();else if(next===4)fourthDay.start();else if(next===3)thirdNight.start();else secondNight.start();window.tomorrowMetrics?.track('chapter_start',{chapter:state.chapter});};
$('journal-button').onclick=()=>{keys.clear();$('journal-content').replaceChildren();let notes;
 if(state.chapter===5)notes=fifthStory.journal();else if(state.chapter===4)notes=fourthDay.journal();else if(state.chapter===3)notes=thirdNight.journal();else if(state.chapter===2)notes=secondNight.journal();else{notes=[!state.met?'나는 이름을 기억하지 못한다. 우선 역무원에게 말을 걸자.':'여울이라는 역무원이 잃어버린 방울을 찾아달라고 했다.'];if(state.ticket)notes.push('내일행 표 — 자판기가 준 따뜻한 표. 승강장 고양이에게 보여주자.');if(state.cat)notes.push('말하는 고양이 — 왼쪽 벤치 아래에 방울이 있다고 한다. 근무는 싫어한다.');if(state.bell)notes.push('작은 방울 — 누군가 함께 바다에 가자고 약속했던 기억.');if(state.ended)notes.push(state.choice==='carry'?'첫 번째 밤: 기다림을 데리고.':'첫 번째 밤: 돌아올 자리.');}
 comfort.showJournal(notes);};$('close-journal').onclick=()=>{$('journal').close();canvas.focus({preventScroll:true});};
window.addEventListener('keydown',e=>{if(modalOpen())return;if(e.target instanceof HTMLElement&&e.target.closest('button')&&['Enter',' '].includes(e.key))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter'].includes(e.key)&&active)e.preventDefault();if(e.key==='Escape'){closeDialogue();keys.clear();return;}if(['e','E','Enter',' '].includes(e.key)&&!e.repeat){interact();return;}keys.add(e.key.toLowerCase());});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();if(active)save();});document.addEventListener('visibilitychange',()=>{keys.clear();if(active)save();if(audio){if(document.hidden)audio.suspend();else if(sound)audio.resume();}});
for(const b of document.querySelectorAll('[data-dir]')){const k={up:'arrowup',down:'arrowdown',left:'arrowleft',right:'arrowright'}[b.dataset.dir];b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(k);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(k);}$('touch-action').onclick=interact;
// Pixel scenery stays on the low-resolution canvas. Text uses native HTML so
// Korean glyphs remain sharp at any screen size or device pixel ratio.
const worldLabels=[];let labelIndex=0;
function rect(x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);}
function text(t,x,y,c='#b7c6b9',size=7,align='left'){
 let label=worldLabels[labelIndex];if(!label){label=document.createElement('span');label.className='world-label';$('world-labels').append(label);worldLabels.push(label);}labelIndex++;
 if(label.textContent!==t)label.textContent=t;
 label.hidden=false;label.style.left=`${x/W*100}%`;label.style.top=`${y/H*100}%`;label.style.color=c;
 label.style.fontSize=`clamp(11px, ${size/4.8}cqw, ${size*2.5}px)`;
 label.style.transform=align==='center'?'translate(-50%, -90%)':'translateY(-90%)';
}
function drawHints(){
 $('world-labels').hidden=!$('start').hidden||!$('ending').hidden;
 const visible=active&&!conversation&&$('ending').hidden&&!modalOpen();
 const nearest=visible?closest():null;$('interaction').hidden=!nearest;
 if(nearest){$('interaction-label').textContent=nearest.label;$('interaction').style.left=`${Math.max(20,Math.min(80,state.x/W*100))}%`;$('interaction').style.top=`${(state.y-38)/H*100}%`;}
 const target=visible?roomEntities().find(e=>e.id===currentTask().id):null;$('target-marker').hidden=!target;
 if(target){$('target-marker').style.left=`${target.x/W*100}%`;$('target-marker').style.top=`${(target.y-31)/H*100}%`;if(nearest?.id===target.id)$('target-marker').hidden=true;}
}
function glow(x,y,r,color){const grad=g.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,color);grad.addColorStop(1,'transparent');g.fillStyle=grad;g.fillRect(x-r,y-r,r*2,r*2);}
function person(x,y,keeper=false){const step=active&&!conversation&&keys.size?Math.sin(time*12)*1.5:0;rect(x-7,y-2,15,5,'#111a2588');rect(x-4,y-16,9,12,keeper?'#758580':'#d3ad72');rect(x-4,y-5,3,6+step,'#2c3444');rect(x+2,y-5,3,6-step,'#2c3444');rect(x-5,y-26,11,10,'#d4b7a1');rect(x-6,y-28,13,5,keeper?'#364b50':'#303643');rect(x-6,y-23,3,6,keeper?'#76838a':'#303643');rect(x+1,y-22,1,2,'#30303b');rect(x+5,y-17,3,8,keeper?'#657671':'#b28c58');if(!keeper){rect(x-5,y-16,11,3,'#b55b5b');rect(x-7,y-14,3,6,'#b55b5b');}else{rect(x-7,y-27,16,2,'#a2ac93');rect(x+1,y-14,2,2,'#dac58d');}}
function bench(x,y){rect(x-28,y+5,60,8,'#101d2888');rect(x-29,y-19,60,5,'#8b7256');rect(x-29,y-12,60,4,'#715e4c');rect(x-29,y-4,60,7,'#9b805b');rect(x-25,y+3,4,7,'#34424b');rect(x+23,y+3,4,7,'#34424b');rect(x-29,y-19,60,1,'#b6996a');}
function drawLobby(){rect(0,0,W,H,'#1a2a3a');rect(20,47,440,113,'#30434e');for(let x=20;x<460;x+=32){rect(x,47,1,107,'#394b54');}rect(20,47,440,4,'#718077');rect(20,154,440,5,'#7e8170');rect(20,159,440,118,'#3d4b50');for(let y=165;y<280;y+=22){rect(20,y,440,1,'#53605d');for(let x=20+(y%2)*12;x<460;x+=32)rect(x,y,1,22,'#46565a');}rect(0,277,480,11,'#142330');rect(16,48,7,230,'#1b2c3a');rect(458,48,7,230,'#1b2c3a');
 for(const x of [128,266]){rect(x,68,76,58,'#182c40');rect(x+3,71,70,51,state.chapter===5?'#aa9d8b':'#23394e');rect(x+36,70,3,54,'#6b7c7c');rect(x+3,95,70,3,'#617575');rect(x+5,117,66,3,'#435e65');if(state.chapter<5)for(let j=0;j<9;j++){const px=x+6+(j*19)%65,py=74+(j*13)%39;rect(px,py,1,1,'#a5c4c9');}rect(x-3,126,82,4,'#8a9280');}
 rect(188,71,59,35,'#1b2b34');rect(190,73,55,31,'#53646a');text(state.chapter>=3?thirdNight.stationName():'내일역',218,84,'#f0eed4',7,'center');text(stationTime(),218,99,'#ffe1a4',8,'center');
 rect(71,96,40,62,'#172936');rect(74,95,35,60,'#9a605d');rect(77,99,28,30,'#203e49');for(let i=0;i<6;i++){rect(80+(i%3)*8,104+Math.floor(i/3)*12,5,8,['#c5b584','#8ba99d','#af7d6a'][i%3]);}rect(77,132,19,3,'#dcc296');rect(99,132,4,8,'#e6c582');rect(81,145,17,5,'#343f46');glow(92,126,44,'#e8bd5f18');
 rect(316,143,72,26,'#22313a');rect(312,140,80,7,'#a18d6a');rect(317,149,70,17,'#52615d');rect(322,151,59,12,'#465551');text('분실물 보관소',351,159,'#f0eed4',6,'center');if(state.chapter!==5&&!(state.chapter===3&&state.night3.ended))person(348,141,true);rect(327,135,14,4,'#d4cbb3');rect(328,132,10,3,'#a7b6ad');
 rect(416,138,17,19,'#986f58');rect(419,134,11,5,'#596653');for(let i=0;i<6;i++)rect(412+(i*7)%22,114+(i*9)%21,9,5,['#688e73','#86a281','#486f63'][i%3]);bench(162,188);bench(348,207);
 for(const x of [64,284,407]){rect(x,55,32,3,'#ddd3a3');glow(x+16,73,65,'#efd69b1c');}rect(209,271,63,6,'#a3b29a');text('↓ 승강장으로',240,265,'#edf1da',7,'center');if(state.ended&&state.choice==='hang'){rect(236,238,1,8,'#ac9169');rect(233,245,7,5,'#debd74');}
 if(state.chapter<5)secondNight.drawLobbyDoor();fifthStory.lobbyExtras();
}
function drawPlatform(){const evening=state.chapter===5;rect(0,0,W,H,evening?'#6e829b':'#182a3e');if(evening){rect(0,75,480,62,'#b29684');glow(382,62,58,'#f6d39b33');rect(373,53,18,18,'#f7d1a1');}else{for(let i=0;i<64;i++){let x=(i*71+13)%W,y=(i*37)%113;rect(x,y,1,1,i%4?'#526e86':'#b9c5ba');}glow(389,48,58,'#a4c5c61a');rect(382,37,15,15,'#c9d7c4');rect(389,35,12,13,'#182a3e');}for(let i=0;i<15;i++){let x=i*37;rect(x,97-(i%4)*7,27,46,'#203344');rect(x+8,107-(i%4)*7,3,4,'#7b86684d');}
 rect(0,137,480,8,'#0e1b2a');rect(0,146,480,2,'#697d82');rect(0,153,480,2,'#697d82');for(let x=0;x<480;x+=22)rect(x,148,9,4,'#2d3e4b');rect(20,162,440,113,'#45565b');rect(20,163,440,5,'#b2a574');for(let x=22;x<460;x+=8)rect(x,164,2,2,'#706c53');for(let y=189;y<274;y+=24)rect(20,y,440,1,'#58655f');rect(20,275,440,6,'#263b48');
 for(const x of [55,407]){rect(x,88,4,93,'#243e4a');rect(x-10,84,24,4,'#a2b3a5');rect(x-7,88,18,3,'#e4d3a0');glow(x+2,118,66,'#eddaa12a');}rect(231,77,7,61,'#2d424b');rect(220,91,31,27,'#7e928b');rect(223,94,25,21,'#233946');if(!(state.chapter===3&&state.night3.announced))text(stationTime(),236,107,'#dcd5a9',7,'center');bench(123,188);if(state.cat&&!state.bell){rect(117,195,4,3,'#ead493');glow(119,195,12,'#f3d77b55');}
 if(!(state.chapter===3&&state.night3.ended)){rect(339,174,19,5,'#1a2c35');rect(341,168,15,8,'#b4bfad');rect(349,160,9,10,'#c7cfb6');rect(349,158,3,4,'#c7cfb6');rect(356,158,3,4,'#c7cfb6');rect(351,164,1,2,'#263442');rect(356,164,1,2,'#263442');rect(337,166+Math.sin(time*2),6,3,'#b4bfad');}text('잠시 쉬어 가도 괜찮아요.',240,221,'#cad9d0',7,'center');rect(209,271,63,6,'#a3b29a');text('↓ 대합실로',240,263,'#edf1da',7,'center');thirdNight.drawPlatformExtras();fifthStory.platformExtras();}
const obstacles=[[{x:65,y:93,w:52,h:68},{x:307,y:125,w:86,h:47},{x:409,y:119,w:31,h:42},{x:129,y:164,w:69,h:36},{x:314,y:183,w:69,h:36}],[{x:91,y:164,w:67,h:35},{x:339,y:156,w:23,h:24}]];
function allowed(x,y){const blocks=fifthStory.obstacles[state.room]||fourthDay.obstacles[state.room]||thirdNight.obstacles[state.room]||secondNight.obstacles[state.room]||obstacles[state.room];return x>=29&&x<=449&&y>=floorY(state.room)&&y<=270&&!blocks.some(o=>x>o.x-5&&x<o.x+o.w+5&&y>o.y-1&&y<o.y+o.h+4);}
function frame(ms){const dt=Math.min((ms-last)/1000,.035);last=ms;time=ms/1000;if(active&&!conversation&&$('ending').hidden&&!modalOpen()){let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);const n=Math.hypot(dx,dy)||1,speed=running()?RUN_SPEED:WALK_SPEED;dx=dx/n*speed*dt;dy=dy/n*speed*dt;if(allowed(state.x+dx,state.y))state.x+=dx;if(allowed(state.x,state.y+dy))state.y+=dy;}
 labelIndex=0;[drawLobby,drawPlatform,secondNight.drawArchive,()=>secondNight.drawMemory(time),()=>thirdNight.drawSignalRoom(time),()=>thirdNight.drawCarriage(time),()=>fourthDay.drawHarbor(time),()=>fourthDay.drawCafe(time),()=>fourthDay.drawLighthouse(time),fifthStory.drawOffice,()=>fifthStory.drawGarden(time)][state.room]();for(let i=labelIndex;i<worldLabels.length;i++)worldLabels[i].hidden=true;
 person(state.x,state.y);for(let i=0;i<18;i++){const x=(i*71+time*(i%3+1)*1.7)%480,y=60+(i*29+Math.sin(time+i)*5)%197;rect(x,y,1,1,'#d7d9b72e');}drawHints();
 const vignette=g.createRadialGradient(240,150,90,240,150,290);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#07111e8a');g.fillStyle=vignette;g.fillRect(0,0,W,H);ctx.drawImage(surface,0,0,960,576);requestAnimationFrame(frame);}
requestAnimationFrame(frame);window.addEventListener('beforeunload',()=>{if(active)save();});
})();
