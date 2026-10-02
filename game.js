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
const freshJourney2=()=>({six:{met:false,clues:[],route:[null,null,null],aligned:false,choice:null,ended:false},seven:{met:false,director:false,evidence:[],proven:false,choice:null,ended:false},eight:{met:false,heard:false,challenge:false,live:false,policy:null,ended:false}});
const fresh=()=>({storyVersion:Homecoming.version,homecoming:Homecoming.fresh(),x:240,y:224,room:0,met:false,firstQuestion:null,opening:null,openingChoice:null,ticket:false,cat:false,bell:false,choice:null,ended:false,chapter:1,night2:freshNight2(),night3:freshNight3(),day4:freshDay4(),night5:freshNight5(),journey2:freshJourney2(),history:[]});
let state=fresh(), active=false, conversation=null, keys=new Set(), time=0,last=0,toastTimer;
const nativeApp=document.body.classList.contains('native-app'),motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
// Only actual passages trigger on foot. Story devices and departure choices
// still require deliberate interaction with their existing handlers.
const walkExits=new Set(['door','return','archive-door','archive-back','memory-back','roof-door','roof-back','ride-back','train-door','cafe-door','cafe-back','lighthouse-door','lighthouse-back','office-door','office-back','garden-door','garden-back','to-bridge','back-train','to-records','back-city','to-dawn','back-central']);
let exitContacts=new Set(),exitScene='';
const legacySources=new WeakMap();
for(const id of ['hc-record-door','hc-lobby-door','hc-child-door','hc-festival-door','hc-care-door','hc-hospital-door','hc-waiting-door','hc-house-door','hc-dorim-door'])walkExits.add(id);
let walkingTime=0,moving=false;
let touchInput={x:0,y:0,pace:0};
function clearInput(){keys.clear();touchInput={x:0,y:0,pace:0};moving=false;}
window.addEventListener('tomorrow-move',e=>{const d=e.detail||{};touchInput={x:Number.isFinite(d.x)?Math.max(-1,Math.min(1,d.x)):0,y:Number.isFinite(d.y)?Math.max(-1,Math.min(1,d.y)):0,pace:Number.isFinite(d.pace)?Math.max(0,Math.min(1,d.pace)):d.run===true?1:0};});
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
const secondJourney=createSecondJourney({state:()=>state,speak,toast,tone,save,objective,move,showEnding,rect,text,glow});
const comfort=createGameComfort({state:()=>state,active:()=>active,readSave,normaliseSave,restore,saveSummary,formatSavedAt,currentTask,keys,canvas});
const sharing=createGameSharing({state:()=>state,keys,canvas});
function openingPending(){return state.chapter===1&&state.opening==='witness'&&!state.met;}
function roomEntities(){
 if(openingPending())return state.room===1?[...entities[1],{id:'keeper',x:166,y:204,label:'방울을 숨긴 역무원',radius:29}]:entities[0].filter(e=>e.id!=='keeper');
 return state.chapter>=6?secondJourney.roomEntities(state.room):state.chapter===5?fifthStory.roomEntities(state.room):state.chapter===4?fourthDay.roomEntities(state.room):state.chapter===3?thirdNight.roomEntities(state.room):secondNight.roomEntities(state.room);
}
function move(room,x=240,y=230){Homecoming.clearScene();state.room=room;state.x=x;state.y=y;clearInput();resetExitContacts();window.dispatchEvent(new Event('tomorrow-room-change'));objective();save();comfort.transition();tone(293,.7);}
function insideExit(e,margin=0){return Math.abs(state.x-e.x)<=18+margin&&Math.abs(state.y-e.y)<=10+margin;}
function resetExitContacts(){exitScene=`${state.chapter}:${state.room}`;exitContacts=new Set(roomEntities().filter(e=>walkExits.has(e.id)&&insideExit(e,6)).map(e=>e.id));}
function walkThroughExit(){
 if(exitScene!==`${state.chapter}:${state.room}`){resetExitContacts();return;}
 for(const e of roomEntities()){
  if(!walkExits.has(e.id))continue;
  if(!insideExit(e,6)){exitContacts.delete(e.id);continue;}
  if(moving&&insideExit(e)&&!exitContacts.has(e.id)){exitContacts.add(e.id);useEntity(e);return;}
 }
}
function stationTime(){return state.chapter>=5?({5:'11:20',6:'12:05',7:'15:10',8:Homecoming.view(state).index>=7?'목요일':Homecoming.view(state).index>=4?'19:10':'16:10'}[state.chapter]):state.chapter===4?(state.day4.ended?'09:12':state.day4.lit?'08:40':'08:07'):state.chapter===3?(state.night3.ended?'06:12':state.night3.announced?'05:59':'00:10'):state.night2.ended?'00:09':state.ended?'00:08':'00:07';}
function nextChapter(){return state.chapter===1&&state.ended?2:state.chapter===2&&state.night2.ended?3:state.chapter===3&&state.night3.ended?4:state.chapter===4&&state.day4.ended?5:state.chapter===5&&state.night5.ended?6:state.chapter===6&&state.journey2.six.ended?7:state.chapter===7&&state.journey2.seven.ended?8:null;}
function nextChapterLabel(){const next=nextChapter();return next>=5?`${next}장 · ${Homecoming.titles[next-1]} →`:next===4?'바닷가 이야기 시작 →':next===3?'세 번째 밤 시작 →':'두 번째 밤 시작 →';}
function floorY(room){return secondJourney.minY[room]??(room===10?161:fourthDay.minY[room]??(room===1?173:138));}
function save(){try{localStorage.setItem(SAVE,JSON.stringify({...state,savedAt:new Date().toISOString()}));saveFailed=false;$('save-status').textContent='자동 저장됨 · '+new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});return true;}catch{$('save-status').textContent='자동 저장 실패 · 저장 메뉴에서 파일로 내보낼 수 있어요';if(!saveFailed)toast('자동 저장하지 못했어요. 저장 메뉴에서 진행을 파일로 보관해주세요.');saveFailed=true;return false;}}
function normaliseSave(s){if(s&&typeof s==='object'&&[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].includes(s.room)&&Number.isFinite(s.x)&&Number.isFinite(s.y)){
 const n={...freshNight2(),...s.night2};n.clues=Array.isArray(n.clues)?[...new Set(n.clues.filter(id=>['rain','whistle','train'].includes(id)))]:[];
 n.sequence=Array.isArray(n.sequence)&&n.sequence.length<3?[...new Set(n.sequence.filter(id=>['rain','whistle','train'].includes(id)))]:[];
 const p={...freshNight3(),...s.night3};p.witnesses=Array.isArray(p.witnesses)?[...new Set(p.witnesses.filter(id=>['keeper','machine','cat'].includes(id)))]:[];
 p.signals=Array.from({length:3},(_,i)=>Array.isArray(p.signals)&&['store','wait','go'].includes(p.signals[i])?p.signals[i]:null);
 const d={...freshDay4(),...s.day4};d.photos=Array.isArray(d.photos)?[...new Set(d.photos.filter(id=>['sea','meal','light'].includes(id)))]:[];
 d.mirrors=Array.from({length:3},(_,i)=>Array.isArray(d.mirrors)&&[0,1].includes(d.mirrors[i])?d.mirrors[i]:freshDay4().mirrors[i]);
 const f={...freshNight5(),...s.night5};f.route=fifthStory.normaliseRoute(f.route);f.guestChoice=['quiet','listen'].includes(f.guestChoice)?f.guestChoice:null;
 const j=freshJourney2(),raw=s.journey2||{};
 for(const key of ['six','seven','eight']){const value=raw[key];if(value&&typeof value==='object')for(const flag of Object.keys(j[key]))if(typeof j[key][flag]==='boolean')j[key][flag]=value[flag]===true;}
 j.six.clues=Array.isArray(raw.six?.clues)?[...new Set(raw.six.clues.filter(id=>['parcel','manifest','receiver'].includes(id)))]:[];
 j.six.route=Array.from({length:3},(_,i)=>['hold','return','trace'].includes(raw.six?.route?.[i])?raw.six.route[i]:null);
 j.six.choice=['public','private'].includes(raw.six?.choice)?raw.six.choice:null;
 j.seven.evidence=Array.isArray(raw.seven?.evidence)?[...new Set(raw.seven.evidence.filter(id=>['return-log','witness'].includes(id)))]:[];
 j.seven.choice=['square','letters'].includes(raw.seven?.choice)?raw.seven.choice:null;
 j.eight.policy=['local','shared'].includes(raw.eight?.policy)?raw.eight.policy:null;
 let chapter=[2,3,4,5,6,7,8].includes(s.chapter)?s.chapter:1;
 const legacy=s.storyVersion!==Homecoming.version;
 const homecoming=Homecoming.normalise(legacy?null:s.homecoming,n.ended?n.choice:null);
 if(legacy){homecoming.recapPending=chapter>=2;if(chapter>=5){chapter=5;Object.assign(f,freshNight5());Object.assign(j,freshJourney2());}}
 if(chapter>=5){for(const c of [5,6,7,8]){const key=Homecoming.keys[c];if(c<chapter)homecoming.steps[key]=Homecoming.scenes[c].length;const done=homecoming.steps[key]===Homecoming.scenes[c].length;if(c===5)f.ended=done;else j[{6:'six',7:'seven',8:'eight'}[c]].ended=done;}if(homecoming.steps.eight>0)homecoming.nameRecovered=true;}
 const room=chapter>=5?(legacy?9:Homecoming.legalRooms[chapter].includes(s.room)?s.room:Homecoming.scenes[chapter][0][1]):chapter===4?([6,7,8].includes(s.room)?s.room:6):Math.min(s.room,chapter===1?1:chapter===2?3:5);
 const history=Array.isArray(s.history)?s.history.filter(e=>e&&typeof e.speaker==='string'&&typeof e.text==='string').slice(-1200).map(e=>({speaker:e.speaker.slice(0,100),text:e.text.slice(0,2000),chapter:[1,2,3,4,5,6,7,8].includes(e.chapter)?e.chapter:chapter})):[];
 if(legacy&&s.chapter>=5){for(let i=history.length-1;i>=0;i--)if(history[i].chapter>=5)history.splice(i,1);}
 comfort.trimHistory(history);
 for(const [obj,defaults] of [[n,freshNight2()],[p,freshNight3()],[d,freshDay4()],[f,freshNight5()]])for(const key of Object.keys(defaults))if(typeof defaults[key]==='boolean')obj[key]=obj[key]===true;
 const result={...fresh(),...s,storyVersion:Homecoming.version,homecoming,firstQuestion:['again','name'].includes(s.firstQuestion)?s.firstQuestion:null,opening:s.opening==='witness'?'witness':null,openingChoice:s.opening==='witness'&&['ask','pretend'].includes(s.openingChoice)?s.openingChoice:null,chapter,room,night2:n,night3:p,day4:d,night5:f,journey2:j,history,x:legacy&&s.chapter>=5?240:Math.max(29,Math.min(449,s.x)),y:legacy&&s.chapter>=5?249:Math.max(floorY(room),Math.min(270,s.y))};
 if(legacy)legacySources.set(result,s);return result;
}return null;}
function preserveLegacy(snapshot){const raw=legacySources.get(snapshot);if(!raw)return true;try{if(!localStorage.getItem(SAVE+'-before-homecoming'))localStorage.setItem(SAVE+'-before-homecoming',JSON.stringify(raw));return true;}catch{toast('이전 이야기를 보관하지 못했어요. 저장 파일을 먼저 내보내 주세요.');return false;}}
function readSave(){try{return normaliseSave(JSON.parse(localStorage.getItem(SAVE)));}catch{return null;}}
function readRestartBackup(){try{return normaliseSave(JSON.parse(localStorage.getItem(SAVE+'-before-restart')));}catch{return null;}}
if(readSave())$('continue').hidden=false;
function modalOpen(){return !!document.querySelector('dialog[open]');}
function updateRunButton(){const button=$('run-toggle');button.setAttribute('aria-pressed',String(runToggle));button.firstChild.textContent=`달리기 ${runToggle?'ON':'OFF'} `;}
$('run-toggle').onclick=()=>{runToggle=!runToggle;updateRunButton();canvas.focus({preventScroll:true});};
function slotKey(index){return `${SAVE}-slot-${index}`;}
function readSlot(index){try{const entry=JSON.parse(localStorage.getItem(slotKey(index)));const snapshot=normaliseSave(entry?.state);return snapshot?{...entry,state:snapshot}:null;}catch{return null;}}
function saveSummary(snapshot){
 const places=Homecoming.roomNames;let progress;
 if(snapshot.chapter>=5){const c=snapshot.chapter,k=Homecoming.keys[c],i=snapshot.homecoming.steps[k];progress=i===Homecoming.scenes[c].length?'장 완료':Homecoming.scenes[c][i][5];}
 else if(snapshot.chapter===4){const n=snapshot.day4;progress=n.ended?'바닷가 이야기 완료':n.reunited?'03호에게 엽서 보내기':n.lit?'여울과 나루의 이야기':n.met?'등대 빛길 퍼즐':n.letter?'나루를 만나러':n.notice?'반송된 편지':'마을에 도착';}
 else if(snapshot.chapter===3){const n=snapshot.night3;progress=n.ended?'첫 번째 아침':n.announced?'첫차에 오르기':n.signalDone?'새 안내 방송':n.inspector?`신호 연결 ${n.signals.filter(Boolean).length} / 3`:n.board?`다음 이야기 ${n.witnesses.length} / 3`:'사라진 역 이름';}
 else if(snapshot.chapter===2){const n=snapshot.night2;progress=n.ended?'두 번째 밤 완료':n.catName?'편지의 받는 사람':n.remembered?'고양이의 이름':n.tuned?'기억 속의 아이':n.met?`소리 단서 ${n.clues.length} / 3`:'새로 도착한 편지';}
 else progress=snapshot.ended?'첫 번째 밤 완료':snapshot.bell?'방울을 찾은 뒤':snapshot.cat?'벤치의 단서':snapshot.ticket?'내일행 표를 받은 뒤':snapshot.met?'역무원의 부탁':'첫 만남 전';
 return `${snapshot.chapter<=4?['첫 번째 밤','두 번째 밤','세 번째 밤','바닷가 이야기'][snapshot.chapter-1]:Homecoming.titles[snapshot.chapter-1]} · ${places[snapshot.room]} · ${progress}`;
}
function formatSavedAt(value){const date=new Date(value);return Number.isNaN(date.getTime())?'이전 버전의 저장':date.toLocaleString('ko-KR',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});}
function storeSlot(index){
 try{localStorage.setItem(slotKey(index),JSON.stringify({version:1,savedAt:new Date().toISOString(),state}));}
 catch{$('save-menu-description').textContent='저장하지 못했어요. 브라우저의 저장 공간 설정을 확인하고 다시 시도해주세요.';return;}
 $('save-status').textContent=`저장 ${index} 완료 · ${formatSavedAt(new Date())}`;$('save-menu').close();toast(`저장 ${index}에 지금까지의 여정을 담았습니다.`);tone(523,.25);
}
function restore(snapshot,label){
 if(!preserveLegacy(snapshot))return;
 window.tomorrowMetrics?.track('game_resume',{chapter:snapshot.chapter});
 state=snapshot;active=true;clearInput();resetExitContacts();$('start').hidden=true;$('ending').hidden=true;
 if($('journal').open)$('journal').close();if($('save-menu').open)$('save-menu').close();if($('credits').open)$('credits').close();if($('share-menu').open)$('share-menu').close();
 closeDialogue();objective();if(save()){$('save-status').textContent=`${label} 불러옴`;toast(`${label}에서 이어갑니다.`);}canvas.focus({preventScroll:true});if(openingPending())openingScene();
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
  const restartBackup=readRestartBackup();if(restartBackup)card('처음부터 시작하기 전 진행',{state:restartBackup,savedAt:restartBackup.savedAt},{label:'복구하기',run:()=>{const latest=readRestartBackup();if(latest)restore(latest,'처음부터 시작하기 전 진행');}});
  const legacyBackup=(()=>{try{return normaliseSave(JSON.parse(localStorage.getItem(SAVE+'-before-homecoming')));}catch{return null;}})();if(legacyBackup)card('새 이야기 적용 전 원본',{state:legacyBackup,savedAt:legacyBackup.savedAt},{label:'새 원고로 이어가기',run:()=>restore(legacyBackup,'원본에서 이어가기')});
  const backup=comfort.readBackup();if(backup)card('파일 가져오기 전 진행',{state:backup,savedAt:backup.savedAt},{label:'복구하기',run:()=>{const latest=comfort.readBackup();if(latest)restore(latest,'가져오기 전 진행');}});
 }
}
function openSaveMenu(mode){
 if(mode==='save'&&!active)return;
 clearInput();saveMenuMode=mode;$('save-menu-title').textContent=mode==='save'?'이 순간 저장하기':'어디서 이어갈까요?';
 $('save-menu-description').textContent=mode==='save'?'저장할 칸을 골라주세요. 덮어쓰기를 누르면 그 칸의 기록이 바뀝니다.':'선택한 시점으로 돌아갑니다. 지금 진행을 남기려면 먼저 저장해주세요.';
 renderSaveMenu();comfort.prepareSaveMenu();$('save-menu').showModal();
}
$('save-button').onclick=()=>openSaveMenu('save');$('load-button').onclick=()=>openSaveMenu('load');
$('close-save-menu').onclick=()=>$('save-menu').close();
$('save-menu').addEventListener('close',()=>{clearInput();if(active)canvas.focus({preventScroll:true});});
function currentTask(){
 if(state.chapter>=6)return secondJourney.task();
 if(nextChapter()===6)return {step:'다음 이야기',title:'엄마가 되기 전의 사람',detail:'열차에 남은 두 사람의 젊은 날을 만나보세요. 6장 버튼으로 이어갑니다.'};
 if(state.chapter===5)return fifthStory.task();
 if(nextChapter()===5)return {step:'다섯 번째 이야기',title:'돌려받지 않은 물건 · 역으로',detail:'새 손님이 이름을 맡기려 한다는 연락이 왔어요. 5장 버튼으로 우리 역에 돌아가세요.'};
 if(state.chapter===4)return fourthDay.task();
 if(nextChapter()===4)return {step:'다음 이야기',title:'약속의 다른 쪽 · 바닷가로',detail:'첫차가 물결마을에 도착해요. 「바닷가 이야기 시작」을 누르면 여울의 약속을 따라갈 수 있어요. 열차 안을 더 둘러봐도 괜찮아요.'};
 if(state.chapter===3)return thirdNight.task();
 if(nextChapter()===3)return {step:'다음 밤',title:'세 번째 밤 · 첫차가 오는 방법',detail:'온이 신청한 폐역 절차가 시작됐어요. 「세 번째 밤 시작」을 눌러 왜 역을 닫으려 했는지 알아보세요.'};
 if(state.chapter===2)return secondNight.task();
 if(state.ended)return {step:'다음 밤',title:'두 번째 밤 · 받는 이 없는 편지',detail:'역에 새 편지가 도착했어요. 「두 번째 밤 시작」을 눌러 이어서 만나보세요.'};
 if(state.opening==='witness'){
  const task=!state.met?{step:'01 / 03',room:1,id:'keeper',title:'찾아 달라면서 왜 숨겼을까?',detail:'승강장 왼쪽 벤치 옆 역무원에게 말을 걸어보세요.'}:!state.bell?{step:'02 / 03',room:1,id:'bench',title:'숨긴 자리는 알고 있다',detail:'승강장 왼쪽 벤치 아래를 직접 확인해보세요.'}:{step:'03 / 03',room:0,id:'keeper',title:'조금 늦게 찾아 달라는 부탁',detail:'대합실 오른쪽 안내 데스크의 여울에게 방울을 가져가세요. 이번이 처음은 아닌 것 같아요.'};
  if(state.room!==task.room){task.id=state.room?'return':'door';task.detail=`아래 중앙 출구로 걸어가 ${task.room?'승강장':'대합실'}으로 이동하세요.`;}
  return task;
 }
 const stage=!state.met?0:!state.ticket?1:!state.cat?2:!state.bell?3:4;
 const tasks=[
  {id:'keeper',room:0,title:'내 이름을 찾을 수 있을까?',detail:'대합실 오른쪽 위 안내 데스크에서 역무원에게 물어보세요.'},
  {id:'machine',room:0,title:'방울의 마지막 행방',detail:'대합실 왼쪽 빨간 자판기 앞으로 가세요.'},
  {id:'cat',room:1,title:'어제 돌려줬다는 방울',detail:'승강장 오른쪽의 하얀 고양이에게 말을 걸면 영수증을 보여줘요.'},
  {id:'bench',room:1,title:'벤치 아래 조사하기',detail:'승강장 왼쪽 나무 벤치 앞에서 조사해보세요.'},
  {id:'keeper',room:0,title:'어제 반납한 물건의 주인',detail:'대합실 오른쪽 위 역무원에게 말을 걸어주세요.'}
 ];
 const task={...tasks[stage],step:`0${stage+1} / 05`};
 if(state.room!==task.room){task.id=state.room?'return':'door';task.detail=`화면 맨 아래 중앙의 출구로 걸어가면 ${task.room?'승강장':'대합실'}으로 이동해요.`;}
 return task;
}
function objective(){
 const task=currentTask(),station=state.chapter>=3?thirdNight.stationName():'내일역';const view=Homecoming.view(state);$('location').textContent=`${state.room===3||view.past?'기억':stationTime()} · ${(state.room===0?`${station} 대합실`:view.place)}`;
 $('objective').textContent=task.title;$('guide').hidden=!active;$('guide-step').textContent=task.step;$('guide-title').textContent=task.title;
 $('guide-detail').textContent=task.detail+((state.chapter>=6?state.journey2[state.chapter===6?'six':state.chapter===7?'seven':'eight'].ended:state.chapter===5?state.night5.ended:state.chapter===4?state.day4.ended:state.chapter===3?state.night3.ended:state.chapter===2?state.night2.ended:state.ended)?'':walkExits.has(task.id)?' 출입구 안으로 걸어가면 이동해요.':' 가까이서 E / Enter로 말을 걸어요.');
 $('next-night').hidden=!(active&&nextChapter());$('next-night').textContent=nextChapterLabel();
 $('chapter-label').textContent=`${String(state.chapter).padStart(2,'0')} / ${Homecoming.titles[state.chapter-1]}`;
 $('save-button').disabled=!active;$('review-journey').hidden=!(active&&state.chapter>=5&&state.night5.ended);
}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3000);}
function tone(freq,duration=.4,volume=.025){if(!sound||!audio)return;const o=audio.createOscillator(),v=audio.createGain();o.type='sine';o.frequency.value=freq;v.gain.setValueAtTime(0,audio.currentTime);v.gain.linearRampToValueAtTime(volume,audio.currentTime+.025);v.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.connect(v);v.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}
function music(){const notes=[261.63,329.63,392,493.88,440,392,329.63,293.66,261.63,329.63,392,523.25,493.88,392,293.66,329.63];tone(notes[noteIndex++%notes.length],1.8,.018);if(noteIndex%4===1)tone(130.81,3,.016);}
$('sound').onclick=async()=>{try{audio ||= new (window.AudioContext||window.webkitAudioContext)();await audio.resume();sound=!sound;$('sound').textContent=sound?'소리 끄기 ♫':'소리 켜기 ♫';$('sound').setAttribute('aria-pressed',String(sound));if(sound){music();musicTimer=setInterval(music,680);}else clearInterval(musicTimer);}catch{toast('이 브라우저에서는 소리를 켤 수 없어요.');}};
function speak(speaker,lines,after=null,choices=null){clearInput();const pages=comfort.dialoguePages(speaker,lines);conversation={speaker,pages,lines:pages.map(page=>page.text),index:0,after,choices};$('dialogue').hidden=false;paintDialogue();tone(523,.1,.015);}
function paintDialogue(){const d=conversation,page=d.pages[d.index];comfort.remember(d,page);comfort.renderDialogue(page);$('dialogue').scrollTop=0;$('previous').disabled=d.index===0;$('page').textContent=`${d.index+1} / ${d.lines.length}`;$('choices').replaceChildren();const choose=d.index===d.lines.length-1&&d.choices;$('dialogue').dataset.hasChoices=String(!!choose);$('choices').dataset.count=String(choose?d.choices.length:0);$('next').hidden=!!choose;if(choose){for(const c of d.choices){const b=document.createElement('button');b.textContent=c.text;b.onclick=()=>{closeDialogue();c.action();};$('choices').append(b);}}}
function closeDialogue(){if(Homecoming.clearScene())objective();conversation=null;$('dialogue').hidden=true;canvas.focus({preventScroll:true});}
function advance(){if(!conversation)return;const d=conversation;if(d.index<d.lines.length-1){d.index++;paintDialogue();tone(392,.07,.01);}else if(!d.choices){closeDialogue();if(d.after)d.after();objective();save();}}
$('next').onclick=advance;
$('previous').onclick=()=>{if(conversation&&conversation.index>0){conversation.index--;paintDialogue();}};
$('interaction').onclick=interact;
function closest(){let result=null,best=Infinity;for(const e of roomEntities()){const d=Math.hypot(e.x-state.x,e.y-state.y);if(d<e.radius&&d<best){best=d;result=e;}}return result;}
function openingScene(){speak('역무원 · 여울',[
 '이야기: 역무원이 벤치 밑에 작은 방울을 밀어 넣었다.\n당신을 보자, 아무것도 없는 손을 펼쳤다.',
 '여울: 방울 하나만 찾아주실래요?\n제 동생 거예요.'
],null,[{text:'방금 숨기신 거요?',action:()=>openingReply('ask')},{text:'못 본 척하고 찾아준다.',action:()=>openingReply('pretend')}]);}
function openingReply(choice){speak('역무원 · 여울',[
 choice==='ask'?'여울: …보셨구나.\n그럼, 조금 늦게 찾아주시면 안 될까요?':'이야기: 당신은 모르는 척 고개를 끄덕였다.\n여울이 꼭 쥐고 있던 손을 천천히 폈다.',
 '여울: 저는 여울이에요. 성함은요?',
 '당신: …그걸 기억하지 못해요.',
 '여울: 접수 기록을 찾아볼게요.\n저는 안에서 기다릴 테니, 방울은 천천히 찾아주세요.'
],()=>{state.openingChoice=choice;state.met=true;toast('여울은 대합실로 돌아갔어요. 왼쪽 벤치 아래를 확인해보세요.');});}
function findHiddenBell(){speak('남겨진 기억',[
 '이야기: 방울 끈에 열차표와 영수증이 묶여 있었다.\n「반납 완료 · 어제 00:03 · 인수자: 여울」',
 '이야기: 방울을 쥐자 따뜻한 우유 냄새가 났다.\n빈 벤치에 두 자매가 겹쳐 보였다.',
 '나루: 언니, 내 컵에 왜 감자 그렸어?',
 '여울: 고래야. 위에 물 뿜고 있잖아.',
 '나루: 싹 났네.\n난 언니 컵으로 마실래.',
 '이야기: 두 사람은 같은 컵을 번갈아 들었다.\n방울이 식자, 벤치는 다시 비었다.'
],()=>{state.bell=true;state.ticket=true;tone(1046,1.8,.035);toast('방울과 어제의 영수증을 챙겼어요. 여울에게 이유를 물어보세요.');});}
function firstReply(question){speak('역무원 · 여울',[
 question==='again'?'여울: 동생 가방에 달려 있던 방울이에요.\n멀리서도 그 소리만 들으면 동생인 줄 알았죠.':'여울: 네. 접수 기록을 찾아볼게요.\n저는 여울이에요. 여기서 일하고요.',
 '이야기: 여울은 컵을 두 개 꺼냈다가 하나를 도로 넣었다.\n남은 컵에는 물을 뿜는 둥근 고래가 그려져 있었다.',
 '여울: 왼쪽 빨간 자판기에 물어봐 주세요.\n이 역에서 오가는 물건은 전부 기록하거든요.'
],()=>{state.firstQuestion=question;state.met=true;toast('빨간 자판기에서 방울의 기록을 확인하세요.');});}
function interact(){if(!active||!$('ending').hidden||modalOpen())return;if(conversation){advance();return;}const e=closest();if(!e){toast('조금 더 가까이 다가가 보세요.');return;}
 useEntity(e);
}
function useEntity(e){
 if(walkExits.has(e.id))exitContacts.add(e.id);
 if(secondJourney.handle(e.id)||fifthStory.handle(e.id)||fourthDay.handle(e.id)||thirdNight.handle(e.id)||secondNight.handle(e.id))return;
 switch(e.id){
 case 'keeper':
  if(openingPending()){openingScene();break;}
  if(!state.met)speak('역무원 · 여울',[
   "이야기: 역에는 젖은 외투 냄새가 남아 있었다.\n주머니를 뒤져도 표도, 집 열쇠도 나오지 않았다.",
   "속마음: 어디로 돌아가야 하지.\n집을 떠올리려는데, 내 이름부터 생각나지 않았다.",
   "여울: 여긴 분실물 보관소예요. 이름도 찾아드려요.\n먼저 방울 하나만 찾아주실래요?"
 ],null,[{text:'무슨 방울인데요?',action:()=>firstReply('again')},{text:'제 이름도 찾을 수 있어요?',action:()=>firstReply('name')}]);
  else if(state.ended)speak('역무원 · 여울',[
   "이야기: 여울은 쓰다 만 분실 신고서를 찢었다.",
   "여울: 또 숨길 생각이었냐고요?\n…이제 안 그래요."
 ]);
  else if(!state.bell)speak('역무원 · 여울',[state.opening==='witness'?'여울: 왼쪽 벤치 아래요.\n…어디 있는지 말씀드리면, 조금 덜 거짓말 같을까요?':!state.ticket?'여울: 왼쪽 빨간 자판기에 물어보세요.\n방울 기록을 꺼내줄 거예요.':!state.cat?'여울: 그 영수증은…\n일단 승강장을 살펴봐 주실래요?':'여울: 고양이가 왼쪽 벤치를 가리켰다고요?\n…거기 있었군요.']);
  else speak('역무원 · 여울',[
   state.opening==='witness'?'이야기: 당신은 방울과 어제의 영수증을 내려놓았다.\n당신: 왜 조금 늦게 찾아달라고 하셨어요?':"이야기: 당신은 방울과 영수증을 나란히 놓았다.\n당신: 어제 돌려받으셨다면서요.",
   ...(state.openingChoice?[state.openingChoice==='ask'?'여울: 아까, 숨긴 걸 바로 물으셨죠.\n그래서 이번에는 어디 있는지 모르는 척 못 했어요.':'여울: 아까 못 본 척해주셨죠.\n조금 더 기다려도 된다는 줄 알고, 안심했어요.']:[]),
   "여울: 제가 다시 숨겼어요.\n이게 마지막 분실물이거든요.",
   "여울: 전부 돌려주면 역을 닫아야 해요.\n동생은 제가 여기 있는 줄 알 텐데.",
   ...(state.opening==='witness'?['여울: 나루한테 먼저 바다에 가 있으라고 했어요.\n이번 주만 지나면 같이 가겠다고.']:[]),
   "이야기: 여울의 손이 빈 컵을 한 바퀴 돌렸다.\n고래 그림이 당신을 향했다가, 다시 여울을 향했다.",
   "여울: 아직도 컵을 두 개 꺼내요.\n걔는 늘 제 것부터 뺏어 마셨거든요.",
   "당신: 나루는 언니가 오길 기다리는 걸지도 몰라요.",
   "여울: …그럼, 이 방울은 어떻게 할까요?"
 ],null,[{text:'가지고 가서 동생을 찾아요.',action:()=>finish('carry')},{text:'문에 걸어요. 돌아오면 들리게.',action:()=>finish('hang')}]);
  break;
 case 'machine':
  if(state.opening==='witness'){speak('자판기 · 03호',[
   state.bell?'03호: 제 영수증이네요. 어제도 그 방울을 돌려드렸어요.\n오늘은 다시 분실 신고가 들어왔고요.':'03호: 방울이요? 어제 반납 처리가 끝났는데요.\n오늘 다시 잃어버리셨답니다.',
   '03호: 기계는 거짓말을 못 합니다.\n그래서 가끔 종이가 더 빨리 닳아요.'
  ]);break;}
  if(!state.met)speak('자판기 · 03호',['03호: 표를 찾으세요? 오른쪽 안내 데스크부터요.\n저한테는 동전 넣는 곳밖에 없습니다.']);
  else if(!state.ticket)speak('자판기 · 03호',[
   "03호: 방울은 어제 여울 씨한테 돌려드렸어요.\n분명히 서명도 받았는데.",
   "이야기: 기계가 영수증과 승강장 표를 뱉었다.\n「방울 반납 완료 · 어제 00:03 · 인수자: 여울」",
   "속마음: 어제 돌려받은 걸 왜 또 찾아달라는 걸까.\n안내 데스크를 보자 여울이 먼저 고개를 돌렸다.",
   "03호: 승강장 고양이에게 영수증을 보여주세요.\n어젯밤 일이라면 저보다 잘 알 겁니다."
 ],()=>{state.ticket=true;toast('주머니에 「내일행 표」를 넣었습니다.');});
  else speak('자판기 · 03호',[state.ended?'오늘의 무료 음료는 따뜻한 물입니다.\n종이컵은 없으니 마음으로 드세요.':'제 꿈은 바다가 보이는 곳으로 발령받는 거예요.\n염분 때문에 안 된대요. 현실적이죠?']);
  break;
 case 'board':speak('낡은 안내판',[
   "내일역 보관 규정\n마지막 분실물이 주인을 찾으면 영업을 종료합니다.",
   "「종료」 위에 종이가 덧붙어 있다.\n“분실 신고는 횟수 제한 없음.”",
   "인쇄된 규정 아래에는 작은 연필 글씨가 있다.\n“그럼 계속 잃어버리면?”"
 ]);break;
 case 'plant':speak('이름표 없는 화분',['흙은 촉촉하다. 누군가 매일 돌보고 있는 것 같다.','이름표 뒷면에 적혀 있다.\n“아무 소식 없는 날에도 물은 줄 것.”']);break;
 case 'door':case 'return':move(1-state.room);break;
 case 'cat':
  if(state.opening==='witness'&&!state.cat){speak('고양이',[
   state.bell?'고양이: 찾았네. 그 사람은 벌써 안으로 갔어.':'고양이: 숨기는 거 봤지?\n이번에도 못 본 척해주나 했네.',
   '당신: 잠깐. 너 말을 해?',
   '고양이: 넌 안 해?\n왜 숨겼는지는 그 사람한테 직접 물어봐.'
  ],()=>{state.cat=true;});break;}
  if(!state.ticket)speak('고양이',['야옹.','고양이는 빈 주머니를 쳐다본다.\n당신보다 사정을 잘 아는 눈치다.']);
  else if(!state.cat)speak('고양이',[
   "고양이: 내가 훔친 거 아냐.\n여울이 직접 벤치 밑에 넣는 걸 봤어.",
   "당신: 잠깐. 너 말을 해?",
   "고양이: 넌 안 해?\n방울은 왼쪽 벤치 밑. 영수증도 꼭 가져가."
 ],()=>{state.cat=true;toast('고양이가 왼쪽 벤치를 가리켰습니다.');});
  else speak('고양이',[state.ended?'좋은 밤이네.\n아직 아침이 안 왔다는 것만 빼면.':'기다리는 건 자신 있어. 고양이니까.\n하지만 저 사람은 고양이가 아니잖아.']);break;
 case 'bench':
  if(openingPending()){openingScene();break;}
  if(state.opening==='witness'&&!state.bell){findHiddenBell();break;}
  if(state.opening==='witness'&&state.bell){speak('방울에 남은 목소리',[
   '이야기: 벤치에 앉아 방울을 다시 쥐었다.\n이번에는 종이컵 대신 여행 가방이 보였다.',
   '나루: 언니, 이번에도 못 가?',
   '여울: 이번 주만 지나면 같이 가자.\n진짜로.',
   '나루: 알았어. 먼저 가서 기다릴게.\n바다 보이는 집을 구하면 편지할게.',
   '이야기: 여울이 입을 열기 전에 기억이 끝났다.\n나무 틈에는 「다음에는 꼭 같이 타기」가 새겨져 있었다.'
  ]);break;}
  if(state.bell)speak('오래된 벤치',['나무 틈 사이에 작은 글씨가 새겨져 있다.\n“다음에는 꼭 같이 타기.”']);
  else if(!state.cat)speak('오래된 벤치',['두 사람이 오래 앉았던 자리처럼\n가운데만 반질반질하다.','벤치 아래에서 무언가 반짝이지만 잘 보이지 않는다.\n근처의 고양이가 당신을 유심히 바라본다.']);
  else speak('남겨진 기억',[
   "이야기: 방울을 집자 손끝에 온기가 번졌다.\n식은 나무 냄새 사이로 달콤한 우유 냄새가 났다.",
   "이야기: 빈 벤치에 두 자매가 앉아 있었다.\n여울의 모자가 지금보다 조금 커 보였다.",
   "나루: 언니, 내 컵에 왜 감자 그렸어?",
   "여울: 고래야. 위에 물 뿜고 있잖아.",
   "나루: 싹 났네.\n난 언니 컵으로 마실래.",
   "이야기: 종이컵을 들던 작은 손이,\n어느새 여행 가방을 잡은 손으로 바뀌었다.",
   "나루: 언니, 이번에도 못 가?",
   "여울: 이번 주만 지나면 같이 가자.\n진짜로.",
   "나루: 알았어. 먼저 가서 기다릴게.\n바다 보이는 집을 구하면 편지할게.",
   "이야기: 여울이 입을 열기 전에 기억이 끝났다.\n손안에는 방울만 남았다. 조금 전까지 따뜻했던 것이.",
   "속마음: ‘다음에’라는 말이 이렇게 오래 남기도 하는구나.\n방울의 반납 도장 위에는 「분실」이 또 찍혀 있었다."
 ],()=>{state.bell=true;tone(1046,1.8,.035);toast('「작은 방울」을 찾았습니다. 역무원에게 돌아가세요.');});break;
 case 'clock':speak('멈춘 시계',['시계는 12시 7분을 가리키고 있다.','고장 난 것 같지는 않다.\n누군가 한 문장을 끝내기를 기다리는 것 같다.']);break;
 }
}
function showEnding({eyebrow,title,body,next}){window.tomorrowMetrics?.track('chapter_complete',{chapter:state.chapter});clearTimeout(toastTimer);$('toast').classList.remove('show');$('end-eyebrow').textContent=eyebrow;$('end-title').textContent=title;$('end-text').textContent=body;$('end-next-night').hidden=!next;$('end-next-night').textContent=nextChapterLabel();$('return').textContent=state.chapter>=6?'이곳에 조금 더 머무르기 →':state.chapter===4?'마을에 조금 더 머무르기 →':state.room===5?'열차에 조금 더 머무르기 →':'역에 조금 더 머무르기 →';$('credits-button').hidden=!(state.chapter===8&&state.journey2.eight.ended);$('ending').hidden=false;}
function finish(choice){speak('역무원 · 여울',(choice==='carry'?[
   "이야기: 여울은 방울을 주머니에 넣었다.\n여울: 이번엔 제가 찾아갈게요.",
   "여울: 만나면 컵에 그린 거, 고래였다고 해야지.\n아직도 감자라고 우길 것 같지만.",
   "여울: 이제 당신 이름을 찾아야죠.\n그 전에… 직접 보셔야 할 게 있어요."
 ]:[
   "이야기: 여울은 문에 방울을 걸고, 밖으로 나가봤다.\n여울: 여기서도 들리네요.",
   "여울: 맨날 안에서만 기다렸는데.\n…조금 걸어도 되겠어요.",
   "여울: 이제 당신 이름을 찾아야죠.\n그 전에… 직접 보셔야 할 게 있어요."
 ]).concat(Homecoming.read('one',state)),()=>{state.choice=choice;state.ended=true;save();objective();showEnding({eyebrow:'END OF THE FIRST NIGHT',title:choice==='carry'?'기다림을 데리고':'돌아올 자리',body:'이름을 맡기면 그 이름으로 살던 기억도 함께 흐려진다.\n좋았던 일까지.\n\n“제가 찾으러 와도, 이름은 돌려주지 마세요.”\n나는 무엇을 잊고 싶었던 걸까.',next:true});tone(523,2);});}
