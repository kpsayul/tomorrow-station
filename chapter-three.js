'use strict';

window.createThirdNight = function createThirdNight(api) {
 const {speak,toast,tone,save,objective,move,showEnding,rect,text,glow,g}=api;
 const state=()=>api.state(), progress=()=>state().night3;
 const address=()=>state().night2.choice==='name'?'온':'친구';
 const tracks=['어제','아직','이제'];
 const roles={store:'보관선',wait:'대기선',go:'출발선'};
 const colors={store:'#95b9e0',wait:'#e4c477',go:'#a6d6a0'};
 const answer=['store','wait','go'];
 const signalRoom=[
  {id:'signal-0',x:110,y:154,label:'어제의 신호',radius:30},
  {id:'signal-1',x:240,y:154,label:'아직의 신호',radius:30},
  {id:'signal-2',x:370,y:154,label:'이제의 신호',radius:30},
  {id:'inspector',x:80,y:214,label:'이름 없는 검표원',radius:30},
  {id:'console',x:240,y:205,label:'운행 제어대',radius:30},
  {id:'roof-back',x:240,y:265,label:'승강장으로',radius:24}
 ];
 const carriage=[
  {id:'rider-keeper',x:110,y:183,label:'여울',radius:30},
  {id:'rider-cat',x:350,y:203,label:'후추',radius:28},
  {id:'postcard',x:240,y:157,label:'사진 한 장',radius:28},
  {id:'sea-window',x:408,y:151,label:'창밖의 바다',radius:29},
  {id:'ride-back',x:240,y:265,label:'역 돌아보기',radius:24}
 ];
 const obstacles={
  4:[{x:79,y:124,w:62,h:42},{x:209,y:124,w:62,h:42},{x:339,y:124,w:62,h:42},{x:70,y:190,w:21,h:30},{x:213,y:184,w:54,h:29}],
  5:[{x:83,y:151,w:65,h:37},{x:321,y:177,w:58,h:30},{x:219,y:136,w:43,h:26}]
 };
 function roomEntities(room){
  if(room===4)return signalRoom;
  if(room===5)return carriage;
  const previous=api.previousEntities(room).map(e=>progress().ended&&e.id==='keeper'?{...e,label:'여울이 남긴 쪽지'}:progress().ended&&e.id==='cat'?{...e,label:'후추의 자리'}:e);
  if(room!==1)return previous;
  const p=progress();
  return [...previous.filter(e=>!(p.announced&&e.id==='clock')),{id:'roof-door',x:431,y:224,label:'신호실로',radius:26},...(p.announced?[{id:'train-door',x:240,y:176,label:'첫차에 오르기',radius:32}]:[])];
 }
 function stationName(){return progress().announced?(progress().choice==='rest'?'쉼표역':'다음역'):progress().board&&!progress().inspector?'□일역':'내일역';}
 function task(){
  const p=progress();
  let t;
  if(p.ended)t={step:'07 / 07',room:5,title:'첫 번째 아침 · 자유롭게 둘러보기',detail:'열차 안의 친구들과 창밖을 살펴보세요. 아래 출구로 역을 다시 돌아볼 수도 있어요.'};
  else if(!p.board)t={step:'01 / 07',room:0,id:'board',title:'내가 역을 닫아달라고 했다고?',detail:'대합실 위쪽 가운데 안내판에서 폐역 신청서를 확인하세요.'};
  else if(p.witnesses.length<3){const missing=['keeper','machine','cat'].find(id=>!p.witnesses.includes(id));t={step:'02 / 07',room:missing==='cat'?1:0,id:missing,title:`어제 떠나지 못한 이유 · ${p.witnesses.length} / 3`,detail:'여울, 03호, 후추에게 어제 무슨 일이 있었는지 물어보세요. 순서는 자유예요.'};}
  else if(!p.inspector)t={step:'03 / 07',room:4,id:'inspector',title:'신호실의 검표원',detail:'신호실 왼쪽 아래의 검표원에게 사라지는 역에 대해 물어보세요.'};
  else if(!p.signalDone){const missing=p.signals.findIndex(value=>!value);t={step:'04 / 07',room:4,id:missing<0?'console':`signal-${missing}`,title:'세 갈래 선로 연결하기',detail:'위쪽의 세 신호를 정한 뒤 가운데 운행 제어대에서 확인하세요. 단서는 검표원과 메모에 있어요.'};}
  else if(!p.announced)t={step:'05 / 07',room:4,id:'console',title:'역의 새 안내 방송',detail:'가운데 운행 제어대에서 이 역에 남길 안내 방송을 골라주세요.'};
  else t={step:'06 / 07',room:1,id:'train-door',title:'정말로 도착한 첫차',detail:'승강장 위쪽 가운데 열린 열차 문으로 걸어 들어가세요.'};
  if(state().room!==t.room){
   if(state().room===5){t.id='ride-back';t.detail='열차 아래 중앙에서 역으로 돌아가세요.';}
   else if(state().room===4){t.id='roof-back';t.detail='아래 중앙 출구에서 승강장으로 내려가세요.';}
   else if(state().room===3){t.id='memory-back';t.detail='아래 중앙 출구에서 현재의 기록실로 돌아가세요.';}
   else if(state().room===2){t.id='archive-back';t.detail='아래 중앙 출구에서 대합실로 돌아가세요.';}
   else if(state().room===1){t.id=t.room===5?'train-door':t.room===4?'roof-door':'return';t.detail=t.room===5?'위쪽 가운데 열차 문으로 들어가면 첫 번째 아침으로 돌아가요. 역을 더 둘러봐도 괜찮아요.':t.room===4?'승강장 오른쪽 아래의 새 계단으로 올라가세요.':'아래 중앙 출구에서 대합실로 돌아가세요.';}
   else {t.id='door';t.detail='대합실 아래 중앙 출구에서 승강장으로 이동하세요.';}
  }
  return t;
 }
 function start(){
  if(state().chapter!==2||!state().night2.ended)return;
  state().chapter=3;move(0,240,224);
  speak('이야기',[
   '이야기: 안내판의 「내일역」에서 첫 글자가 지워졌다.\n당신이 방금 지나온 문도, 손잡이부터 흐려지고 있었다.',
   '당신: 내 물건이라는 걸 확인했는데, 왜 역이 없어져요?',
   '03호: 마지막 보관품의 주인을 확인해서요.\n어제 접수된 폐역 신청이 지금 실행되고 있습니다.',
   '당신: 문 닫는다는 게… 역 자체를 없앤다는 뜻이었어요?',
   '03호: 네. 신청서에는 온 씨의 서명이 있어요.\n대합실 안내판에서 원본을 볼 수 있습니다.',
   '후추: 같이 보자. 네가 왜 그런 걸 썼는지.\n어제 네 옆에는 우리도 있었으니까.'
 ]);
 }
 function remember(id){if(!progress().witnesses.includes(id)){progress().witnesses.push(id);toast(`어제의 진술 ${progress().witnesses.length} / 3`);tone(440,.7);}if(progress().witnesses.length===3)toast('승강장 오른쪽 아래 신호실에 불이 켜졌습니다.');}
 function witness(id){
  const p=progress();
  if(!p.board){speak(id==='cat'?'후추':id==='machine'?'자판기 · 03호':'역무원 · 여울',['안내판부터 봐야겠어요.\n저 글자, 아까보다 하나 줄지 않았나요?']);return;}
  if(p.ended){
   if(id==='keeper')speak('여울이 남긴 쪽지',['[빈 안내 데스크에 작은 쪽지가 놓여 있다.]\n“바다에 다녀옵니다. 분실물은 자판기에게 맡겨주세요.”','아래에 아주 작은 글씨가 덧붙어 있다.\n“이번에는 휴가입니다.”']);
   else if(id==='cat')speak('후추의 자리',['고양이가 있던 자리에 털 몇 가닥이 남았다.\n근무표에는 큼직한 발자국 하나가 찍혀 있다.','자판기가 창밖으로 외쳤다.\n“그거 연차 신청서였어요? 결재도 안 받았는데!”']);
   else epilogue(id);
   return;
  }
  if(p.witnesses.includes(id)){
   speak(id==='cat'?'후추':id==='machine'?'자판기 · 03호':'역무원 · 여울',[
    id==='keeper'?'제가 방울을 다시 신고해서 당신 열차가 취소됐어요.\n그 얘기는 빼고 기다린다는 말만 했네요.':id==='machine'?'취소표는 남겨뒀습니다.\n기록을 없앤다고 없던 일이 되진 않으니까요.':`${address()}. 내가 못 간다는 건 확인한 말이 아니었어.\n백지에게 물어봐. 나도 대답을 들을게.`,
    p.announced?'첫차가 왔어요. 이번에는 타러 가요.':p.witnesses.length===3?'신호실에 불이 켜졌어요. 승강장 오른쪽 아래예요.':'다른 두 사람에게도 어제 일을 물어봐 주세요.'
   ]);return;
  }
  if(id==='keeper')speak('역무원 · 여울',[
   state().choice==='carry'?'여울: 어제 당신이 그만두고 떠나겠다고 했어요.\n이야기: 여울이 주머니 속 방울을 꼭 쥐었다.':'여울: 어제 당신이 그만두고 떠나겠다고 했어요.\n이야기: 여울이 문 위의 방울을 바라봤다.',
   '여울: 저도 같이 가겠다고 해놓고, 방울을 다시 숨겼어요.\n나루를 만나러 갈 용기가 안 나서요.',
   '당신: 그래서 내 열차도 취소된 거예요?',
   '여울: 네. 분실물이 남으면 첫차를 보내지 않는 규정이 있어요.\n알면서 그랬어요. 미안해요.',
   '여울: 당신은 한참 벤치에 앉아 있다가 신호실로 갔어요.\n돌아와서는, 이제 역을 닫을 거라고 했고요.',
   '여울: 이번에는 제가 무서워도, 당신을 붙잡지 않을게요.'
  ],()=>remember(id));
  else if(id==='machine')speak('자판기 · 03호',[
   '이야기: 03호가 표 두 장을 내밀었다. 취소된 승차권과 이름 보관 접수표였다.',
   '03호: 어제 그만두고 떠나겠다고 하셨습니다. 남은 물건을 다 돌려준 뒤였어요.',
   '03호: 그런데 방울이 다시 접수됐습니다. 여울 씨가 그 규정으로 출발을 막았어요.',
   '온: 그래서 내가 역을 닫아 달라고 했고.',
   '03호: 네. 다 돌려줘도 계속 여기 있어야 하느냐고요.',
   '이야기: 온은 이름 보관 접수표를 옆에 놓았다.',
   '온: 이건 그전부터 생각했어요?',
   '03호: 네. 아버지에게 여기 주소를 보내는 것도 봤습니다.',
   '온: 밖에 나가도, 엄마 생각은 따라올 테니까.',
   '03호: 역을 떠날 표와 기억을 맡길 종이를 따로 준비하셨습니다.',
   '03호: 폐역 신청은 00:05입니다. 이름을 맡기신 건 00:06이고요.',
   '온: 그 이름도 보관품이 됐구나.',
   '03호: 마지막 보관품의 주인이 확인되지 않아 처리가 멈췄습니다. 방금 주인이 확인돼 다시 진행되는 거고요.',
   '온: 신청을 받은 검표원한테 갈게요. 지금도 이걸 원하는지는 내가 말해야 하니까.'
 ],()=>remember(id));
  else speak('고양이 · 후추',[
   `${address()}. 어제 네가 여기 나갈 때 같이 가자고 했어.`,
   '후추: 난 네 기억에서 나온 고양이니까 못 나간다고 했어.\n확인해본 적도 없으면서. 네가 남겠다고 할 줄 알았거든.',
   '당신: 그럼 정말 못 가는지는 아직 모르는 거네.',
   '후추: 응. 신호실의 백지한테 같이 물어보자.\n이번에는 내가 바라는 대답을 먼저 말하지 않을게.'
  ],()=>remember(id));
 }
 function inspector(){
  if(progress().inspector){speak('검표원 · 백지',[
   '폐역 신청은 취소했습니다. 이제 열차를 따로 보내면 돼요.\n기억과 물건은 역에 두고, 사람은 떠날 수 있게요.',
   '어제 → 찾은 기억을 남기는 보관선.\n아직 → 찾지 않은 물건을 두는 대기선.\n이제 → 떠날 사람이 타는 출발선.'
  ]);return;}
  speak('이름 없는 검표원',[
   '이야기: 검표원이 책상 아래 정지 손잡이를 당겼다.\n창틀이 흐려지다 멈췄다. 모서리 하나는 아직 보이지 않았다.',
   '백지: 검표원 백지입니다. 폐역 처리를 잠시 멈췄어요.\n신청한 분이 돌아오셨으니, 취소할 수 있습니다.',
   '당신: 취소해주세요. 나는 여기서 나가고 싶었던 거지,\n돌아올 곳까지 없애고 싶었던 건 아니에요.',
   '백지: 그리고 후추도 탈 수 있습니다.\n기억에서 왔다는 이유로 못 타는 규정은 없어요.',
   '후추: …그거면 됐어. 나도 탈게.',
   '당신: 역을 남겨두면, 분실물 때문에 또 못 떠나는 거 아니에요?',
   '백지: 보관소와 열차의 출발 신호를 나누면 됩니다.'
 ],null,[
   {text:'떠나면, 여기 있던 일도 없어지나요?',action:()=>explain('leave')},
   {text:'아직 떠나고 싶지 않은 사람은요?',action:()=>explain('stay')}
  ]);
 }
 function explain(question){speak('검표원 · 백지',[
  question==='leave'?'백지: 없어지지 않아요. 돌려준 물건의 기억도 여기 남습니다.\n후추를 만났던 날도, 다시 보러 오실 수 있어요.':'백지: 역에 남아 쉬면 됩니다. 물건도 그대로 맡아두고요.\n그분이 준비될 때까지 다른 승객의 열차를 막을 필요는 없죠.',
   '백지: 「어제」에는 찾아간 물건의 기억이 있어요. 보관선으로.\n「아직」에는 주인을 기다리는 물건이 있어요. 대기선으로.',
   '백지: 「이제」는 떠날 사람의 승강장입니다. 출발선으로.\n위쪽 세 신호를 맞춘 뒤 가운데 제어대에서 확인하세요.',
   '당신: 왜 어제는 이 방법을 말 안 했어요?',
   '백지: 역을 닫아달라는 말만 처리했습니다.\n그 말 전에 무슨 일이 있었는지 묻지 않았어요.',
   '이야기: 백지가 신청서에 「취소」 도장을 찍었다.\n창틀이 돌아왔다. 당신은 손잡이를 한 번 쥐어보았다.'
],()=>{progress().inspector=true;toast('폐역 신청을 취소했습니다. 세 신호를 연결해 첫차를 보내세요.');});}
 function setSignal(index){
  const p=progress();if(!p.inspector){speak('신호 장치',['설명 없는 스위치가 셋 있다.\n왼쪽 아래 검표원에게 먼저 물어보자.']);return;}
  if(p.signalDone){speak(`${tracks[index]}의 신호`,[`${roles[p.signals[index]]}로 연결되어 있다.\n모든 마음이 같은 속도로 움직일 필요는 없다.`]);return;}
  speak(`${tracks[index]}의 신호`,[
   `${['찾은 기억','기다리는 물건','떠날 승객'][index]} · 현재 ${roles[p.signals[index]]||'연결 안 됨'}`
  ],null,Object.entries(roles).map(([value,label])=>({text:label,action:()=>{
   p.signals[index]=value;save();objective();tone({store:293.66,wait:349.23,go:440}[value],.6);toast(`「${tracks[index]}」 → ${label}`);
  }})));
 }
 function consolePanel(){
  const p=progress();
  if(p.announced){speak('운행 제어대',[`${stationName()} · 첫차 도착\n정차 중인 열차는 승강장 가운데에서 탈 수 있습니다.`]);return;}
  if(!p.inspector){speak('운행 제어대',['운행 허가를 기다리는 중이다.\n왼쪽 아래 검표원에게 말을 걸어보자.']);return;}
  if(!p.signalDone){
   const wrong=p.signals.map((value,index)=>value===answer[index]?null:index).filter(index=>index!==null);
   if(wrong.length){speak('운행 제어대',[
    '세 신호가 아직 같은 시간표를 읽지 못한다.',
    wrong.map(index=>`「${tracks[index]}」: ${roles[answer[index]]}가 필요하다.`).join('\n'),
    '설정을 잃지는 않았다.\n위쪽에서 필요한 신호만 바꾸고 돌아오면 된다.'
   ]);return;}
   speak('검표원 · 백지',[
    '이야기: 보관소의 등이 켜진 채로, 출발 신호가 초록색이 됐다.\n처음으로 두 불이 동시에 켜져 있었다.',
    '백지: 됐습니다. 누가 물건을 맡겨도 열차는 출발해요.\n역을 닫지 않아도, 당신은 떠날 수 있습니다.',
    '백지: 간판도 다시 달아야겠군요. 이름을 새로 붙여볼까요?\n떠나는 사람도 돌아오는 사람도 알아볼 수 있게.'
   ],()=>{p.signalDone=true;toast('제어대에서 새 안내 방송을 고를 수 있습니다.');});return;
  }
  speak('운행 제어대',[
   '이야기: 마이크에 작은 불이 들어왔다.\n당신은 새 이름으로 첫차를 안내하기로 했다.'
  ],null,[
   {text:'다음역 — 같이 다음으로 가는 곳.',action:()=>announce('next')},
   {text:'쉼표역 — 쉬었다 다시 가도 되는 곳.',action:()=>announce('rest')}
  ]);
 }
 function announce(choice){
  speak('당신의 안내 방송',choice==='next'?[
   '여기는 다음역입니다.\n혼자 가기 어려운 분은 옆자리의 사람에게 말을 걸어주세요.',
   '도착지를 아직 몰라도 괜찮습니다.\n함께 가다가 정해도 됩니다.',
   '[안내판에 새 글자가 번졌다.\n처음으로 시간표에 “도착”이라는 말이 나타났다.]'
  ]:[
   '여기는 쉼표역입니다.\n잠깐 쉬어가는 분도, 오래 걸린 분도 환영합니다.',
   '다시 가고 싶어지는 때에 타세요.\n기다리는 동안에도 당신의 하루는 계속됩니다.',
   '[지워지던 의자가 다시 또렷해졌다.\n그 옆으로, 출발을 알리는 작은 등이 켜졌다.]'
  ],()=>{const p=progress();p.choice=choice;p.announced=true;save();objective();tone(523,1.7);tone(659,1.7);toast('승강장에 첫차가 도착했습니다.');});
 }
 function boardTrain(){
  const p=progress();if(p.ended){move(5,240,235);return;}
  speak('첫차의 문 앞',[
   '이야기: 문이 열리자 찬 아침 공기가 발목을 감쌌다.\n당신은 타는 발판 앞에서, 아무도 부르지 않았는데 잠깐 멈췄다.',
   state().choice==='carry'?'여울: 이번엔 같이 가요.\n이야기: 주머니 속 방울이 먼저 딸랑 울렸다.':'여울: 방울은 여기 두고 가요.\n이야기: 그녀는 문을 한 번 밀어 소리를 확인하고 돌아섰다.',
   ...(state().openingChoice?[state().openingChoice==='ask'?'여울: 그날 바로 물어봐 주셔서 고마워요.\n안 그랬으면 또 잃어버린 척했을 거예요.':'여울: 그날 못 본 척해주셨죠.\n오늘은 먼저 보여드릴게요. 제가 끊은 표예요.']:[]),
   '03호: 바다 사진 한 장만 보내주세요.\n제 표도 같이 찍어주시면… 출장은 못 가니까요.',
   `후추: ${address()}, 자리는 맡아놨어.\n이야기: 후추가 창가 의자에 앞발을 올렸다.`,
   '여울이 가방을 고쳐 멨다.\n03호: 종이컵은 바다에도 있습니다.\n여울: 알아요. …펜도 있겠죠?',
   '후추는 창가에 앉고도 당신 소매를 놓지 않았다.\n당신이 좌석을 두 번 두드리자, 발톱이 하나씩 들어갔다.',
   '백지: 돌아오는 날짜는 나중에 쓰셔도 됩니다.\n이야기: 그가 빈 귀환란을 손가락으로 짚어 보였다.',
   '속마음: 두고 온 물건이 없는지 생각했다.\n이름, 편지, 옆자리의 고양이. 이번에는 나도 타고 있었다.'
  ],()=>{
   p.ended=true;move(5,240,235);showEnding({eyebrow:'END OF THE THIRD NIGHT',title:p.choice==='next'?'다음은 같이':'쉬어가도, 떠나도',body:(p.choice==='next'?'열차는 아직 이름 없는 다음으로 움직였다.\n이번에는 옆자리가 비어 있지 않았다.':'역에는 쉬어갈 자리가 남았다.\n열차에는 다시 시작할 자리가 생겼다.')+'\n\n여울은 나루에게서 한 번도 편지가 오지 않았다고 했다.\n그때 03호가 준 표에 오래된 우편 기록이 떴다.\n「발신: 나루 / 반송: 12통」\n\n여울이 먼저 표를 뒤집었다.\n후추는 이번에는 못 본 척하지 않았다.',next:true});tone(523,2);tone(783.99,2);
  });
 }
 function epilogue(id){
  if(id==='keeper'||id==='rider-keeper')speak('여울',[
   '창밖이 바다네요.\n사진보다 훨씬 시끄러워요. 그게 좋고요.',
   state().choice==='carry'?'방울이 기차 흔들림에 맞춰 울린다.':'여울은 돌아가는 표를 접어 가방에 넣었다.',
   '여울이 종이컵에 고래를 그렸다.\n몸통을 고칠수록 둥글어졌다. 결국 펜을 내려놓았다.',
   '“이렇게 그리면 꼭 감자라고 했어요.”\n여울은 컵을 구기지 않고 가방에 다시 넣었다.'
  ]);
  else if(id==='cat'||id==='rider-cat')speak('후추',[
   `${address()}. 나 지금 눈 감아도 되지?`,
   '“바다 나오면 깨워. 꼭.”\n후추는 벌써 눈을 감고 있었다.',
   '창밖이 파랗게 바뀌었다. 당신은 소매를 조금 당겼다.\n후추가 발을 더 꼭 쥐었다. 오 분쯤은 더 자도 될 것 같았다.'
  ]);
  else speak('자판기 · 03호',[
   '첫 번째 바다 사진이 도착했습니다.\n화면 밝기를 최대치로 해도 실제보다 어둡다네요.',
   '사진 속에 제 표도 있군요.\n출장 처리 가능한지 검표원에게 물어봐야겠습니다.',
   '오늘의 무료 음료는 따뜻한 물입니다.\n이번엔 종이컵도 있어요. 작은 발전이죠.'
  ]);
 }
 function handle(id){
  if(state().chapter!==3)return false;
  const p=progress();
  if(['keeper','machine','cat'].includes(id)){witness(id);return true;}
  if(id.startsWith('signal-')){setSignal(Number(id.slice(-1)));return true;}
  switch(id){
   case 'board':
    if(p.announced)speak('새 안내판',[`${stationName()} 이용 안내\n1. 늦어도 괜찮습니다.\n2. 먼저 가도 괜찮습니다.\n3. 돌아오면 반갑게 맞아드립니다.`, '맨 아래에 새 글씨가 있다.\n“분실물이 없어도 방문 가능.”']);
    else if(p.inspector)speak('돌아온 안내판',['폐역 신청: 취소 완료.\n간판의 글자가 다시 또렷해졌다.','신호실에서 보관소와 열차의 신호를 나누면\n역을 남겨두고도 떠날 수 있다.']);
    else if(p.board)speak('희미한 안내판',['어제 00:05, 내가 폐역을 신청했다.\n방금 마지막 보관품의 주인이 확인되어 역이 닫히는 중이다.','여울과 03호, 후추에게 어제 일을 듣고\n신호실의 검표원에게 취소를 요청하자.']);
    else speak('희미한 안내판',[
   '이야기: 안내판 아래에서 신청서가 나왔다.\n「폐역 신청 — 어제 00:05 / 신청인: 온」',
   '어제의 온: 더는 여기서 일하고 싶지 않습니다.\n남은 물건을 돌려주고 나면, 역을 닫아주세요.',
   '03호: 그 일 분 뒤 맡긴 이름이 마지막 보관품이 됐어요.\n방금 주인을 확인했으니, 신청한 대로 문을 닫는 겁니다.',
   '당신: 다 돌려주고 떠나려고 했는데, 출발이 다시 막혔구나.\n왜 그랬는지 직접 들어봐야겠어.',
   '03호: 신청을 받은 검표원은 승강장 옆 신호실에 있어요.\n그전에 저희 셋 이야기를 들어주세요. 빠진 일이 있습니다.'
 ],()=>{p.board=true;toast('세 친구에게 어제 무슨 일이 있었는지 물어보세요.');});return true;
   case 'roof-door':if(p.witnesses.length<3)speak('닫힌 계단',['계단 위는 아직 어둡다.\n여울, 03호, 후추에게 어제의 일을 먼저 물어보자.']);else move(4,240,244);return true;
   case 'roof-back':move(1,408,230);return true;
   case 'inspector':inspector();return true;
   case 'console':consolePanel();return true;
   case 'train-door':boardTrain();return true;
   case 'ride-back':move(0,240,224);return true;
   case 'rider-keeper':case 'rider-cat':epilogue(id);return true;
   case 'postcard':speak('사진 한 장',[
    '당신은 자판기의 표를 창가에 세우고 사진을 찍었다.\n바다보다 표가 크게 나왔다.',
    '잠시 뒤, 작은 글씨가 표에 나타났다.\n“잘 나왔네요. 프로필 사진으로 사용하겠습니다.”'
   ]);return true;
   case 'sea-window':speak('첫 번째 아침',[
    '창밖에서 물결이 계속 다른 모양으로 부서진다.',
    state().night2.choice==='name'?'유리창에 비친 이름표에 “온”이라고 적혀 있다.':'유리창에 비친 이름표는 아직 비어 있다.\n하지만 옆자리에는 당신을 부를 줄 아는 친구가 있다.',
    '문득, 미래의 나에게 쓸 편지가 한 줄 떠올랐다.\n“오늘은 괜찮았어. 너도 가끔 그랬으면 좋겠어.”'
   ]);return true;
   case 'clock':speak('움직이는 시계',['분침이 아주 천천히 움직이고 있다.','첫차를 부르려면 승강장 오른쪽 아래 신호실에서\n새로운 시간표를 만들어야 할 것 같다.']);return true;
   case 'bench':speak('오래된 벤치',['“다음에는 꼭 같이 타기.”','그 아래에 새로운 글씨를 적고 싶어졌다.\n“못 타더라도, 같이 앉아 있었던 건 남으니까.”']);return true;
   case 'plant':speak('이름표 없는 화분',['여울이 화분 옆에 작은 물뿌리개를 두었다.','돌보는 사람이 잠깐 떠나도\n다음 사람이 이어서 물을 줄 수 있도록.']);return true;
   case 'archive-door':move(2,240,245);return true;
   case 'archive-back':move(0,407,231);return true;
   case 'memory-back':move(2,240,241);return true;
   case 'recorder':speak('기억 재생기',['비가 내리던 날은 그대로 남아 있다.\n다시 들어가 잠깐 인사할 수 있을 것 같다.'],()=>move(3,240,237));return true;
   case 'ledger':speak('대출 장부',['기록 맨 앞에서 낡은 신청서를 발견했다.\n“혼자 기다리는 사람에게 의자를 하나 더 주세요.”','글씨는 당신의 것이었다.\n끝에 작은 발자국 하나가 서명처럼 찍혀 있다.']);return true;
   case 'rain':case 'whistle':case 'train':speak('그날의 물건',['기억은 제자리에 있다.\n다시 돌아오지 않는 날이어도, 사라진 날은 아니다.']);return true;
   case 'child':speak('우산을 쓴 아이',['나중의 나, 왔네.\n어쩐지 이번엔 길 잃은 얼굴이 아니야.','먼저 가도 돼.\n나는 여기서 고양이를 만나는 중이니까.']);return true;
   case 'memory-cat':speak('작은 고양이',['먀.','당신은 작은 머리를 한 번 쓰다듬었다.\n그리고 이번에는, 잘 가라는 말을 할 수 있었다.']);return true;
   case 'memory-sign':speak('도림역 간판',['도림역. 기억이 시작된 곳.','시간이 지나도, 시작한 곳까지 지워야 하는 건 아니다.']);return true;
  }
  return false;
 }
 function journal(){
  const p=progress(),notes=['세 번째 밤 — 첫차가 오는 방법. 역 이름이 흐려지는 건 폐역 신청이 실행되고 있기 때문이다.'];
  if(p.board)notes.push('어제 00:05 폐역 신청 → 00:06 이름 보관 → 방금 마지막 보관품의 주인 확인. 그래서 지금 역이 닫히기 시작했다.');
  for(const id of p.witnesses)notes.push({keeper:'여울은 떠나기 두려워 방울을 다시 숨겼다. 분실물이 남으면 출발을 막는 규정 때문에 내 열차도 취소됐다.',machine:'떠나려던 열차가 다시 막혀 폐역을 신청했다. 이름 보관은 그전부터 생각했던 별도의 선택이다. 어머니의 마지막 시기에서 잠시 쉬고 싶었고, 아버지에게 역의 주소도 보냈다.',cat:'후추는 밖에 못 나간다고 확인 없이 말했다. 이제 신호실의 백지에게 함께 물어보기로 했다.'}[id]);
  if(p.inspector)notes.push('폐역 신청 취소 완료. 후추도 탑승 가능. 남길 기억: 어제 → 보관선 / 기다리는 물건: 아직 → 대기선 / 떠날 사람: 이제 → 출발선. 제어대에서 연결을 확인하자.');
  if(p.signals.some(Boolean))notes.push('현재 신호: '+p.signals.map((value,i)=>`${tracks[i]}: ${roles[value]||'미정'}`).join(' · '));
  if(p.signalDone)notes.push(p.announced?'새 시간표와 안내 방송이 완성됐다.':'새 시간표 완성. 제어대에서 안내 방송을 고를 수 있다.');
  if(p.announced)notes.push(`${stationName()}에 첫차가 도착했다. 승강장 위쪽 가운데 열린 문으로 탑승.`);
  if(p.ended)notes.push('세 번째 밤, 그리고 첫 번째 아침. 열차 안의 친구들과 바다를 살펴보자.');
  return notes;
 }
 function drawSignalRoom(time){
  rect(0,0,480,288,'#202b3e');rect(22,50,436,111,'#37404b');rect(22,161,436,116,'#464d52');
  rect(29,56,422,47,'#243448');for(let i=0;i<32;i++)rect(38+(i*71)%403,61+(i*13)%33,1,1,'#a7c0c699');
  rect(29,99,422,4,'#97a7a0');rect(235,56,4,47,'#687d83');
  for(let y=174;y<277;y+=23)rect(22,y,436,1,'#606968');
  const p=progress();
  for(let i=0;i<3;i++){
   const x=110+i*130,color=colors[p.signals[i]]||'#77858f';
   rect(x-31,127,62,38,'#263640');rect(x-27,131,54,25,'#566368');rect(x-3,137,6,16,'#ccd0ae');rect(x-6,134,12,6,color);
   rect(x-4,106,8,11,color);glow(x,113,22,color+'33');
   text(tracks[i],x,124,'#e2eadf',7,'center');text(roles[p.signals[i]]||'연결 안 됨',x,178,color,6,'center');
  }
  rect(213,185,54,28,'#647276');rect(218,188,44,17,'#173341');for(let i=0;i<3;i++)rect(224+i*11,192,6,7,colors[p.signals[i]]||'#475d65');
  text(p.announced?'첫차 도착':p.signalDone?'방송 대기':'운행 제어',240,225,'#d0dfcd',6,'center');
  rect(73,188,15,22,'#a8aaa0');rect(76,180,9,11,'#d2c1aa');rect(72,177,17,5,'#4a626d');rect(72,182,17,2,'#bbc5bc');rect(76,210,4,6,'#283b47');rect(83,210,4,6,'#283b47');rect(72,193,17,2,'#dfd8b4');
  text('신호실',240,73,'#e4e8d4',8,'center');
  if(p.signalDone)glow(240,108,150,'#e8c88920');
  rect(209,271,63,6,'#b6c4ac');text('↓ 승강장으로',240,264,'#e6edd6',7,'center');
 }
 function drawCarriage(time){
  rect(0,0,480,288,'#35424b');rect(20,48,440,121,'#a1a08a');rect(20,169,440,110,'#6b6c65');
  for(const x of [37,181,325]){
   rect(x,67,119,72,'#485d63');rect(x+4,71,111,63,'#deb58b');rect(x+4,95,111,39,'#729ca6');
   for(let i=0;i<7;i++){const xx=(i*27-time*13)%107;rect(x+4+(xx+107)%107,102+(i%4)*7,13,1,'#dbddd0');}
   rect(x+15,115,76,1,'#c8c5a5');rect(x,138,119,5,'#c4b898');
  }
  rect(404,78,15,15,'#ffe0a5');glow(411,86,80,'#fbdca044');
  rect(83,158,65,25,'#637d78');rect(83,180,65,8,'#425e5b');rect(321,184,58,23,'#637d78');
  rect(106,161,10,12,'#d0b69d');rect(103,158,16,5,'#627970');rect(105,173,13,10,'#819285');rect(106,183,4,5,'#354955');rect(114,183,4,5,'#354955');
  rect(340,194,19,8,'#c9d1ba');rect(354,191,8,8,'#d6dbc4');rect(354,188,3,5,'#d6dbc4');rect(360,193,1,1,'#3c4f57');
  rect(219,146,43,15,'#8a7d69');rect(230,133,20,14,'#dfd1a6');rect(232,135,16,6,'#8aacaf');rect(232,141,16,3,'#d6b893');
  for(let y=211;y<278;y+=23)rect(20,y,440,1,'#818174');
  text('첫 번째 아침 · 바다가 보이는 자리',240,60,'#fff0d1',7,'center');rect(209,271,63,6,'#cdd0b2');text('↓ 역 돌아보기',240,264,'#fff0d1',7,'center');
 }
 function drawPlatformExtras(){
  if(state().chapter!==3)return;
  rect(414,200,34,48,'#283b46');for(let y=211;y<246;y+=7)rect(416,y,30,3,'#8b9180');text('↑ 신호실',431,195,'#e5dec1',6,'center');
  if(progress().announced){
   rect(25,79,430,76,'#a2b7b2');rect(25,80,430,5,'#dbe0c4');rect(25,139,430,8,'#ba8b70');
   for(const x of [43,115,287,359]){rect(x,93,57,34,'#34566b');rect(x+4,97,49,26,'#98b1b0');}
   rect(217,91,46,65,'#384d54');rect(221,95,38,61,'#e4d6a9');rect(221,152,38,7,'#dce4c2');
   text('첫차 · 탑승 가능',240,86,'#fcf0c9',7,'center');glow(240,168,65,'#e8d7a12d');
  }
 }
 return {start,task,handle,journal,roomEntities,obstacles,stationName,drawSignalRoom,drawCarriage,drawPlatformExtras};
};
