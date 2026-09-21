'use strict';

// An additional episode, kept separate so later nights can grow independently.
window.createSecondNight = function createSecondNight(api) {
 const {speak,toast,tone,save,objective,move,showEnding,rect,text,glow,person,g}=api;
 const state=()=>api.state();
 const progress=()=>state().night2;
 const archive=[
  {id:'rain',x:90,y:158,label:'노란 우산',radius:32},
  {id:'whistle',x:214,y:150,label:'작은 호루라기',radius:33},
  {id:'train',x:358,y:157,label:'장난감 열차',radius:32},
  {id:'recorder',x:240,y:210,label:'기억 재생기',radius:31},
  {id:'ledger',x:405,y:218,label:'대출 장부',radius:28},
  {id:'archive-back',x:240,y:264,label:'대합실로',radius:24}
 ];
 const memory=[
  {id:'child',x:151,y:181,label:'우산을 쓴 아이',radius:30},
  {id:'memory-cat',x:341,y:200,label:'작은 고양이',radius:28},
  {id:'memory-sign',x:399,y:161,label:'낡은 역 이름',radius:29},
  {id:'memory-back',x:240,y:264,label:'기록실로',radius:24}
 ];
 const names={rain:'빗소리',whistle:'휘파람',train:'열차 소리'};
 const obstacles={
  2:[{x:65,y:121,w:51,h:43},{x:188,y:119,w:52,h:38},{x:332,y:123,w:52,h:40},{x:215,y:183,w:50,h:33},{x:387,y:192,w:37,h:29}],
  3:[{x:122,y:146,w:53,h:40},{x:330,y:185,w:22,h:20},{x:389,y:114,w:18,h:49}]
 };
 function roomEntities(room){
  if(room===2)return archive;
  if(room===3)return memory;
  if(room===0&&state().chapter>=2)return [...api.baseEntities[0],{id:'archive-door',x:431,y:224,label:'기록실로',radius:26}];
  return api.baseEntities[room];
 }
 function task(){
  const n=progress();
  if(n.ended)return {step:'완료',title:'두 번째 밤을 마쳤어요',detail:'역무원과 자판기, 고양이에게 다시 말을 걸어보세요. 당신을 부르는 말이 달라졌어요.'};
  let t;
  if(!n.met)t={step:'01 / 06',room:0,id:'keeper',title:'새로 도착한 편지',detail:'오른쪽 위 역무원에게 새 방송에 대해 물어보세요.'};
  else if(!n.tuned){
   const missing=['rain','whistle','train'].find(id=>!n.clues.includes(id));
   t=missing?{step:'02 / 06',room:2,id:missing,title:`기록실의 기억 모으기 · ${n.clues.length} / 3`,detail:'노란 우산, 호루라기, 장난감 열차를 조사하세요. 각 물건의 이야기에 소리의 순서가 숨어 있어요.'}:{step:'03 / 06',room:2,id:'recorder',title:'세 소리의 순서 맞추기',detail:'기록실 가운데 재생기에서 기억을 재생하세요. 주머니 속 메모에 단서가 적혀 있어요.'};
  }else if(!n.remembered)t={step:'04 / 06',room:3,id:'child',title:'기억 속의 아이',detail:'비 오는 역의 왼쪽, 노란 우산을 쓴 아이에게 다가가세요.'};
  else if(!n.catName)t={step:'05 / 06',room:1,id:'cat',title:'고양이의 진짜 이름',detail:'현재의 승강장으로 돌아가 고양이에게 기억 속 이름을 불러주세요.'};
  else t={step:'06 / 06',room:0,id:'keeper',title:'편지의 받는 사람',detail:'역무원에게 돌아가 편지를 열어보세요.'};
  if(state().room!==t.room){
   if(state().room===3){t.id='memory-back';t.detail='아래 중앙 출구에서 기록실로 돌아가세요.';}
   else if(state().room===2){t.id=t.room===3?'recorder':'archive-back';t.detail=t.room===3?'가운데 재생기를 조사하면 기억 속으로 다시 들어갈 수 있어요.':'아래 중앙 출구로 나가 대합실로 돌아가세요.';}
   else if(state().room===1){t.id='return';t.detail='아래 중앙 출구로 나가 대합실로 돌아가세요.';}
   else if(t.room===1){t.id='door';t.detail='아래 중앙 출구에서 승강장으로 이동하세요.';}
   else {t.id='archive-door';t.detail='대합실 오른쪽 아래 새로 열린 문에서 기록실로 들어가세요.';}
  }
  return t;
 }
 function start(){
  if(!state().ended||state().chapter!==1)return;
  state().chapter=2;move(0,240,224);
  speak('역내 방송',[
   "“보관품 주인 확인. 봉인된 편지를 반환합니다.”\n서랍 안에서 종이 찢어지는 소리가 났다.",
   "여울이 글씨 지워진 봉투를 들고 나왔다.\n“분명 어제 당신이 넣었는데… 글씨가 전부 없어졌어요.”",
   "봉투에 한 문장만 남아 있었다.\n「읽지 않은 것으로 해주세요.」"
 ]);
 }
 function recordClue(id){
  if(!progress().clues.includes(id)){progress().clues.push(id);toast(`기억에 「${names[id]}」를 담았습니다.`);tone({rain:293.66,whistle:440,train:329.63}[id],1);}
 }
 function puzzle(){
  const n=progress();
  if(n.tuned){speak('기억 재생기',['녹음된 비가 유리 안쪽을 두드린다.\n재생 버튼에 손을 대자 역의 풍경이 달라졌다.'],()=>move(3,240,237));return;}
  if(n.clues.length<3){speak('기억 재생기',[`재생기에 세 개의 빈 홈이 있다.\n지금 찾은 소리는 ${n.clues.length}개다.`, '우산, 호루라기, 장난감 열차에 남은 기억을 먼저 들어보자.']);return;}
  const sequence=n.sequence.map(id=>names[id]).join(' → ');
  const options=['rain','whistle','train'].filter(id=>!n.sequence.includes(id)).map(id=>({text:names[id],action:()=>{
   n.sequence.push(id);save();tone({rain:293.66,whistle:440,train:329.63}[id],.6);
   if(n.sequence.length<3){puzzle();return;}
   if(n.sequence.join(',')==='rain,whistle,train'){
    speak('기억 재생기',['빗소리. 누군가의 서툰 휘파람.\n그제야, 멀리서 열차가 들어온다.','세 소리가 한 장면에 포개졌다.\n기록실 바닥으로 물방울 하나가 떨어진다.','…이번엔 녹음이 아니다.'],()=>{n.tuned=true;move(3,240,237);toast('두 번째 밤 · 비가 그치기 전');});
   }else {n.sequence=[];save();speak('기억 재생기',['열차가 지나갔는데, 아무도 아직 만나지 못했다.\n소리의 순서가 어딘가 어긋나 있다.','우산: 처음엔 비밖에 없었다.\n호루라기: 아이가 불자 고양이가 다가왔다.\n열차: 둘이 만난 다음에 도착했다.','재생기가 처음으로 돌아갔다.\n틀린 기억을 남기지는 않는 모양이다.']);}
  }}));
  if(n.sequence.length)options.push({text:'처음부터 맞추기',action:()=>{n.sequence=[];save();puzzle();}});
  speak('기억 재생기',[`${sequence||'아직 아무 소리도 없다.'}\n\n${n.sequence.length+1}번째에 들렸던 소리를 고르세요.`],null,options);
 }
 function finalLetter(){
  const n=progress();
  if(n.ended){speak('역무원 · 여울',[n.choice==='name'?'온 씨. 이상하죠? 처음 불러보는데 낯설지가 않아요.':'이름 칸은 비워뒀어요. 빈칸도 잘 보관하는 게 제 일이니까요.','아, 바다에 갈 때 자판기 사진도 찍어오려고요.\n본인은 방수 처리가 안 돼서 못 간대요.']);return;}
  speak('역무원 · 여울',[
   "봉투에 글씨가 돌아왔다.\n「어른이 된 온에게. 숙제니까 끝까지 읽기.」",
   "“아빠는 결국 왔어. 빵도 있었어.\n그런데 내가 왜 울었는지는 몰랐어.”",
   "“아빠가 집에 가자고 했는데 발을 못 뺐어.\n후추가 내 신발 위에서 자고 있었거든.”",
   "“그래서 아빠도 같이 앉았어. 빵이 다 식을 때까지.\n바다 가면 꼭 적어줘. 후추 말고 네 얘기도.”",
   "봉투 뒷면에는 어제의 당신이 남긴 답이 있었다.\n「미안. 오늘은 못 가. 내일 갈게.」",
   "그 아래에도, 그 아래에도 같은 문장.\n연필은 마지막 줄에서 종이를 뚫었다.",
   "여울은 펜을 내려놓았다.\n“이름을 돌려드릴까요. 편지만 가져가셔도 돼요.”"
 ],null,[
   {text:'온. 내 이름을 돌려받을래요.',action:()=>end('name')},
   {text:'이름은 조금 더 맡길게요. 편지는 가져갈래요.',action:()=>end('letter')}
  ]);
 }
 function end(choice){
  const n=progress();n.choice=choice;
  speak('역무원 · 여울',choice==='name'?[
   "“온.”\n여울이 이름표를 내밀었다. 당신은 직접 옷깃에 달았다.",
   "후추가 문밖에서 두 번 불렀다.\n한 번은 작게, 다음은 당신이 돌아볼 때까지.",
   "서랍이 닫히자 안내판에서 소리가 났다.\n「마지막 보관품: 주인 확인 완료. 영업 종료 절차 시작.」"
 ]:[
   "당신은 편지를 챙기고 이름표는 서랍에 뒀다.\n여울은 이번에는 서랍을 잠그지 않았다.",
   "“이름 없이도 돌려받은 걸로 해주세요.”\n후추가 빈 이름 칸 옆에 발자국을 눌렀다.",
   "안내판에서 소리가 났다.\n「마지막 보관품: 주인 확인 완료. 영업 종료 절차 시작.」"
 ],()=>{n.ended=true;save();objective();showEnding({eyebrow:'END OF THE SECOND NIGHT',title:choice==='name'?'나를 데리러 온 나':'빈칸도 내 자리',body:(choice==='name'?'이름표 하나가 주인을 찾았다.\n그 이름을 부르는 목소리도.':'편지 한 통이 주인을 찾았다.\n아직 정하지 않은 이름까지 그대로 안고.')+'\n\n역 바깥으로 나가는 길이 지워졌다.\n여울이 방울을 다시 숨기려다 손을 멈췄다.\n\n「폐역 신청인: 온」\n후추가 당신의 이름표와 안내판을 번갈아 봤다.',next:true});tone(659.25,2);});
 }
 function handle(id){
  if(state().chapter!==2)return false;
  const n=progress();
  switch(id){
   case 'keeper':
    if(!n.met)speak('역무원 · 여울',[
     state().choice==='carry'?'[여울의 주머니에서 방울 소리가 났다.]\n“어제 일도 말해야겠네요. 당신은 여기서 일했어요.”':'[문 위의 방울이 흔들렸다.]\n“어제까지 당신은 손님이 아니었어요. 제 옆에서 일했죠.”',
   "“남의 분실물은 전부 찾아줬어요.\n그런데 자기 편지는 끝까지 안 열었죠.”",
   "“마지막엔 이름을 맡겼어요. 여기서는 이름을 맡기면\n그 이름으로 살던 일도 흐려져요. 그걸 바라셨어요.”",
   "“제가 돌려주지 않은 건 부탁 때문만은 아니에요.\n당신이 여기 남아주면 좋겠다고 생각했어요.”",
   "여울이 기록실 열쇠를 책상에 놓았다.\n“원하면 확인하세요. 표와 같은 번호의 물건 셋이 있어요.”"
    ],()=>{n.met=true;toast('오른쪽 아래 기록실 문이 열렸습니다.');});
    else if(n.catName)finalLetter();
    else speak('역무원 · 여울',[n.remembered?'눈빛이 달라졌어요. 누군가 만나고 왔군요.\n승강장의 고양이도 당신을 기다리는 것 같아요.':'물건의 순서를 모르겠으면 메모를 펴보세요.\n소리를 내던 순간까지 적어뒀을 거예요.']);return true;
   case 'archive-door':
    if(!n.met)speak('기록실 문',['잠겨 있다. 역무원에게 먼저 물어보자.']);else move(2,240,245);return true;
   case 'archive-back':move(0,407,231);return true;
   case 'memory-back':move(2,240,241);return true;
   case 'rain':speak('노란 우산',[
    '어린아이에게는 조금 큰 우산이다.\n안쪽에 별을 그렸다가 지운 흔적이 있다.',
    '우산을 펴자 비가 들린다.\n처음엔 비밖에 없었다. 열차도, 사람 목소리도.',
    '“아빠는 야근이래.\n혼자 기다리지 말랬는데, 기다리는 걸 누구랑 하지?”',
    '그때 벤치 아래에서 작은 발이 보였다.'
   ],()=>recordClue('rain'));return true;
   case 'whistle':speak('작은 호루라기',[
    '호루라기에는 이빨 자국이 있다.\n힘껏 불어도 바람 새는 소리밖에 나지 않는다.',
    '“야, 나도 혼자야.\n같이 있으면 혼자는 아닌 거지?”',
    '아이가 호루라기를 불었다.\n비를 피해 숨어 있던 고양이가 우산 아래로 다가왔다.',
    '그 순간까지도 열차는 오지 않았다.'
   ],()=>recordClue('whistle'));return true;
   case 'train':speak('장난감 열차',[
    '바퀴 하나가 다른 색이다.\n누군가 고쳐서 오래 가지고 놀았던 모양이다.',
    '열차가 들어왔다.\n아이는 이미 고양이와 나란히 앉아 있었다.',
    '“우리 데리러 온 거 아니야.\n우린 조금 더 같이 있어도 돼.”',
    '누군가에게는 놓친 열차.\n누군가에게는 같이 있을 시간이 더 생긴 밤.'
   ],()=>recordClue('train'));return true;
   case 'recorder':puzzle();return true;
   case 'ledger':speak('대출 장부',[
   "접수 00:06 / 물건: 이름 / 신청: 본인\n사유: 내 이름을 부르면 또 남의 일을 하러 가게 됨.",
   "반환 금지 요청에 다른 필체가 덧붙어 있다.\n「말이 바뀌면, 그때는 바뀐 말을 들을 것. — 백지」",
   "「본인 편지 미개봉」 옆에 발자국이 찍혀 있다.\n한 번이 아니라 여러 번 눌렀다."
 ]);return true;
   case 'child':
    if(n.remembered)speak('우산을 쓴 아이',['나중에 고양이 만나면 머리 한 번만 쓰다듬어 줘.\n어른 손이면 한 번에 다 쓰다듬을 수 있겠다.']);
    else speak('우산을 쓴 아이',[
   "“아빠가 보냈어?”\n아이는 당신의 얼굴보다 먼저 빈손을 봤다.",
   "“아니구나. 아빠는 데리러 올 때 빵을 사 오거든.”\n우산이 조금 내려갔다.",
   "“자리 있어. 얘는 후추야. 나는 온.”\n고양이가 당신 자리까지 차지하고 누웠다.",
   "아이의 가방에 접다 만 편지가 보였다.\n봉투에 적힌 글씨는 당신의 주머니 속 글씨와 같았다.",
   "“너는 누구 기다려?”"
 ],null,[
     {text:'기다리던 사람이 안 와서.',action:()=>childReply('wait')},
     {text:'내가 어디로 가고 싶은지 잊어서.',action:()=>childReply('lost')}
    ]);return true;
   case 'memory-cat':speak('작은 고양이',['먀.','아직 사람 말을 하지 못하는 고양이다.\n그 대신 당신의 신발 위에 앞발을 올렸다.',n.remembered?'당신은 벤치를 두 번 두드렸다.\n작은 고양이가 눈을 감았다.':'당신은 왜인지 이 작은 발을 떼어놓지 못했다.']);return true;
   case 'memory-sign':speak('낡은 역 이름',['바랜 간판에는 “내일역”이 아니라\n“도림역”이라고 적혀 있다.','우리가 무언가를 오래 기다리면,\n장소의 이름보다 기다리던 날의 이름이 남는 걸까.']);return true;
   case 'cat':
    if(n.ended)speak('고양이 · 후추',[n.choice==='name'?'온. …그냥 불러봤어.\n이름은 가끔 이유 없이도 불러줘야 하니까.':'친구. 오늘 네 이름은 이거면 되지?','그나저나 근무표는 거절했어.\n고양이는 원래 자율 출퇴근이야.']);
    else if(n.remembered&&!n.catName)speak('고양이',[
   "“후추.”\n고양이의 꼬리가 멈췄다. “응.”",
   "당신은 벤치를 두 번 두드렸다.\n후추는 눈을 감으려다 다시 떴다. “그것도 기억났어?”",
   "“네가 나한테 부탁했어. 이름 돌려달라고 해도\n일단 못 들은 척해달라고.”",
   "“여울이 방울을 또 숨긴 건 알았어.\n나는 네 편지만 찾으면 된다고 생각했지. 둘 다 네게는 말 안 했어.”",
   "당신이 묻자 후추는 한참 바닥을 봤다.\n“알면서 기다리게 한 거냐고? …응.”",
   "“어릴 때 주웠던 고양이가 여기에 어떻게 있냐고?\n나는 네가 맡긴 기억 쪽에 남았어. 네가 떠난 뒤는 몰라.”",
   "“그래도 이번엔 못 들은 척 안 할게.\n편지를 읽을지는 네가 정해.”"
 ],()=>{n.catName=true;toast('메모에 「후추」라는 이름을 적었습니다.');});
    else speak('고양이', [n.catName?'역무원이 편지를 들고 기다려.\n이번엔 네 차례야.':'기록실이 열렸네.\n혹시 장부에서 내 발자국을 봐도 근태 기록이라고 생각하진 마.']);return true;
   case 'machine':speak('자판기 · 03호',n.ended?[
    n.choice==='name'?'온 고객님, 회원 정보 갱신을 축하합니다.':'이름 없는 고객님, 재방문을 축하합니다.',
    '오늘의 농담: 바다가 자판기를 만나면?\n…침수입니다. 농담이 아니라서 슬프네요.',
    '괜찮아요. 여울 씨가 사진을 찍어준대요.\n화면 있는 가전이라 다행이죠.'
   ]:['어제 넣은 편지라는데 글씨는 한참 어릴 때 것이라네요.\n봉투를 버릴 뻔했습니다. 이제 날짜만 보고 판단 안 하려고요.','기록실 물건은 반품 불가입니다.\n이미 겪은 일이라 환불이 어렵거든요.']);return true;
   case 'board':speak('낡은 안내판',['새로운 안내가 붙었다.\n4. 다른 사람을 찾다가 자신을 두고 가지 마세요.','아래에 작은 발자국이 찍혀 있다.']);return true;
   case 'plant':speak('이름표 없는 화분',['화분에 새 잎이 하나 났다.','이름표가 비어 있어도\n자라는 데는 문제가 없는 모양이다.']);return true;
   case 'bench':speak('오래된 벤치',['나무 틈 사이에 작은 글씨가 새겨져 있다.\n“다음에는 꼭 같이 타기.”','그 옆에 작고 둥근 발자국.\n여기서 기다리던 건 사람만이 아니었다.']);return true;
   case 'clock':speak('움직이는 시계',[n.ended?'시계가 12시 9분을 가리킨다.':'시계가 12시 8분을 가리킨다.','조금 느려도, 이제는 움직이고 있다.']);return true;
  }
  return false;
 }
 function childReply(answer){
  speak('우산을 쓴 아이',[
   answer==='wait'?'“나도. 늦는다고 했으면 얼마나 늦는지도 말해주지.”\n아이가 젖은 운동화를 벤치 밑으로 밀었다.':'“나도 집이 어딘지는 아는데, 혼자 가기는 싫어.”\n아이가 우산을 당신 쪽으로 기울였다.',
   "“나중의 나한테 편지 쓰는 숙제야.\n선생님은 꿈을 쓰랬는데, 부탁을 써도 될까?”",
   "아이가 당신의 손 위에 자기 손을 포갰다.\n새끼손가락 옆의 작은 흉터가 같은 모양이었다.",
   "아이가 벤치를 톡, 톡 두드렸다.\n깜짝깜짝 깨던 고양이가 턱을 내려놓았다.",
   "“여기 있다고 알려주는 거야. 말하면 깨니까.”\n당신도 두드려봤다. “너무 세. 얘한텐 천둥이겠다.”",
   "이번에는 손끝으로 아주 작게.\n아이가 웃었다. 고양이는 깨지 않았다.",
   "“나중에 바다 가면 얘도 데려가.\n자느라 못 보면, 무슨 색이었는지 말해주고.”"
  ],()=>{progress().answer=answer;progress().remembered=true;toast('그 고양이의 이름은 「후추」였습니다.');});
 }
 function journal(){
  if(state().chapter!==2)return [];
  const n=progress(),notes=['두 번째 밤 — 받는 이 없는 편지. 내가 열지 않은 편지와, 내가 돌려받지 않겠다고 한 이름.'];
  if(n.clues.includes('rain'))notes.push('① 우산: 처음엔 비밖에 없었다.');
  if(n.clues.includes('whistle'))notes.push('② 호루라기: 아이가 불자 고양이가 다가왔다. 아직 열차는 오지 않았다.');
  if(n.clues.includes('train'))notes.push('③ 장난감 열차: 아이와 고양이가 만난 다음 도착했다.');
  if(n.tuned)notes.push('재생기: 빗소리 → 휘파람 → 열차 소리. 다시 조사하면 기억으로 들어간다.');
  if(n.remembered)notes.push('우산 속의 아이는 온. 고양이 이름은 후추. 현재 승강장에서 그 이름을 불러보자.');
  if(n.catName)notes.push('후추는 내 부탁 때문에 이름을 숨겼고, 여울의 거짓말에도 침묵했다. 편지를 읽을지는 이제 내가 정한다.');
  if(n.ended)notes.push(n.choice==='name'?'두 번째 밤: 나를 데리러 온 나. 내 이름은 온이다.':'두 번째 밤: 빈칸도 내 자리. 편지는 가져가고, 이름은 조금 더 맡기기로 했다.');
  return notes;
 }
 function drawArchive(){
  rect(0,0,480,288,'#19232f');rect(20,49,440,119,'#3a383f');rect(20,168,440,110,'#494348');
  for(let y=177;y<278;y+=22){rect(20,y,440,1,'#665552');for(let x=30;x<450;x+=51)rect(x,y,1,22,'#534950');}
  for(const x of [48,158,284,395]){rect(x,62,40,59,'#292d38');for(let y=67;y<118;y+=16){rect(x+2,y+12,36,3,'#887358');for(let j=0;j<4;j++)rect(x+4+j*8,y,6,12,['#7b7067','#8d8470','#696e73','#9d8368'][j]);}}
  rect(182,54,116,20,'#273039');text('잊힌 소리 기록실',240,69,'#f0dcb2',8,'center');
  for(const x of [66,188,332]){rect(x,144,51,18,'#665d56');rect(x-2,141,55,5,'#af9472');rect(x+4,162,4,8,'#35343a');rect(x+43,162,4,8,'#35343a');}
  // Folded umbrella, whistle and repaired toy train.
  rect(84,113,3,29,'#c9b286');rect(79,116,15,21,'#c4a95c');rect(81,117,3,18,'#e3cb7a');rect(86,141,6,3,'#c9b286');
  rect(205,132,13,7,'#b4c2bd');rect(218,134,7,4,'#a0b6ae');rect(208,130,4,3,'#56686b');
  rect(340,128,26,10,'#858f92');rect(355,122,9,9,'#b2b8a7');rect(340,133,28,5,'#a86054');rect(343,138,5,4,'#baab83');rect(359,138,5,4,'#353843');
  rect(216,188,48,25,'#747471');rect(219,190,42,19,'#293e47');for(const x of [228,252]){rect(x-6,194,12,11,'#b0bbaa');rect(x-2,197,4,5,'#31444b');}rect(228,214,25,3,'#bca779');
  text(progress().tuned?'기억 재생 중':'소리를 모아주세요',240,232,'#d9d2b8',6,'center');
  rect(386,200,40,20,'#615454');rect(389,195,34,9,'#dbcdac');rect(405,195,1,9,'#ad9c81');
  glow(241,193,69,'#efc48b18');for(const x of [115,342]){rect(x,55,24,3,'#f5db9d');glow(x+12,100,68,'#ffc8791a');}
  rect(209,271,63,6,'#b4a17c');text('↓ 대합실로',240,264,'#f0e4c8',7,'center');
 }
 function drawMemory(time){
  rect(0,0,480,288,'#293950');rect(20,159,440,119,'#536773');
  for(let y=182;y<278;y+=25)rect(20,y,440,1,'#6c7b82');
  for(let i=0;i<13;i++){let x=i*42;rect(x,91-(i%3)*13,33,56,'#334357');rect(x+8,107-(i%3)*13,5,7,'#e2c78055');}
  rect(0,141,480,4,'#8098a1');rect(0,151,480,2,'#8098a1');
  rect(84,78,130,7,'#9e9081');rect(89,85,4,92,'#72828a');rect(204,85,4,92,'#72828a');
  rect(107,164,78,5,'#967a61');rect(110,169,4,18,'#465664');rect(178,169,4,18,'#465664');
  // Child in the yellow umbrella's pool of light.
  glow(151,165,66,'#e8c77824');rect(147,158,9,11,'#c9ac94');rect(146,155,11,5,'#35414b');rect(146,170,12,11,'#b78566');rect(147,181,4,7,'#2c394b');rect(154,181,4,7,'#2c394b');
  rect(128,143,46,5,'#d6b863');rect(133,137,36,6,'#ead080');rect(140,133,22,5,'#ead080');rect(150,129,2,7,'#b5aa83');rect(162,147,2,29,'#b5aa83');
  rect(333,192,15,8,'#d5d2bb');rect(341,185,9,9,'#e5dfc8');rect(341,182,3,5,'#e5dfc8');rect(347,182,3,5,'#e5dfc8');rect(347,188,1,2,'#354654');rect(329,193,6,3,'#d5d2bb');
  rect(396,94,4,69,'#5d7280');rect(374,105,47,22,'#9ca68e');text('도림역',397,120,'#263946',7,'center');
  for(let i=0;i<68;i++){const x=(i*59+time*19)%480,y=(i*37+time*113)%277;rect(x,y,1,5,progress().remembered?'#b0d2e322':'#b0d2e355');}
  for(let i=0;i<7;i++)rect(38+i*61,208+(i%3)*18,23,2,'#a1bac72a');
  text('오래전, 비가 그치기 전',285,76,'#e0e8df',8,'center');rect(209,271,63,6,'#b6c8bd');text('↓ 기록실로',240,264,'#f0f1de',7,'center');
 }
 function drawLobbyDoor(){if(state().chapter<2)return;rect(413,197,36,52,'#1d2c38');rect(410,194,42,4,'#9b8970');rect(415,199,32,47,progress().met?'#253c43':'#655d52');rect(415,245,32,4,'#bfa77e');rect(441,221,3,3,'#d9c592');text('기록실',431,191,'#f0dfb9',6,'center');}
 return {start,handle,task,journal,roomEntities,obstacles,drawArchive,drawMemory,drawLobbyDoor};
};