function begin(resume){
 if(!resume){
  const previous=active?state:readSave();
  if(previous){try{localStorage.setItem(SAVE+'-before-restart',JSON.stringify({...previous,savedAt:new Date().toISOString()}));}
   catch{$('save-status').textContent='이전 진행을 보관하지 못했어요. 저장 파일을 내보낸 뒤 다시 시작해주세요.';toast('이전 진행을 보관하지 못해 새 게임을 시작하지 않았어요.');return;}}
 }
 const loaded=resume?readSave():null;if(loaded&&!preserveLegacy(loaded))return;
 state=resume?(loaded||fresh()):{...fresh(),opening:'witness',room:1,x:181,y:219};
 active=true;clearInput();resetExitContacts();$('start').hidden=true;$('ending').hidden=true;closeDialogue();objective();canvas.focus({preventScroll:true});
 window.tomorrowMetrics?.track(resume?'game_resume':'game_start',{chapter:state.chapter});
 if(!resume){save();window.tomorrowMetrics?.track('chapter_start',{chapter:1});if(readRestartBackup())$('save-status').textContent='이전 진행은 불러오기 메뉴에 보관했어요.';}
 if(resume&&loaded&&legacySources.has(loaded)){save();toast('이전 진행을 별도로 보관했어요. 새 원고로 이어갑니다.');}
 if(openingPending())openingScene();
}
$('begin').onclick=()=>begin(false);$('continue').onclick=()=>begin(true);$('return').onclick=()=>{$('ending').hidden=true;canvas.focus({preventScroll:true});};$('restart').onclick=()=>{begin(false);save();};
$('next-night').onclick=$('end-next-night').onclick=()=>{const next=nextChapter();if(!next)return;$('ending').hidden=true;closeDialogue();if(next>=6)secondJourney.start(next);else if(next===5)fifthStory.start();else if(next===4)fourthDay.start();else if(next===3)thirdNight.start();else secondNight.start();window.tomorrowMetrics?.track('chapter_start',{chapter:state.chapter});};
$('journal-button').onclick=()=>{clearInput();$('journal-content').replaceChildren();let notes;
 if(state.chapter>=6)notes=secondJourney.journal();else if(state.chapter===5)notes=fifthStory.journal();else if(state.chapter===4)notes=fourthDay.journal();else if(state.chapter===3)notes=thirdNight.journal();else if(state.chapter===2)notes=secondNight.journal();else{notes=[!state.met?'나는 이름을 기억하지 못한다. 우선 역무원에게 말을 걸자.':'역무원 여울이 내 이름의 접수 기록을 찾아주기로 했다. 먼저 방울을 찾아달라고 한다.'];if(state.ticket)notes.push('영수증: 방울은 어제 여울에게 반납됐다. 내일행 표와 함께 승강장 고양이에게 보여주자.');if(state.cat)notes.push('고양이는 여울이 방울을 다시 숨기는 것을 봤다. 왼쪽 벤치 아래를 확인하자.');if(state.bell)notes.push('방울 속의 나루는 바다에서 언니를 기다리겠다고 했다. 여울에게 영수증과 함께 돌려주자.');if(state.ended)notes.push(state.choice==='carry'?'첫 번째 밤: 기다림을 데리고.':'첫 번째 밤: 돌아올 자리.');}
 if(state.chapter===1&&state.opening==='witness'){
  notes=['역무원이 벤치 밑에 방울을 숨기는 걸 봤다. 그런데 내게 찾아 달라고 했다.'];
  if(state.openingChoice)notes.push(state.openingChoice==='ask'?'방금 숨긴 것 아니냐고 물었다. 여울은 조금 늦게 찾아 달라고 했다.':'못 본 척해주었다. 여울은 손을 펴고, 천천히 찾아 달라고 했다.');
  if(state.met)notes.push('여울은 내 이름의 접수 기록을 찾으러 대합실로 갔다. 방울은 승강장 왼쪽 벤치 아래에 있다.');
  if(state.bell)notes.push('방울에 묶인 영수증: 어제 00:03, 인수자 여울. 방울 속의 나루는 고래 그림을 감자라고 놀리며 언니 컵을 뺏어 마셨다.');
  if(state.ended)notes.push(state.choice==='carry'?'여울은 방울을 가지고 동생을 찾아가기로 했다. 이제 내 이름을 찾을 차례다.':'여울은 문밖에서도 방울이 들리는지 확인했다. 이제 내 이름을 찾을 차례다.');
 }
 comfort.showJournal(notes);};$('close-journal').onclick=()=>{$('journal').close();canvas.focus({preventScroll:true});};
