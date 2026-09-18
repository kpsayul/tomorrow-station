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
 function stationName(){return progress().announced?(progress().choice==='rest'?'쉼표역':'다음역'):progress().board?'□일역':'내일역';}
 function task(){
  const p=progress();
  let t;
  if(p.ended)t={step:'07 / 07',room:5,title:'첫 번째 아침 · 자유롭게 둘러보기',detail:'열차 안의 친구들과 창밖을 살펴보세요. 아래 출구로 역을 다시 돌아볼 수도 있어요.'};
  else if(!p.board)t={step:'01 / 07',room:0,id:'board',title:'사라진 역 이름',detail:'대합실 위쪽 가운데 안내판을 조사하세요. 분실물 표에 적힌 역이 달라지고 있어요.'};
  else if(p.witnesses.length<3){const missing=['keeper','machine','cat'].find(id=>!p.witnesses.includes(id));t={step:'02 / 07',room:missing==='cat'?1:0,id:missing,title:`친구들의 다음 이야기 · ${p.witnesses.length} / 3`,detail:'역무원, 자판기, 고양이에게 앞으로 하고 싶은 일을 물어보세요. 순서는 자유예요.'};}
  else if(!p.inspector)t={step:'03 / 07',room:4,id:'inspector',title:'신호실의 검표원',detail:'신호실 왼쪽 아래의 검표원에게 사라지는 역에 대해 물어보세요.'};
  else if(!p.signalDone){const missing=p.signals.findIndex(value=>!value);t={step:'04 / 07',room:4,id:missing<0?'console':`signal-${missing}`,title:'세 갈래 선로 연결하기',detail:'위쪽의 세 신호를 정한 뒤 가운데 운행 제어대에서 확인하세요. 단서는 검표원과 메모에 있어요.'};}
  else if(!p.announced)t={step:'05 / 07',room:4,id:'console',title:'역의 새 안내 방송',detail:'가운데 운행 제어대에서 이 역에 남길 안내 방송을 골라주세요.'};
  else t={step:'06 / 07',room:1,id:'train-door',title:'정말로 도착한 첫차',detail:'승강장 위쪽 가운데 열린 열차 문으로 가세요. E 또는 Enter로 탑승할 수 있어요.'};
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
  speak('역내 방송',[
   '치직—. 이번 분실물은…\n이번 분실물은……',
   '[방송이 역의 이름을 발음하지 못했다.\n안내판에서 글자 한 획이 눈처럼 떨어졌다.]',
   '자판기가 처음으로 농담 없이 말했다.\n“저기요. 방금 출구가 잠깐 없어졌는데요.”',
   '[당신은 분실물 표를 뒤집었다.]\n반납할 곳: 아직 정하지 않음.'
  ]);
 }
 function remember(id){if(!progress().witnesses.includes(id)){progress().witnesses.push(id);toast(`다음 이야기 ${progress().witnesses.length} / 3`);tone(440,.7);}if(progress().witnesses.length===3)toast('승강장 오른쪽 아래 신호실에 불이 켜졌습니다.');}
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
    id==='keeper'?'동생을 기다리던 이야기는 끝나지 않았어요.\n하지만 제 내일이 전부 기다림일 필요는 없겠죠.':id==='machine'?'저는 계속 여기 있어도 돼요.\n여러분의 사진이 오면, 여기도 다른 곳이 되니까.':`${address()}. 다음에 만날 날짜를 몰라도 괜찮아.\n약속이 꼭 시간표일 필요는 없잖아.`,
    p.announced?'첫차가 왔어요. 이번에는 타러 가요.':p.witnesses.length===3?'신호실에 불이 켜졌어요. 승강장 오른쪽 아래예요.':'다른 친구들은 어떤 생각인지도 물어봐 주세요.'
   ]);return;
  }
  if(id==='keeper')speak('역무원 · 여울',[
   state().choice==='carry'?'[여울이 주머니 속 방울을 꼭 쥐었다.]':'[여울이 문 위의 방울을 바라봤다.]',
   '누군가 돌아올 곳을 지키면 되는 줄 알았어요.\n그런데 제가 가고 싶은 곳은 한 번도 묻지 않았네요.',
   '바다에 가고 싶어요. 동생을 만나기 위해서도 맞지만…\n그냥 제가 바다를 보고 싶어서요.',
   '만나면 사과부터 쏟아내지 않을래요.\n배는 고픈지, 오늘 날씨는 좋은지, 그런 것부터.',
   '그 애가 아직 준비가 안 됐다면 기다릴 수 있어요.\n이번에는 제 하루도 살면서요.'
  ],()=>remember(id));
  else if(id==='machine')speak('자판기 · 03호',[
   '저는 바다에 못 갑니다.\n바퀴도 없고 방수도 안 되고, 멀미도 할 것 같고요.',
   '…그래서 한 가지 부탁을 바꿔보려고요.',
   '바다 사진을 보내주세요.\n여러분이 본 쪽의 바다로요.',
   '누가 보냈는지마다 다른 바다가 오겠죠.\n그럼 제 화면도 맨날 같은 상품 목록만 보여주진 않겠네요.',
   '대신 돌아오시면 음료 하나씩 드릴게요.\n재고가 생기면요. 약속에는 작은 글씨가 중요합니다.'
  ],()=>remember(id));
  else speak('고양이 · 후추',[
   `${address()}. 너도 이제 물어보는구나.\n내가 뭘 잃어버렸는지 말고, 뭘 하고 싶은지.`,
   '나는 네가 없는 오후에도 낮잠을 자고 싶어.\n돌아오는 발소리만 세지 않고.',
   '그렇다고 네가 안 왔으면 좋겠다는 뜻은 아니야.\n오면 좋지. 아주 많이.',
   '다만 다음에 올 땐 길을 잃어서가 아니었으면 해.\n그냥 내가 보고 싶어서 와.',
   '그리고 창가 자리는 내 거야.\n감동적인 대화 중에도 협상할 건 해야지.'
  ],()=>remember(id));
 }
 function inspector(){
  if(progress().inspector){speak('검표원 · 백지',[
   '어제의 기억은 보관선.\n아직 준비되지 않은 마음은 대기선.\n이제 가고 싶은 마음은 출발선.',
   '위쪽 세 신호를 각각 맞추고 제어대에서 확인하세요.\n틀려도 누군가의 열차가 사라지진 않으니 천천히 하셔도 됩니다.'
  ]);return;}
  speak('이름 없는 검표원',[
   '성함이… 아, 제 이름을 먼저 말씀드리는 게 순서겠네요.\n백지입니다. 서류가 잘 기억하는 이름이죠.',
   '역이 없어지는 이유를 찾으러 오셨군요.\n누가 잘못해서 벌어지는 일은 아닙니다.',
   '이 역은 오래전 당신이 만든 기다림에서 시작됐습니다.\n혼자 기다리는 사람에게 의자를 하나 더 놓는 상상으로요.',
   '그러다 의자가 늘고, 이름표가 붙고,\n분실물을 대신 찾아주는 곳이 됐지요.',
   '다만 등록된 시간표가 이렇습니다.\n“떠나는 날: 내일.” 오늘이 와도 또 내일.',
   '이제 여러분이 다른 내일을 원하니\n예전 시간표로는 역을 붙잡아둘 수 없는 겁니다.',
   '없애야 한다는 뜻은 아닙니다.\n어떻게 이어갈지 고칠 수 있다는 뜻이지요.'
  ],null,[
   {text:'떠나면, 여기 있던 일도 없어지나요?',action:()=>explain('leave')},
   {text:'아직 떠나고 싶지 않은 사람은요?',action:()=>explain('stay')}
  ]);
 }
 function explain(question){speak('검표원 · 백지',[
  question==='leave'?'아뇨. 도착했다고 출발역이 없던 일이 되진 않죠.\n기억은 짐이 될 수도 있지만, 주소가 될 수도 있습니다.':'그분에게 출발을 강요하면 역이 아니라 밀어내는 문이죠.\n기다릴 자리도 남기면 됩니다.',
  '어제는 지우지 말고 보관선으로.\n아직은 재촉하지 말고 대기선으로.\n이제는 붙잡지 말고 출발선으로.',
  '위쪽의 세 신호를 정해주세요.\n그다음, 이 역에서 어떤 안내 방송을 할지 고르면 됩니다.',
  '참고로 저는 검사하러 온 사람이 아닙니다.\n마지막까지 남아 문을 잠그는 사람이었죠.',
  '오늘은 다른 일을 할 수 있을 것 같네요.'
 ],()=>{progress().inspector=true;toast('세 신호의 단서를 메모에 적었습니다.');});}
 function setSignal(index){
  const p=progress();if(!p.inspector){speak('신호 장치',['설명 없는 스위치가 셋 있다.\n왼쪽 아래 검표원에게 먼저 물어보자.']);return;}
  if(p.signalDone){speak(`${tracks[index]}의 신호`,[`${roles[p.signals[index]]}로 연결되어 있다.\n모든 마음이 같은 속도로 움직일 필요는 없다.`]);return;}
  speak(`${tracks[index]}의 신호`,[
   `표지에 “${tracks[index]}”라고 적혀 있다.\n현재 연결: ${roles[p.signals[index]]||'정하지 않음'}\n\n이 선로를 어디로 연결할까?`
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
    '[파란 불은 뒤를 비췄다.\n노란 불은 빈 의자를, 초록 불은 아직 없는 길을 비췄다.]',
    '좋습니다. 이제 기다리는 사람과 떠나는 사람이\n같은 역에 있어도 되겠군요.',
    '마지막으로 안내 방송을 부탁드립니다.\n이번에는 “내일” 말고, 이 역이 어떤 곳인지요.'
   ],()=>{p.signalDone=true;toast('제어대에서 새 안내 방송을 고를 수 있습니다.');});return;
  }
  speak('운행 제어대',[
   '[마이크에 작은 불이 들어왔다.]\n누군가 이 역에 처음 온다면, 어떤 말을 들려주고 싶을까?'
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
   '[열차의 문이 열렸다.\n뜨거운 철 냄새 대신 아침 공기 냄새가 났다.]',
   state().choice==='carry'?'여울이 주머니의 방울을 한 번 울렸다.\n“이젠 찾으러 가는 쪽에서도 소리가 나겠네요.”':'문 위의 방울은 역에 남았다.\n여울은 뒤돌아보며 웃었다. “돌아올 때 들을 수 있겠죠.”',
   '자판기가 표 한 장을 내밀었다.\n“저 대신 창가에 놓아주세요. 사진 찍을 때 같이 나오게.”',
   `후추가 먼저 올라탔다.\n“${address()}, 빨리 와. 느긋하게 와도 되고. 자리는 맡아놨어.”`,
   '[검표원 백지가 빈 표를 당신에게 건넸다.]\n“돌아오는 날짜는 나중에 쓰셔도 됩니다.”',
   '당신은 마지막으로 역을 바라봤다.\n떠나는 사람을 바라보면서도, 역은 사라지지 않았다.'
  ],()=>{
   p.ended=true;move(5,240,235);showEnding({eyebrow:'END OF THE THIRD NIGHT',title:p.choice==='next'?'다음은 같이':'쉬어가도, 떠나도',body:(p.choice==='next'?'열차는 아직 이름 없는 다음으로 움직였다.\n이번에는 옆자리가 비어 있지 않았다.':'역에는 쉬어갈 자리가 남았다.\n열차에는 다시 시작할 자리가 생겼다.')+'\n\n당신은 편지 뒷면에 처음으로 답장을 썼다.\n“나를 데리러 와줘서 고마워.\n오늘은 내가 우리를 데리고 갈게.”\n\n— 세 번째 밤, 그리고 첫 번째 아침 —',next:true});tone(523,2);tone(783.99,2);
  });
 }
 function epilogue(id){
  if(id==='keeper'||id==='rider-keeper')speak('여울',[
   '창밖이 바다네요.\n사진보다 훨씬 시끄러워요. 그게 좋고요.',
   state().choice==='carry'?'방울이 기차 흔들림에 맞춰 울린다.':'여울은 돌아가는 표를 접어 가방에 넣었다.',
   '동생을 만나면 할 말을 적었는데,\n세 장이나 써놓고 첫 줄만 남겼어요.',
   '“배고프지 않아?”\n나머지는 같이 밥 먹으면서 생각하려고요.'
  ]);
  else if(id==='cat'||id==='rider-cat')speak('후추',[
   `${address()}. 나 지금 눈 감아도 되지?`,
   '자는 동안 네가 없어질까 봐 깨 있는 건,\n고양이한테 꽤 큰 손해거든.',
   '[후추가 당신의 옆에서 몸을 둥글게 말았다.]\n이번엔 발소리를 세지 않고 잠들었다.'
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
    else if(p.board)speak('희미한 안내판',['역을 붙잡는 데 필요한 건\n같은 하루를 되풀이할 이유가 아니라, 다음 날의 이야기인 것 같다.','역무원과 자판기, 승강장의 고양이에게 물어보자.']);
    else speak('희미한 안내판',[
     '[“내일역”의 첫 글자가 사라졌다.]\n글자 뒤에는 벽도, 하늘도 없었다. 그냥 빈칸이었다.',
     '분실물 표의 빈칸에 문장이 나타났다.\n“이 역이 앞으로 필요한 이유를 적어주세요.”',
     '여울이 조용히 물었다.\n“우리가 기다리던 일이 끝나면, 여기도 끝나는 걸까요?”',
     '후추가 창밖에서 끼어들었다.\n“일단 물어봐. 우리 아직 안 한 얘기 많잖아.”'
    ],()=>{p.board=true;toast('세 친구에게 앞으로 하고 싶은 일을 물어보세요.');});return true;
   case 'roof-door':if(p.witnesses.length<3)speak('닫힌 계단',['계단 위는 아직 어둡다.\n세 친구의 다음 이야기를 먼저 들어보자.']);else move(4,240,244);return true;
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
  const p=progress(),notes=['세 번째 밤 — 첫차가 오는 방법. 이번 분실물은 내일역 그 자체.'];
  if(p.board)notes.push('안내판: 이 역이 앞으로 필요한 이유를 찾아야 한다.');
  for(const id of p.witnesses)notes.push({keeper:'여울: 기다리기만 하는 대신, 자신이 보고 싶은 바다에 가고 싶다.',machine:'03호: 친구들이 본 바다 사진을 받아 자신의 화면으로 보여주고 싶다.',cat:`후추: 기다림만 세지 않고 낮잠도 자고 싶다. ${address()}가 보고 싶어서 다시 와주길 바란다.`}[id]);
  if(p.inspector)notes.push('신호 단서: 어제 → 보관선 / 아직 → 대기선 / 이제 → 출발선. 위쪽 세 신호를 맞추고 가운데 제어대에서 확인.');
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
