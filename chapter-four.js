'use strict';

window.createFourthDay = function createFourthDay(api) {
 const {speak,toast,tone,save,objective,move,showEnding,rect,text,glow,person}=api;
 const state=()=>api.state(), progress=()=>state().day4;
 const address=()=>state().night2.choice==='name'?'온':'친구';
 const station=()=>state().night3.choice==='rest'?'쉼표역':'다음역';
 const photos={sea:'물결 위의 첫차',meal:'한 자리가 더 있는 식탁',light:'다시 켜진 등대'};
 const rooms={
  6:[{id:'harbor-notice',x:88,y:205,label:'마을 안내판',radius:27},{id:'harbor-keeper',x:186,y:211,label:'여울',radius:28},{id:'harbor-cat',x:347,y:219,label:'후추',radius:25},{id:'cafe-door',x:430,y:234,label:'작은 식탁으로',radius:25},{id:'lighthouse-door',x:430,y:184,label:'등대로',radius:25},{id:'postbox',x:77,y:252,label:'파란 우체통',radius:22},{id:'photo-sea',x:251,y:185,label:'바다 사진 담기',radius:27}],
  7:[{id:'cafe-owner',x:91,y:156,label:'식당 주인 모래',radius:30},{id:'breakfast',x:237,y:182,label:'큰 식탁',radius:32},{id:'photo-meal',x:367,y:151,label:'식탁 사진 담기',radius:29},{id:'cafe-radio',x:407,y:218,label:'오래된 라디오',radius:25},{id:'cafe-menu',x:125,y:224,label:'오늘의 메뉴',radius:26},{id:'cafe-back',x:240,y:265,label:'항구로',radius:24}],
  8:[{id:'mirror-0',x:105,y:183,label:'1번 반사판 돌리기',radius:26},{id:'mirror-1',x:240,y:183,label:'2번 반사판 돌리기',radius:26},{id:'mirror-2',x:375,y:183,label:'3번 반사판 돌리기',radius:26},{id:'naru',x:403,y:227,label:'등대의 수리공',radius:29},{id:'light-console',x:240,y:228,label:'등대 점등 장치',radius:24},{id:'photo-light',x:65,y:226,label:'등대 사진 담기',radius:25},{id:'lighthouse-back',x:240,y:267,label:'항구로',radius:24}]
 };
 const obstacles={
  6:[{x:67,y:181,w:41,h:25},{x:125,y:195,w:37,h:24},{x:65,y:228,w:23,h:21}],
  7:[{x:55,y:132,w:76,h:34},{x:207,y:154,w:59,h:35},{x:346,y:124,w:40,h:34},{x:395,y:192,w:25,h:27}],
  8:[{x:85,y:159,w:40,h:25},{x:220,y:159,w:40,h:25},{x:355,y:159,w:40,h:25},{x:220,y:207,w:40,h:24},{x:393,y:198,w:21,h:30}]
 };
 const minY={6:179,7:138,8:148};
 function roomEntities(room){return (rooms[room]||[]).map(e=>e.id==='naru'&&progress().met?{...e,label:progress().reunited?'나루의 작업 메모':'나루'}:e.id==='harbor-keeper'&&progress().reunited?{...e,label:progress().choice==='shore'?'여울과 나루':'벤치에 놓인 모자'}:e);}
 function task(){
  const p=progress();let t;
  if(p.ended)return {step:'마을 산책',title:'약속의 다른 쪽 · 그 후',detail:`세 곳을 자유롭게 둘러보세요. 식당 라디오에 답장이 와 있어요. 선택 사진 ${p.photos.length} / 3장도 메모에 남습니다.`};
  if(!p.notice)t={step:'01 / 07',room:6,id:'harbor-notice',title:'물결마을에 도착했어요',detail:'항구 왼쪽 안내판에서 마을 지도를 살펴보세요.'};
  else if(!p.letter)t={step:'02 / 07',room:7,id:'cafe-owner',title:'반송된 편지의 주소',detail:'식당 왼쪽 카운터의 모래에게 여울의 동생에 대해 물어보세요.'};
  else if(!p.met)t={step:'03 / 07',room:8,id:'naru',title:'약속의 다른 쪽에 있던 사람',detail:'등대 오른쪽 아래, 배선을 고치는 수리공에게 말을 걸어보세요.'};
  else if(!p.lit)t={step:'04 / 07',room:8,id:traceLight().solved?'light-console':`mirror-${traceLight().lastMirror??0}`,title:'반사판으로 빛길 잇기',detail:'위쪽 빛의 경로를 보며 세 반사판을 E로 돌리세요. 오른쪽 위 표시등까지 연결되면 아래 가운데 장치에서 점등하세요. 시간 제한은 없어요.'};
  else if(!p.reunited)t={step:'05 / 07',room:8,id:'naru',title:'이제 할 수 있는 말',detail:'수리가 끝났어요. 오른쪽 아래 나루에게 다시 말을 걸어보세요.'};
  else t={step:'06 / 07',room:6,id:'postbox',title:'역에 아침을 보내기',detail:'항구 왼쪽 아래 파란 우체통에서 03호에게 엽서를 보내세요. 사진은 선택 사항이에요.'};
  if(state().room!==t.room){
   if(state().room===7){t.id='cafe-back';t.detail='식당 아래 중앙 출구로 나가면 항구예요.';}
   else if(state().room===8){t.id='lighthouse-back';t.detail='등대 아래 중앙 출구로 내려가세요.';}
   else {t.id=t.room===7?'cafe-door':'lighthouse-door';t.detail=t.room===7?'항구 오른쪽 아래 식당 문으로 들어가세요.':'항구 오른쪽 위 등대 계단으로 올라가세요.';}
  }
  return t;
 }
 function start(){
  if(state().chapter!==3||!state().night3.ended)return;
  state().chapter=4;move(6,240,248);
  speak('물결마을 · 오전 8시 7분',[
   "열차가 멈췄는데 여울이 내리지 않았다.\n당신이 반송 기록을 내밀자 종이 모서리만 바라봤다.",
   "“주소를 잘못 썼겠죠.”\n후추가 물었다. “열두 번 다?”",
   "승강장 건너 식당 문이 열렸다.\n앞치마를 두른 사람이 여울을 보고 안으로 뛰어들어갔다.",
   "잠시 뒤, 그 사람이 편지 뭉치를 들고 나와\n당신에게 식당 안으로 오라고 손짓했다."
 ]);
 }
 function owner(){
  const p=progress();
  if(!p.notice){speak('식당 주인 · 모래',['어서 와요. 마을 안내판은 항구 왼쪽에 있어요.\n저희 메뉴보다 길 찾는 데 도움이 되죠.']);return;}
  if(p.ended){speak('식당 주인 · 모래',['오늘 매출은 평소보다 컸어요.\n사람 셋에 고양이 하나. 고양이가 제일 많이 먹었고.','나루가 다음번엔 자기가 사겠대요.\n누구한테도 날짜부터 약속하진 않았어요.','라디오에 역에서 온 답장이 잡혀요.\n요즘은 기계들끼리도 안부를 묻나 봐요.']);return;}
  if(p.letter){speak('식당 주인 · 모래',[p.reunited?'밥은 천천히 먹어요.\n식으면 데우면 되니까.':p.met?'나루가 일을 핑계로 뜸을 들일 때가 있어요.\n손이 바쁘면, 얼굴을 덜 숨겨도 되거든요.':'나루는 등대에 있어요.\n항구 오른쪽 위 계단으로 가면 됩니다.']);return;}
  speak('식당 주인 · 모래',[
   "“여울 씨죠? 잠깐, 이걸 먼저 가져가요.”\n모래가 묶음의 끈을 풀었다. 나루의 편지 열두 통이었다.",
   "봉투에는 주소 불명이 아니라 「수취 거절」이 찍혀 있었다.\n도장 아래에는 여울의 서명.",
   "“안 읽었어요. 화난 말이 있을 것 같아서.”\n여울이 말했다. “내일 받겠다고 했어요. 내일은 읽겠다고.”",
   "모래가 마지막 봉투를 돌려줬다.\n“처음엔 배 오는 날마다 국 두 그릇을 시켰어요.”",
   "“나중엔 한 그릇만 시켰고요.\n열세 번째 편지는 안 썼어요.”",
   "여울은 봉투를 열려다 손을 멈췄다.\n“지금은 어디 있어요?”\n“등대요. 올라가요. 기다려줄지는 직접 물어보고.”"
 ],()=>{p.letter=true;toast('항구 오른쪽 위에서 등대로 갈 수 있습니다.');});
 }
 function naru(){
  const p=progress();
  if(p.reunited){speak('나루의 작업 메모',['점검 완료. 점심 전까지 자리 비웁니다.','그 밑에 다급한 글씨가 덧붙어 있다.\n“언니가 왔음.”']);return;}
  if(!p.met){speak('등대의 수리공',[
   state().choice==='carry'?'작업대의 소음 사이로 방울이 울렸다.\n나루: 그거 아직 갖고 있었네. 나는 버린 줄 알았어.':'여울: 네가 돌아올 문에 방울을 걸었어. 돌아오면…\n나루: 나 돌아간다고 안 했어.',
   "여울: 편지 봤어.\n나루: 어느 거.\n여울: 아직… 봉투만.",
   "나루는 장갑을 다시 꼈다.\n“그럼 할 얘기 없네. 지금 일하는 중이야.”",
   "계기판에서 짧은 경고음이 났다.\n여울이 한 걸음 물러섰다. 나루는 붙잡지 않았다.",`나루가 당신을 봤다.\n“${address()}도 좀 도와줄래? 이 배선 놓으면 다시 꺼져.\n반사판을 맞춰줘.”`,"“왼쪽 빛을 오른쪽 위 표시등까지 보내면 돼.\n반사판 앞에서 E로 돌리고, 가운데 장치에서 켜줘.”",
   "여울이 물었다. “나는?”\n나루: 거기 마른 장갑. 가져다줘. 편지는 젖지 않게 놓고."
  ],()=>{p.met=true;toast('반사판을 돌리면 위쪽 빛의 경로가 바뀝니다.');});return;}
  if(!p.lit){speak('나루',[
   '빛이 막힌 곳부터 따라가 봐.\n첫 거울에서 아래로, 다음엔 오른쪽으로, 마지막엔 위로.',
   '반사판 세 개는 각각 돌릴 수 있어.\n표시등이 밝아지면 아래 가운데 점등 장치를 켜줘.',
   '여울이 물었다. “이 장갑이면 돼?”\n나루가 고개만 끄덕였다. 처음으로 여울에게 손을 내밀었다.'
  ]);return;}
  speak('여울과 나루',[
   "나루가 장갑을 벗었다.\n여울은 그동안 읽은 편지를 원래 봉투에 넣었다.",
   "여울: 세 번째 편지에 병원 주소가 있었어.\n나루: 사다리에서 떨어졌을 때. 언니 번호도 적었었어.",
   "여울: 왜 전화 안 했냐고 물으려다가…\n나루: 하지 마. 나 그 말 들으면 오늘은 못 앉아 있어.",
   "나루: 옆 침대 사람 언니가 왔더라. 귤을 가져와서.\n나도 하나 받았어.",
    "여울은 봉투 모서리를 펴다가 멈췄다.\n나루: 그때는 나도 그냥 언니가 왔으면 좋겠더라.",
   "여울: 나는 네가 화났을까 봐…\n말을 끝내지 못했다. 편지를 가방에 숨기려다 다시 꺼냈다.",
   "여울: 미안해. 다음 편지는…\n나루: 안 쓸 거야. 열세 번째는 언니가 써.",
   "나루가 선반에서 컵 두 개를 내렸다. 노란 컵과 파란 컵.\n파란 컵에는 서툰 고래가, 손잡이에는 오래된 접착 자국이 있었다.",
   "여울: 이거, 첫 번째 편지에…\n나루: 응. 나중엔 여기로 가져왔어.",
   "여울이 손잡이에 손을 뻗자 나루가 컵을 돌려줬다.\n“거긴 잡지 마. 다시 떨어져.”",
   "“버리려고 했는데.”\n나루가 고래 그림을 엄지로 문질렀다.\n“자꾸 다음에 버리게 되더라.”",
   "여울은 컵을 두 손으로 감쌌다. 아직 아무것도 담기지 않았다.\n나루가 나머지 컵을 챙길 때까지 그대로 들고 있었다.",
   "여울: 목요일에 내가 전화해도 돼?\n나루: 여섯 시 이후. 일할 때는 안 받아.\n여울은 봉투에 시간을 적었다.",
   "나루가 당신에게 물었다.\n“밥 먹는다고 다 괜찮아진 건 아니야. 그래도…\n같이 먹을래? 아니면 언니랑 잠깐만 걸을까.”"
 ],null,[
   {text:'식탁에 한 자리 더 만들자.',action:()=>reunite('table')},
   {text:'둘이 먼저 바다를 걸어봐.',action:()=>reunite('shore')}
  ]);
 }
 function reunite(choice){
  speak('길을 나서는 사람들',choice==='table'?[
   "후추: 고양이도 자리 있어?\n나루: 밥값 낼 거야?\n후추: 분위기가 안 좋을 땐 그런 얘기 안 하는 거야.",
   "여울이 나루 옆 의자를 당기려다 멈췄다.\n나루가 맞은편 의자를 발로 밀어줬다.",
   "“거기 앉아. 얼굴은 봐야 할 거 아냐.”\n모래가 두 사람이 가져온 컵에 따뜻한 우유를 따랐다.",
   "여울은 제 컵을 몇 번 불고는 나루 쪽으로 밀었다.\n나루: 나 이제 뜨거운 거 먹을 줄 알아.",
   "여울의 손이 멈췄다.\n나루는 컵을 돌려주려다 거품만 한 입 먹었다.",
   "“그래도 언니 거가 더 맛있네.”\n여울이 웃으려다 고개를 숙였다. 모래는 잠깐 주방에 들어갔다."
 ]:[
   "나루: 등대 아래까지만.\n여울: 응.\n나루: 언니, 자꾸 짐 가져가려고 하지 마. 내가 들게.",
   "두 사람은 나란히 걷지 못했다.\n모퉁이에서 나루가 잠깐 멈춰 기다렸다.",
   "모래가 문밖까지 나와 두 컵에 보리차를 따라줬다.\n여울은 파란 컵을 두 손으로 감싸고 다시 걸었다.",
   "여울: 고래 잘 그렸네.\n나루: 감자인데.\n여울은 한 걸음 늦게 웃었다.",
   "여울이 빈 컵을 돌려주려 하자 나루가 고개를 저었다.\n“언니 거야. 다음에 올 때 가져와.”",
   "후추가 말했다.\n“우린 밥 먹자. 따라가서 해설까지 해주지는 말고.”"
 ],()=>{const p=progress();p.choice=choice;p.reunited=true;move(choice==='table'?7:6,240,247);toast('03호에게 오늘의 소식을 보내주세요. 항구 왼쪽 아래 우체통이에요.');});
 }
 // Trace the actual ray through the mirrors; the picture and puzzle share this result.
 function traceLight(){
  const mirrors=[{x:140,y:80},{x:140,y:125},{x:330,y:125}],target={x:330,y:64};
  let x=64,y=80,dx=1,dy=0,lastMirror=null;const segments=[];
  for(let step=0;step<12;step++){
   let distance=dx>0?432-x:dx<0?x-48:dy>0?143-y:y-64,hit=null;
   for(const [i,point] of [...mirrors,target].entries()){
    const a=point.x-x,b=point.y-y,forward=a*dx+b*dy;
    if((dx?b===0:a===0)&&forward>0&&forward<=distance){distance=forward;hit=i;}
   }
   const endX=x+dx*distance,endY=y+dy*distance;segments.push({x,y,endX,endY});x=endX;y=endY;
   if(hit===3)return {segments,solved:true,lastMirror};
   if(hit===null)return {segments,solved:false,lastMirror};
   lastMirror=hit;[dx,dy]=progress().mirrors[hit]?[dy,dx]:[-dy,-dx];
  }
  return {segments,solved:false,lastMirror};
 }
 function rotate(index){
  const p=progress();if(!p.met){speak('반사판 조절기',['배선 덮개가 열려 있다.\n오른쪽 아래 수리공에게 먼저 말을 걸어보자.']);return;}
  if(p.lit){speak('고정된 반사판',['빛이 바다 쪽으로 곧게 이어진다.\n나루가 단단히 고정해두었다.']);return;}
  p.mirrors[index]=1-p.mirrors[index];save();objective();tone(330+index*110,.2);
  toast(traceLight().solved?'빛이 연결됐어요. 아래 가운데 장치에서 점등하세요.':`${index+1}번 반사판을 돌렸습니다. 위쪽 빛을 따라가 보세요.`);
 }
 function light(){
  const p=progress();if(!p.met){speak('점등 장치',['배선 작업 중.\n오른쪽 아래 수리공에게 먼저 말을 걸어보자.']);return;}
  if(p.lit){speak('점등 장치',['항로 표시등 정상.\n항구 쪽에서 작은 배 한 척이 답하듯 깃발을 흔든다.']);return;}
  if(!traceLight().solved){speak('점등 장치',['아직 표시등에 빛이 닿지 않는다.\n위쪽 판에서 노란 빛이 어느 거울을 벗어나는지 살펴보자.','나루에게 다시 물어보면 길을 알려준다.\n돌려둔 반사판의 각도는 그대로 남아 있다.']);return;}
  speak('등대의 불빛',[
   '[불빛이 세 번 방향을 바꾼 뒤, 바다 쪽으로 뻗었다.\n흐린 수평선에서 배 한 척이 천천히 모습을 드러냈다.]',
   '나루: 장갑.\n여울이 마른 장갑을 건넸다. 나루는 받아들었다.',
   '여울 무릎에 첫 번째 편지가 펼쳐져 있었다.\n“첫 월급 받았어. 컵도 두 개 샀어. 언니 건 파란 거.”',
   '“언니 오면 쓰려고. 고래도 그렸어.\n내가 언니보다 잘 그리지?”\n옆에 그린 지도에는 배에서 식당까지 오는 길이 빼곡했다.',
   '여덟 번째 편지. “식당 간판 바뀌었어. 길 틀리지 마.”\n열두 번째. “여기는 비 와. 거기는?”\n그 편지에는 지도가 없었다.',
   '여울: 마지막 봉투까지 읽었어.\n나루는 전원을 확인한 뒤에야 여울을 봤다.'
  ],()=>{p.lit=true;toast('나루가 장갑을 벗었습니다. 다시 말을 걸어보세요.');tone(659,1.4);});
 }
 function photo(id){
  const p=progress(),subject=id.slice(6);
  if(subject==='light'&&!p.lit){speak('사진에 담기엔 이른 등대',['빛이 아직 방향을 찾지 못했다.\n수리가 끝나면 이 모습을 담아두자.']);return;}
  if(p.photos.includes(subject)){speak('주머니 속 사진',[`「${photos[subject]}」\n이미 사진첩에 담겨 있다.`,p.ended?'사진을 다시 본 당신은 03호에게 한 장 더 보냈다.':'엽서에 함께 넣어 보낼 수 있을 것 같다.']);return;}
  speak('사진 한 장',[
   {sea:'[바다 위로 첫차의 마지막 칸이 비쳤다.]\n아까는 유리창 안에서 보던 풍경이다.',meal:'[모래가 빈 의자 앞에도 물컵을 놓았다.]\n아직 오지 않은 사람의 자리에도 빛이 들었다.',light:'[나루의 기름 묻은 손자국까지 함께 찍혔다.]\n아름다운 풍경에는 누군가가 고친 흔적도 있었다.'}[subject],
   `「${photos[subject]}」\n03호는 이런 바다도 좋아할까?`
  ],()=>{p.photos.push(subject);toast(`사진첩 ${p.photos.length} / 3 · 선택 사항`);});
 }
 function postbox(){
  const p=progress();
  if(p.ended){speak('파란 우체통',['보낸 엽서의 배달 완료 도장이 찍혀 있다.','역에서 온 답장은 식당 오른쪽 아래 라디오로 들을 수 있다.\n새로 담은 사진도 이곳에서 함께 보냈다.']);return;}
  if(!p.reunited){speak('파란 우체통',['하루 세 번, 바람이 잦아들면 수거합니다.','03호에게 보낼 엽서는 아직 비어 있다.\n여울과 나루의 이야기를 듣고 나서 채워도 좋겠다.']);return;}
  speak('03호에게 보내는 엽서',[
   `받는 곳: ${station()} 분실물 보관소\n받는 이: 바다 사진을 기다리는 03호`,
   p.photos.length?`[당신은 사진 ${p.photos.length}장을 봉투에 넣었다.]\n${p.photos.map(id=>photos[id]).join(' · ')}`:'[사진 대신 바다와 식탁을 서툴게 그렸다.]\n후추는 자기 얼굴을 조금 더 크게 그려달라고 했다.',
   p.choice==='table'?'“오늘은 두 사람이 서로 컵을 바꿔 썼어.\n후추는 자기 우유가 없다고 항의했고. 사진 찍을 틈을 놓쳤네.”':'“두 사람은 등대 아래까지 걸었어.\n나루가 여울에게 컵을 줬어. 다음에 가져오라고.”',
   '“우리는 잘 도착했어.\n다음에 갈 때는 네 음료도 한 번 사 먹을게.”',
   '[우체통 안에서 동전 떨어지는 소리가 났다.\n03호가 벌써 계산을 시작한 것 같았다.]'
  ],()=>{
   p.ended=true;move(p.choice==='table'?7:6,240,247);
   showEnding({eyebrow:'END OF THE FIRST DAY',title:p.choice==='table'?'식탁에 남겨둔 자리':'나란히 걷는 속도',body:(p.choice==='table'?'나루는 첫 월급 이야기를 하다 한 번 말을 멈췄다.\n여울은 재촉하지 않았다. 국은 조금 식었다.':'두 사람은 등대 아래까지만 걷고 돌아왔다.\n나루는 모래에게 국을 두 그릇 데워달라고 했다.')+'\n\n여울은 목요일 여섯 시에 맞춰 알람을 걸었다.\n\n그때 03호에게서 짧은 답장이 왔다.\n“새 손님이 이름을 맡기겠답니다.\n백지 씨가 예전 접수표를 꺼냈어요. 돌아올 수 있습니까?”',next:true});tone(523,2);tone(659,2);
  });
 }
 function handle(id){
  if(state().chapter!==4)return false;
  const p=progress();
  if(id.startsWith('mirror-')){rotate(Number(id.slice(-1)));return true;}
  if(id.startsWith('photo-')){photo(id);return true;}
  switch(id){
   case 'harbor-notice':speak('물결마을 안내판',p.notice?['오른쪽 아래: 작은 식탁\n오른쪽 위: 등대 작업실\n왼쪽 아래: 우체통','손글씨가 한 줄 더 있다.\n“길을 잃으면 밥부터 먹고 생각하기.”']:[
    '물결마을에 오신 것을 환영합니다.\n식당은 오른쪽 아래, 등대는 오른쪽 위.\n엽서는 왼쪽 아래 파란 우체통에 넣어주세요.',
    '등대 정기 점검 · 담당: 나루\n문의는 「작은 식탁」으로. 식사 시간에는 답이 늦습니다.',
    '[여울이 “담당: 나루”라는 글자를 두 번 읽었다.]\n“누군가를 기다리는 이름 말고, 일을 맡은 이름이네요.”'
   ],()=>{p.notice=true;});return true;
   case 'harbor-keeper':speak(p.reunited?'항구의 벤치':'여울',p.reunited?(p.choice==='shore'?['[여울과 나루가 바다 쪽에 앉아 있다.]','나루: 나 아직 높은 데 무서워.\n여울: 그런데 등대 일은 어떻게 해?\n나루: 무서우면 내려와. 그리고 다시 올라가.','당신은 인사만 하고 자리를 비켜주었다.']:['여울의 모자가 벤치에 놓여 있다.\n바람에 날아가지 않게 작은 돌이 올라가 있다.','멀리 식당에서 웃음소리가 들린다.']):[
    '여기까지 오면 할 말이 저절로 생길 줄 알았어요.\n역에서 세 장이나 썼는데, 이제 첫 줄도 낯설어요.',
    p.letter?'그래도 같이 올라가요.\n말을 잘 못 해도, 얼굴은 보고 싶으니까.':'식당 사람들에게 먼저 물어봐야겠어요.\n제가 아는 동생은 너무 오래전의 동생이라서.'
   ]);return true;
   case 'harbor-cat':speak('후추',[
    p.ended?`${address()}. 여기 낮잠은 합격이야.\n갈매기들은 태도가 별로지만.`:'바다는 냄새가 맛있네.\n먹을 수 있는 것과 냄새가 맛있는 건 다르다는 게 문제야.',
    p.reunited?'기다려주는 것과 자리를 비켜주는 것,\n둘 다 옆에 있어야 할 수 있는 일이네.':'너도 물어보고 싶은 게 있으면 물어봐.\n내가 괜히 창가 자리 맡아둔 게 아니니까.'
   ]);return true;
   case 'cafe-door':move(7,240,246);return true;
   case 'cafe-back':move(6,414,242);return true;
   case 'lighthouse-door':if(!p.letter)speak('등대 계단',['정기 점검 중입니다.\n방문 문의는 「작은 식탁」 카운터로.']);else move(8,240,249);return true;
   case 'lighthouse-back':move(6,404,193);return true;
   case 'cafe-owner':owner();return true;
   case 'naru':naru();return true;
   case 'light-console':light();return true;
   case 'postbox':postbox();return true;
   case 'breakfast':speak('작은 식탁',p.reunited&&p.choice==='table'?[
    '나루: 그 신발을 첫 월급으로 샀는데 바닷물에 젖어서…\n여울: 그럼 이 사진의 신발은?\n나루: 맞아. 두 번째 월급이야.',
    '[당신은 모래에게 빈 접시 하나를 더 받았다.\n후추는 자기가 요청한 접시라고 우겼다.]',
    '여울이 냅킨에 나루의 다음 휴일을 적었다.\n중간에 나루가 날짜 하나를 고쳤다. “그날 말고. 나 일해.”',
    '파란 컵을 내려놓은 자리에 동그란 물 자국이 남았다.\n손잡이에 붙은 접착제는 노랗게 바래 있었다.'
   ]:p.reunited?['모래가 두 사람이 앉을 의자를 닦고 있다.','“국은 다시 데우면 돼요.\n등대 아래까지만 간댔으니까, 금방 오겠죠.”']:['메뉴판 아래에 빈 의자가 하나 더 있다.','모래가 의자 등받이의 얕은 홈을 문질렀다.\n“나루가 여기 앉아서 입구만 봤어요. 의자를 매번 돌려서.”']);return true;
   case 'cafe-menu':speak('오늘의 메뉴',['생선국 · 달걀말이 · 따뜻한 밥\n반찬 추가 무료, 사연 추가도 무료.','아래에 다른 필체가 끼어 있다.\n“고양이 할인은 왜 없어요.”\n그 아래 답: “글씨 쓸 줄 알면 계산도 하렴.”']);return true;
   case 'cafe-radio':speak(p.ended?'03호의 답장':'오래된 라디오',p.ended?[
    `치직—. ${station()}에서 알려드립니다.\n고객님의 바다는 정상 수신되었습니다.`,
    p.photos.length===3?'풍경, 밥, 일하는 사람의 손까지.\n세 장을 번갈아 틀었더니 손님이 화면 앞에 오래 서 있네요.':p.photos.length?'사진에 제가 안 나왔는데도 좋네요.\n이런 취향이 생길 줄은 몰랐습니다.':'그림 속 고양이가 등대보다 크군요.\n후추 씨의 감수가 들어간 것으로 판단됩니다.',
    '새 손님이 왔습니다. 이름을 맡기면 전부 잊느냐고요.\n백지 씨는 접수표를 꺼냈습니다.',
    '저는 물부터 드시겠냐고 물었습니다.\n그분은 종이컵을 잡은 채 서명을 안 하고 있어요.',
    state().night3.choice==='rest'?'쉬어가겠다는 손님에게 자리를 내드렸습니다.\n당신이 남긴 안내 방송대로요.':'어디로 가는지 모른다는 손님에게 옆자리를 안내했습니다.\n당신이 남긴 안내 방송대로요.',
    '추신. 백지 씨의 휴가 신청서도 그대로입니다.\n오늘도 못 가겠다고 하시네요.'
   ]:['바다 날씨와 어선들의 짧은 인사가 섞여 들린다.','모래가 안테나를 만지며 말했다.\n“이상하게 역에서 오는 소리도 가끔 잡혀요.”']);return true;
  }
  return false;
 }
 function journal(){
  const p=progress(),notes=['네 번째 이야기 — 약속의 다른 쪽. 첫차를 타고 물결마을에 도착했다.'];
  if(p.notice)notes.push('항구 오른쪽 아래: 작은 식탁 / 오른쪽 위: 등대 / 왼쪽 아래: 파란 우체통.');
  if(p.letter)notes.push('열두 통 모두 주소 불명이 아닌 수취 거절이었다. 여울은 답장이 무서워 내일 받겠다고 했다. 나루는 등대에 있다.');
  if(p.met)notes.push('빛길 단서: 첫 거울에서 아래로 → 두 번째에서 오른쪽으로 → 세 번째에서 위로. E / Enter / 말 걸기로 각도를 돌리고, 빛이 연결되면 아래 가운데 점등 장치에서 확인.');
  if(p.lit)notes.push('등대 수리 완료. 여울은 반송했던 편지를 읽었다. 나루에게 다시 말을 걸어보자.');
  if(p.reunited)notes.push(p.choice==='table'?'나루는 함께 먹되 바로 용서하지는 않았다. 목요일 여섯 시 이후, 이번에는 여울이 전화하기로 했다.':'나루가 정한 등대 아래까지 둘이 걷기로 했다. 목요일 여섯 시 이후, 이번에는 여울이 전화한다.');
  notes.push(`선택 사진 ${p.photos.length} / 3: ${p.photos.map(id=>photos[id]).join(' · ')||'아직 없음'}. 항구의 바다, 식당 창가, 수리가 끝난 등대를 담을 수 있다. 사진이 없어도 엽서를 보낼 수 있다.`);
  if(p.ended)notes.push('03호에게 오늘의 소식을 보냈다. 식당 오른쪽 아래 라디오에서 답장을 들어보자.');
  return notes;
 }
 function waves(time,y=110){for(let i=0;i<35;i++){const x=((i*71-time*(5+i%3))%480+480)%480;rect(x,y+(i*17)%62,13+i%4*3,1,i%3?'#b8d2c970':'#f2debc99');}}
 function drawHarbor(time){
  rect(0,0,480,288,'#abc1c3');rect(0,62,480,60,'#dfc9a6');rect(0,115,480,65,'#6895a0');waves(time,117);
  rect(38,69,27,21,'#f5ddaa');glow(50,78,60,'#fbdca055');
  for(let i=0;i<4;i++){const x=(i*131+time*8)%510-20,y=83+(i%3)*12;rect(x,y,5,1,'#617c84');rect(x+5,y+1,4,1,'#617c84');}
  rect(336,69,26,62,'#c8ccba');rect(332,65,34,8,'#566d74');rect(339,74,20,15,progress().lit?'#f5e4a8':'#617e85');rect(337,99,24,8,'#8b9b92');rect(328,131,43,7,'#455f70');
  if(progress().lit){for(let i=0;i<18;i++)rect(350+i*5,83-i*.6,6,2,'#f5e5ad33');glow(350,82,39,'#f8dd8550');}
  rect(19,177,442,101,'#aaa188');rect(19,174,442,5,'#d9c69c');for(let y=194;y<278;y+=21)rect(20,y,440,1,'#bdb096');
  for(let x=25;x<460;x+=34){rect(x,165,4,19,'#6d756c');rect(x,167,34,2,'#b6b5a0');}
  rect(67,182,41,25,'#556a70');rect(71,185,33,18,'#d7cfad');rect(74,207,3,12,'#666e65');rect(99,207,3,12,'#666e65');text('물결마을',88,200,'#3c5761',6,'center');
  rect(124,197,40,5,'#7e725e');rect(126,207,38,7,'#88775d');rect(129,214,4,8,'#566664');rect(156,214,4,8,'#566664');
  const p=progress();if(!p.reunited||p.choice==='shore'){person(186,209,true);if(p.reunited)worker(211,212);}else rect(180,204,15,4,'#6d837b');
  cat(347,217,time);rect(65,229,23,20,'#477a8e');rect(63,226,27,6,'#6a96a4');rect(69,234,15,3,'#183e54');rect(74,249,5,9,'#657b7d');text('POST',77,247,'#e6ddbf',5,'center');
  rect(414,213,34,34,'#787263');rect(419,217,24,27,'#c7b591');rect(421,221,20,12,'#577b83');text('작은 식탁 →',395,262,'#f8eacb',6,'center');
  for(let y=178;y<202;y+=5)rect(419,y,29,2,'#697c78');text('등대 ↑',425,168,'#eef0db',6,'center');
  text('물결마을 · 바람이 드는 항구',235,60,'#fff0d3',8,'center');
 }
 function drawCafe(time){
  rect(0,0,480,288,'#414e51');rect(20,50,440,121,'#b3a48a');rect(20,171,440,107,'#817a68');
  for(let y=181;y<279;y+=23){rect(20,y,440,1,'#a39478');for(let x=28;x<450;x+=59)rect(x,y,1,23,'#928773');}
  for(const x of [176,322]){rect(x,72,108,68,'#637674');rect(x+5,77,98,57,'#ccb994');rect(x+5,100,98,34,'#76a2aa');rect(x+52,73,3,65,'#b4ad93');for(let i=0;i<4;i++)rect(x+7+(i*23+time*4)%81,109+i*5,15,1,'#dce3c477');}
  rect(52,135,82,30,'#796652');rect(48,132,90,6,'#d5b68a');rect(61,112,13,15,'#e3d3a8');rect(82,120,25,9,'#556e6b');
  worker(91,129,'#aa8063');rect(87,116,13,3,'#d9c7a0');text('작은 식탁',90,88,'#eee0bd',8,'center');
  rect(207,155,59,34,'#987b5d');rect(207,154,59,5,'#cfac7b');for(const x of [216,246]){rect(x,164,12,8,'#ded9b7');rect(x+3,165,6,4,'#a79a6b');}
  rect(235,159,3,8,'#d8e3d0');rect(213,190,4,10,'#5d6258');rect(256,190,4,10,'#5d6258');
  if(progress().reunited&&progress().choice==='table'){mug(211,172,'#74a6b5',true);mug(253,172,'#dfbe77');}
  if(progress().reunited&&progress().choice==='table'){person(193,185,true);worker(281,185);cat(238,214,time);}
  rect(346,144,40,14,'#a38461');rect(354,135,22,10,'#e4dcc0');rect(359,137,12,5,'#b89f67');glow(365,143,45,'#f7d79520');
  rect(396,195,23,24,'#735f50');rect(399,198,17,11,'#334f5c');rect(401,212,4,3,'#d0ba8b');rect(412,185,1,14,'#bac2aa');
  rect(113,207,25,25,'#d4c6a4');for(let y=213;y<229;y+=5)rect(117,y,17,1,'#897d64');
  rect(209,271,63,6,'#c2baa0');text('↓ 항구로',240,264,'#f5e9cd',7,'center');
 }
 function worker(x,y,color='#6995a0'){rect(x-5,y-23,11,10,'#dab99c');rect(x-6,y-26,13,5,'#53585a');rect(x-6,y-15,14,13,color);rect(x-4,y-12,9,9,'#527780');rect(x-5,y-2,4,5,'#354c57');rect(x+3,y-2,4,5,'#354c57');rect(x+6,y-14,3,9,'#c3a287');}
 function mug(x,y,color,repaired=false){rect(x,y,7,8,color);rect(x+7,y+2,3,4,color);rect(x+8,y+3,1,2,'#4b626d');rect(x+1,y,5,1,'#efe1c1');if(repaired){rect(x+7,y+2,2,1,'#d8c7a0');rect(x+2,y+4,3,2,'#e3dcc3');rect(x+3,y+2,1,2,'#e3dcc3');}}
 function cat(x,y,time){rect(x-9,y-8,17,8,'#d4d8bd');rect(x+4,y-15,8,10,'#e0dfc2');rect(x+4,y-17,3,4,'#e0dfc2');rect(x+10,y-17,3,4,'#e0dfc2');rect(x+9,y-11,1,2,'#3c5460');rect(x-13,y-6+Math.sin(time*2),6,3,'#c4ccb2');}
 function drawLighthouse(time){
  rect(0,0,480,288,'#4b626d');rect(20,49,440,113,'#9aa99f');rect(20,162,440,115,'#79857d');
  rect(44,61,392,86,'#294651');for(let x=58;x<433;x+=19)rect(x,64,1,78,'#35525a');for(let y=70;y<144;y+=15)rect(48,y,384,1,'#35525a');
  const beam=traceLight();
  for(const s of beam.segments){rect(Math.min(s.x,s.endX)-1,Math.min(s.y,s.endY)-1,Math.abs(s.endX-s.x)+3,Math.abs(s.endY-s.y)+3,'#f1d387');const f=(time*.7)%1;rect(s.x+(s.endX-s.x)*f-1,s.y+(s.endY-s.y)*f-1,3,3,'#fff4c0');}
  rect(58,75,10,10,'#e5c77f');text('빛',63,74,'#ffedb7',6,'center');
  const points=[[140,80],[140,125],[330,125]];for(let i=0;i<3;i++){const [x,y]=points[i];rect(x-8,y-8,17,17,'#607e82');for(let d=-6;d<=6;d++)rect(x+d,y+(progress().mirrors[i]?d:-d),2,2,'#eff0d6');text(String(i+1),x+14,y+4,'#d1dfce',6);}
  rect(324,56,13,10,beam.solved?'#f6e0a1':'#778e8e');text('등대 표시등',356,59,'#edf0cf',6,'center');if(beam.solved)glow(330,63,24,'#f7d99244');
  for(let i=0;i<3;i++){const x=105+i*135;rect(x-20,161,40,23,'#4d656a');rect(x-14,165,28,11,'#728b8a');rect(x-2,164,4,12,'#d5c9a1');text(`${i+1}번 반사판`,x,200,'#f0e9c9',6,'center');}
  rect(220,210,40,21,'#4d656a');rect(229,214,22,7,progress().lit?'#d9dda3':beam.solved?'#c9c089':'#637c7a');text(progress().lit?'점등 완료':'점등 장치',240,244,'#f1e8c9',6,'center');
  if(!progress().reunited){worker(403,223);if(progress().met)person(437,224,true);}else{rect(396,211,16,12,'#dfd4ae');rect(398,215,12,1,'#9d987b');}
  rect(51,201,29,15,'#abc3bd');rect(54,204,23,9,'#74a4ac');text('바다 창',65,219,'#e6ead2',6,'center');
  rect(396,152,42,3,'#b4a07e');if(!progress().reunited){mug(401,144,'#74a6b5',true);mug(420,144,'#dfbe77');}
  rect(209,273,63,5,'#c4c8aa');text('↓ 항구로',240,268,'#f0ead0',7,'center');
 }
 return {start,task,handle,journal,roomEntities,obstacles,minY,traceLight,drawHarbor,drawCafe,drawLighthouse};
};