function appVisibility(hidden){clearInput();if(active)save();if(audio){if(hidden)audio.suspend();else if(sound)audio.resume();}}
window.addEventListener('tomorrow-app-state',e=>appVisibility(!e.detail.isActive));
window.addEventListener('tomorrow-back',e=>{clearInput();const dialogs=[...document.querySelectorAll('dialog[open]')];if(dialogs.length){dialogs[dialogs.length-1].close();e.preventDefault();}else if(conversation){closeDialogue();e.preventDefault();}if(active)save();});
window.addEventListener('keydown',e=>{if(modalOpen())return;if(e.target instanceof HTMLElement&&e.target.closest('button')&&['Enter',' '].includes(e.key))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter'].includes(e.key)&&active)e.preventDefault();if(e.key==='Escape'){closeDialogue();clearInput();return;}if(['e','E','Enter',' '].includes(e.key)&&!e.repeat){interact();return;}if(!e.repeat)keys.add(e.key.toLowerCase());});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{clearInput();if(active)save();});document.addEventListener('visibilitychange',()=>appVisibility(document.hidden));
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
function person(x,y,keeper=false){const step=!keeper&&moving?Math.sin(walkingTime*12)*1.5:0;rect(x-7,y-2,15,5,'#111a2588');rect(x-4,y-16,9,12,keeper?'#758580':'#d3ad72');rect(x-4,y-5,3,6+step,'#2c3444');rect(x+2,y-5,3,6-step,'#2c3444');rect(x-5,y-26,11,10,'#d4b7a1');rect(x-6,y-28,13,5,keeper?'#364b50':'#303643');rect(x-6,y-23,3,6,keeper?'#76838a':'#303643');rect(x+1,y-22,1,2,'#30303b');rect(x+5,y-17,3,8,keeper?'#657671':'#b28c58');if(!keeper){rect(x-5,y-16,11,3,'#b55b5b');rect(x-7,y-14,3,6,'#b55b5b');}else{rect(x-7,y-27,16,2,'#a2ac93');rect(x+1,y-14,2,2,'#dac58d');}}
function bench(x,y){rect(x-28,y+5,60,8,'#101d2888');rect(x-29,y-19,60,5,'#8b7256');rect(x-29,y-12,60,4,'#715e4c');rect(x-29,y-4,60,7,'#9b805b');rect(x-25,y+3,4,7,'#34424b');rect(x+23,y+3,4,7,'#34424b');rect(x-29,y-19,60,1,'#b6996a');}
function drawLobby(){rect(0,0,W,H,'#1a2a3a');rect(20,47,440,113,'#30434e');for(let x=20;x<460;x+=32){rect(x,47,1,107,'#394b54');}rect(20,47,440,4,'#718077');rect(20,154,440,5,'#7e8170');rect(20,159,440,118,'#3d4b50');for(let y=165;y<280;y+=22){rect(20,y,440,1,'#53605d');for(let x=20+(y%2)*12;x<460;x+=32)rect(x,y,1,22,'#46565a');}rect(0,277,480,11,'#142330');rect(16,48,7,230,'#1b2c3a');rect(458,48,7,230,'#1b2c3a');
 for(const x of [128,266]){rect(x,68,76,58,'#182c40');rect(x+3,71,70,51,state.chapter===5?'#aa9d8b':'#23394e');rect(x+36,70,3,54,'#6b7c7c');rect(x+3,95,70,3,'#617575');rect(x+5,117,66,3,'#435e65');if(state.chapter<5)for(let j=0;j<9;j++){const px=x+6+(j*19)%65,py=74+(j*13)%39;rect(px,py,1,1,'#a5c4c9');}rect(x-3,126,82,4,'#8a9280');}
 rect(188,71,59,35,'#1b2b34');rect(190,73,55,31,'#53646a');text(state.chapter>=3?thirdNight.stationName():'내일역',218,84,'#f0eed4',7,'center');text(stationTime(),218,99,'#ffe1a4',8,'center');
 rect(71,96,40,62,'#172936');rect(74,95,35,60,'#9a605d');rect(77,99,28,30,'#203e49');for(let i=0;i<6;i++){rect(80+(i%3)*8,104+Math.floor(i/3)*12,5,8,['#c5b584','#8ba99d','#af7d6a'][i%3]);}rect(77,132,19,3,'#dcc296');rect(99,132,4,8,'#e6c582');rect(81,145,17,5,'#343f46');glow(92,126,44,'#e8bd5f18');
 rect(316,143,72,26,'#22313a');rect(312,140,80,7,'#a18d6a');rect(317,149,70,17,'#52615d');rect(322,151,59,12,'#465551');text('분실물 보관소',351,159,'#f0eed4',6,'center');if(state.chapter!==5&&!(state.chapter===3&&state.night3.ended)&&!openingPending())person(348,141,true);rect(327,135,14,4,'#d4cbb3');rect(328,132,10,3,'#a7b6ad');
 if(state.chapter<5){rect(366,133,6,7,'#ddd5b9');rect(367,136,3,2,'#6898aa');rect(376,135,6,5,'#c4c2b0');rect(375,133,8,1,'#e5dfc6');}
 rect(416,138,17,19,'#986f58');rect(419,134,11,5,'#596653');for(let i=0;i<6;i++)rect(412+(i*7)%22,114+(i*9)%21,9,5,['#688e73','#86a281','#486f63'][i%3]);bench(162,188);bench(348,207);
 for(const x of [64,284,407]){rect(x,55,32,3,'#ddd3a3');glow(x+16,73,65,'#efd69b1c');}rect(209,271,63,6,'#a3b29a');text('↓ 승강장으로',240,265,'#edf1da',7,'center');if(state.ended&&state.choice==='hang'){rect(236,238,1,8,'#ac9169');rect(233,245,7,5,'#debd74');}
 if(state.chapter<5)secondNight.drawLobbyDoor();fifthStory.lobbyExtras();
}
function drawPlatform(){const evening=state.chapter===5;rect(0,0,W,H,evening?'#6e829b':'#182a3e');if(evening){rect(0,75,480,62,'#b29684');glow(382,62,58,'#f6d39b33');rect(373,53,18,18,'#f7d1a1');}else{for(let i=0;i<64;i++){let x=(i*71+13)%W,y=(i*37)%113;rect(x,y,1,1,i%4?'#526e86':'#b9c5ba');}glow(389,48,58,'#a4c5c61a');rect(382,37,15,15,'#c9d7c4');rect(389,35,12,13,'#182a3e');}for(let i=0;i<15;i++){let x=i*37;rect(x,97-(i%4)*7,27,46,'#203344');rect(x+8,107-(i%4)*7,3,4,'#7b86684d');}
 rect(0,137,480,8,'#0e1b2a');rect(0,146,480,2,'#697d82');rect(0,153,480,2,'#697d82');for(let x=0;x<480;x+=22)rect(x,148,9,4,'#2d3e4b');rect(20,162,440,113,'#45565b');rect(20,163,440,5,'#b2a574');for(let x=22;x<460;x+=8)rect(x,164,2,2,'#706c53');for(let y=189;y<274;y+=24)rect(20,y,440,1,'#58655f');rect(20,275,440,6,'#263b48');
 for(const x of [55,407]){rect(x,88,4,93,'#243e4a');rect(x-10,84,24,4,'#a2b3a5');rect(x-7,88,18,3,'#e4d3a0');glow(x+2,118,66,'#eddaa12a');}rect(231,77,7,61,'#2d424b');rect(220,91,31,27,'#7e928b');rect(223,94,25,21,'#233946');if(!(state.chapter===3&&state.night3.announced))text(stationTime(),236,107,'#dcd5a9',7,'center');bench(123,188);if((state.cat||state.chapter===1&&state.opening==='witness')&&!state.bell){rect(117,195,4,3,'#ead493');glow(119,195,12,'#f3d77b55');}if(openingPending())person(166,204,true);
 if(!(state.chapter===3&&state.night3.ended)){rect(339,174,19,5,'#1a2c35');rect(341,168,15,8,'#b4bfad');rect(349,160,9,10,'#c7cfb6');rect(349,158,3,4,'#c7cfb6');rect(356,158,3,4,'#c7cfb6');rect(351,164,1,2,'#263442');rect(356,164,1,2,'#263442');rect(337,166+Math.sin(time*2),6,3,'#b4bfad');}text('잠시 쉬어 가도 괜찮아요.',240,221,'#cad9d0',7,'center');rect(209,271,63,6,'#a3b29a');text('↓ 대합실로',240,263,'#edf1da',7,'center');thirdNight.drawPlatformExtras();fifthStory.platformExtras();}
const obstacles=[[{x:65,y:93,w:52,h:68},{x:307,y:125,w:86,h:47},{x:409,y:119,w:31,h:42},{x:129,y:164,w:69,h:36},{x:314,y:183,w:69,h:36}],[{x:91,y:164,w:67,h:35},{x:339,y:156,w:23,h:24}]];
function allowed(x,y){const blocks=secondJourney.obstacles[state.room]||fifthStory.obstacles[state.room]||fourthDay.obstacles[state.room]||thirdNight.obstacles[state.room]||secondNight.obstacles[state.room]||obstacles[state.room];return x>=29&&x<=449&&y>=floorY(state.room)&&y<=270&&!blocks.some(o=>x>o.x-5&&x<o.x+o.w+5&&y>o.y-1&&y<o.y+o.h+4);}
function frame(ms){
 const dt=Math.min((ms-last)/1000,.035);last=ms;
 const exploring=active&&!conversation&&$('ending').hidden&&!modalOpen()&&!document.hidden;
 // Keep the app scenery still. On the web, pause ambient motion while reading
 // or resting, and resume its clock without jumping to a new animation phase.
 if(exploring&&!nativeApp&&!motionPreference.matches)time+=dt;
 moving=false;
 if(exploring){
  let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
  const keyboard=!!(dx||dy);if(!keyboard){dx=touchInput.x;dy=touchInput.y;}
  const n=Math.max(1,Math.hypot(dx,dy));
  const speed=runToggle||keys.has('shift')?RUN_SPEED:WALK_SPEED+(keyboard?0:touchInput.pace)*(RUN_SPEED-WALK_SPEED);
  dx=dx/n*speed*dt;dy=dy/n*speed*dt;
  const x=state.x,y=state.y;
  if(allowed(state.x+dx,state.y))state.x+=dx;if(allowed(state.x,state.y+dy))state.y+=dy;
  const distance=Math.hypot(state.x-x,state.y-y);moving=distance>0;walkingTime+=distance/WALK_SPEED;
  walkThroughExit();
 }
 labelIndex=0;if(state.chapter>=5)fifthStory.drawScene(state.room);else [drawLobby,drawPlatform,secondNight.drawArchive,()=>secondNight.drawMemory(time),()=>thirdNight.drawSignalRoom(time),()=>thirdNight.drawCarriage(time),()=>fourthDay.drawHarbor(time),()=>fourthDay.drawCafe(time),()=>fourthDay.drawLighthouse(time),fifthStory.drawOffice,()=>fifthStory.drawGarden(time),...Array.from({length:6},(_,i)=>()=>secondJourney.draw(11+i,time))][state.room]();for(let i=labelIndex;i<worldLabels.length;i++)worldLabels[i].hidden=true;
 person(state.x,state.y);for(let i=0;i<18;i++){const x=(i*71+time*(i%3+1)*1.7)%480,y=60+(i*29+Math.sin(time+i)*5)%197;rect(x,y,1,1,'#d7d9b72e');}drawHints();
 const vignette=g.createRadialGradient(240,150,90,240,150,290);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#07111e8a');g.fillStyle=vignette;g.fillRect(0,0,W,H);ctx.drawImage(surface,0,0,960,576);requestAnimationFrame(frame);}
requestAnimationFrame(frame);window.addEventListener('beforeunload',()=>{if(active)save();});
})();
