'use strict';
window.createFifthStory=function(api){
 const {speak,toast,tone,save,objective,move,showEnding,rect,text,glow}=api;
 const state=()=>api.state(),p=()=>state().night5;
 const address=()=>state().night2.choice==='name'?'온':'친구';
 const names={home:'우리 역',forest:'솔숲역',old:'도림역',sea:'물결마을'};
 const trains=[
  {id:'forest',from:'home',to:'forest',dep:1030,arr:1045},
  {id:'direct',from:'home',to:'sea',dep:1060,arr:1115},
  {id:'old',from:'home',to:'old',dep:1025,arr:1050},
  {id:'missed',from:'forest',to:'sea',dep:1040,arr:1070},
  {id:'connection',from:'forest',to:'sea',dep:1055,arr:1085},
  {id:'detour',from:'old',to:'sea',dep:1075,arr:1120}
 ];
 const clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
 function normaliseRoute(route){let at='home',time=1020;const valid=[];for(const id of Array.isArray(route)?route.slice(0,2):[]){const t=trains.find(t=>t.id===id);if(!t||t.from!==at||t.dep<time||t.arr>1100)break;valid.push(id);at=t.to;time=t.arr;}return valid;}
 function itinerary(){const list=normaliseRoute(p().route).map(id=>trains.find(t=>t.id===id));return {list,at:list.at(-1)?.to||'home',time:list.at(-1)?.arr||1020};}
 const rooms={
  0:[{id:'keeper',x:348,y:150,label:'검표원 백지',radius:29},{id:'machine',x:91,y:143,label:'03호',radius:28},{id:'board',x:218,y:138,label:'새 안내판',radius:25},{id:'plant',x:424,y:147,label:'화분',radius:24},{id:'door',x:240,y:263,label:'승강장으로',radius:24},{id:'office-door',x:431,y:224,label:'당직실로',radius:26}],
  1:[{id:'visitor',x:123,y:188,label:'처음 온 손님',radius:31},{id:'cat',x:348,y:176,label:'후추',radius:27},{id:'clock',x:235,y:175,label:'오늘의 시계',radius:25},{id:'return',x:240,y:264,label:'대합실로',radius:24}],
  9:[{id:'route-board',x:240,y:147,label:'환승 시간표',radius:32},{id:'printer',x:240,y:212,label:'승차권 인쇄기',radius:28},{id:'locker',x:89,y:175,label:'백지의 사물함',radius:29},{id:'office-back',x:240,y:265,label:'대합실로',radius:24},{id:'garden-door',x:431,y:222,label:'옥상 정원으로',radius:26}],
  10:[{id:'garden-plant',x:96,y:165,label:'마른 화단',radius:29},{id:'garden-letter',x:358,y:169,label:'바닷가에서 온 편지',radius:29},{id:'garden-chair',x:185,y:213,label:'두 개의 의자',radius:28},{id:'garden-back',x:240,y:265,label:'당직실로',radius:24}]
 };
 const obstacles={9:[{x:210,y:126,w:60,h:29},{x:216,y:189,w:48,h:28},{x:69,y:136,w:39,h:38}],10:[{x:68,y:143,w:55,h:25},{x:339,y:146,w:37,h:27},{x:166,y:186,w:20,h:27},{x:220,y:186,w:20,h:27}]};
 function roomEntities(room){let result=rooms[room]||[];if(p().ready)result=result.map(e=>e.id==='keeper'?{...e,label:p().ended?'빈 안내 데스크':'백지의 쪽지'}:e.id==='visitor'&&p().ended?{...e,label:'손님 연'}:e);if(room===1&&p().ready&&!p().ended)result=[...result,{id:'depart',x:303,y:179,label:'백지 배웅하기',radius:29}];return result;}
 function task(){
  let t;
  if(p().ended)return {step:'여정의 끝',title:'돌아올 곳이 있는 사람들',detail:'옥상 정원의 편지와 친구들의 후일담을 살펴보세요. 메모의 지도에서 길을 볼 수 있고, 저장 파일을 내보내 여정을 간직할 수 있어요.'};
  if(!p().met)t={room:0,id:'keeper',title:'휴가 신청서의 빈칸',detail:'대합실 오른쪽 위 백지에게 돌아왔다고 인사하세요.',step:'01 / 07'};
  else if(!p().guestChoice)t={room:1,id:'visitor',title:'처음 온 손님을 맞이하기',detail:'승강장 왼쪽 벤치의 손님에게 말을 걸어보세요.',step:'02 / 07'};
  else if(!p().cup)t={room:0,id:'machine',title:'사연 없이도 따뜻한 물 한 잔',detail:'대합실 왼쪽 03호에게 손님이 부탁한 물을 받아오세요.',step:'03 / 07'};
  else if(!p().served)t={room:1,id:'visitor',title:'물 한 잔과 함께 돌아가기',detail:'승강장 왼쪽 벤치의 손님에게 물을 건네주세요.',step:'04 / 07'};
  else if(!p().ticket)t={room:9,id:itinerary().at==='sea'?'printer':'route-board',title:'백지의 첫 여행 계획',detail:'당직실 시간표에서 18:20 전에 물결마을에 도착하는 경로를 고르세요. 환승하는 열차의 출발 시각도 확인하세요. 시간 제한은 없어요.',step:'05 / 07'};
  else if(!p().ready)t={room:0,id:'keeper',title:'갈 곳이 생긴 휴가 신청서',detail:'인쇄한 표를 대합실의 백지에게 전해주세요.',step:'06 / 07'};
  else t={room:1,id:'depart',title:'마지막까지 남던 사람을 배웅하기',detail:'승강장 위쪽, 시계 오른편의 백지를 배웅하세요.',step:'07 / 07'};
  if(state().room!==t.room){if(state().room===10){t.id='garden-back';t.detail='아래 중앙에서 당직실로 내려가세요.';}else if(state().room===9){t.id='office-back';t.detail='아래 중앙에서 대합실로 나가세요.';}else if(state().room===1){t.id='return';t.detail='아래 중앙에서 대합실로 돌아가세요.';}else {t.id=t.room===9?'office-door':'door';t.detail=t.room===9?'대합실 오른쪽 아래 당직실 문으로 들어가세요.':'아래 중앙 출구에서 승강장으로 이동하세요.';}}
  return t;
 }
 function start(){if(state().chapter!==4||!state().day4.ended)return;state().chapter=5;move(0,240,234);speak('다시, 우리 역',[
  '[바닷바람이 묻은 옷을 입고 역에 돌아왔다.\n03호의 화면에는 당신이 보낸 바다가 흐르고 있었다.]',
  state().day4.choice==='table'?'여울은 나루의 두 번째 월급 이야기까지 듣고 오겠다며 남았다.\n03호는 “대체 신발을 몇 켤레 산 겁니까”라고 물었다.':'여울과 나루는 모퉁이 하나만 더 걷겠다고 했다.\n당신은 둘이 먼저 돌아오겠다는 약속을 재촉하지 않았다.',
  '안내 데스크에는 휴가 신청서가 놓여 있었다.\n신청인: 백지. 승인자: 백지.\n두 번째 칸만 아직 비어 있었다.',
  '백지가 신청서를 슬쩍 뒤집었다.\n“마침 손님이 한 분 오셔서요. 오늘도 다음에 가야겠습니다.”'
 ]);}
 function keeper(){
  if(p().ended){speak('빈 안내 데스크',['열쇠 옆에 쪽지가 한 장 있다.\n“안 잠가도 되는 문은 그대로 두었습니다.”','그 아래, 처음 보는 서명이 있다.\n“휴가 중인 백지.”']);return;}
  if(!p().met){speak('검표원 · 백지',[
   '휴가요? 신청은 했습니다.\n그런데 제가 나가면 마지막 문은 누가 닫습니까?',
   '03호: 문에 자동 잠금이 있는데요.\n백지: …그건 철문 얘기고요.',
   '늘 마지막 손님을 보내고 나면 쉬려고 했습니다.\n마지막 손님 뒤에는 꼭 다음 손님이 오더군요.',
   '승강장 왼쪽에 처음 오신 분이 앉아 계세요.\n분실물은 없다고 하시는데, 가실 생각도 없으시고.',
   '당신이 잠깐 맞아주시겠습니까?\n저는 그동안 휴가 신청서를… 조금 더 보겠습니다.'
  ],()=>{p().met=true;});return;}
  if(p().ready){speak('백지가 남긴 쪽지',['표를 세 번 확인했습니다.\n남의 표만 확인하다 제 표를 보니 이상하군요.','승강장에서 뵙겠습니다.\n오늘은 제가 먼저 올라타겠습니다.']);return;}
  if(!p().ticket){speak('검표원 · 백지',[p().served?'손님이 편히 계시는군요.\n…누가 제 손목을 잡고 있는 것도 아닌데, 자꾸 시계만 보게 됩니다.':'말을 잘해야 한다고 생각하지 않으셔도 됩니다.\n일단 필요한 게 있는지 물어봐 주세요.',p().served?'모래 씨가 18:20 전에 오면 저녁을 준다고 했습니다.\n당직실 시간표를 보면 갈 수 있는 길이 있을까요?':'당직실은 오른쪽 아래 문입니다.\n제 사물함 옆으로 옥상 정원도 이어져 있습니다.']);return;}
  speak('검표원 · 백지',[
   '[백지가 표 위의 출발지를 손가락으로 짚었다.\n이번에는 도착지도 천천히 읽었다.]',
   '물결마을, 18:05 도착.\n저녁시간에 늦지 않겠군요.',
   '제가 떠나도 괜찮다는 말을 듣고 싶었던 것 같습니다.\n정작 아무도 저를 못 가게 한 적은 없는데.',
   state().night3.choice==='rest'?'당신이 쉬어가도 된다고 방송했을 때,\n그 말에 저도 포함되는 줄은 몰랐습니다.':'당신이 옆자리 사람에게 말을 걸라고 방송했을 때,\n제 옆자리에도 누가 앉을 수 있다는 걸 잊고 있었습니다.',
   '백지가 승인자 칸에 이름을 적었다.\n잉크가 마르기도 전에 종이를 접었다.',
   '03호: 업무 인수인계는요?\n백지: 물건은 잃어버린 사람에게. 물은 목마른 사람에게.\n03호: 생각보다 짧군요.'
  ],()=>{p().ready=true;toast('백지가 승강장으로 나갔습니다.');});
 }
 function visitor(){
  if(!p().met){speak('처음 온 손님',['[낯선 사람이 빈 컵을 두 손으로 쥐고 있다.]\n대합실의 검표원이 당신에게 손짓했다.']);return;}
  if(p().ended){speak('손님 · 연',p().guestChoice==='quiet'?['아까 아무것도 안 물어봐 줘서 고마웠어요.\n이제 이름 정도는 말하고 싶네요. 연이에요.','다음에는 꼭 할 말이 있어서 오지 않아도 되죠?']:['아까 말한 일, 내일이면 다시 어려워질지도 몰라요.\n그래도 오늘 누가 들었다는 건 남겠죠.','연이에요. 이름을 제일 나중에 말했네요.\n다음에 오면 먼저 인사할게요.']);return;}
  if(!p().guestChoice){speak('처음 온 손님',[
   '아무것도 잃어버리지 않았는데 들어와도 되나요?\n문 앞에서 세 번 확인했어요.',
   '따뜻한 물만 한 잔 마시고 싶어서요.\n어디에서 왔는지는… 오늘은 잘 설명이 안 돼요.',
   '당신은 빈 컵과 벤치의 남은 자리를 바라봤다.\n어떻게 곁에 있어줄까?'
  ],null,[{text:'조용히 쉴 자리를 지켜줄게요.',action:()=>welcome('quiet')},{text:'괜찮다면 옆에 앉아도 될까요?',action:()=>welcome('listen')}]);return;}
  if(!p().cup){speak('처음 온 손님',['고마워요. 물은 대합실 자판기에서 받을 수 있대요.\n뜨겁지 않게만 부탁할게요.']);return;}
  if(p().served){speak('처음 온 손님',[p().guestChoice==='quiet'?'[손님이 컵을 조금 들며 인사했다.\n당신도 고개를 끄덕였다.]':'말하다 보니 조금 배가 고프네요.\n오늘 처음 드는 생각이에요.','검표원님도 어디 가시나 봐요.\n아까보다 자주 문 쪽을 보시네요.']);return;}
  speak('물 한 잔',[
   '[당신은 컵을 건넸다.\n두 손으로 잡아도 뜨겁지 않을 만큼 식어 있었다.]',
   p().guestChoice==='quiet'?'손님은 오래 아무 말도 하지 않았다.\n그동안 문은 세 번 열렸고, 아무도 그 자리를 재촉하지 않았다.':'“오늘 그만뒀어요. 오래 다닌 곳을.”\n손님은 한 문장 말하고 물을 마셨다.\n당신은 다음 문장이 나올 때까지 기다렸다.',
   p().guestChoice==='quiet'?'“물값은요?”\n“오늘은 그냥 드세요.”\n손님이 처음으로 어깨를 내렸다.':'“잘한 건지 모르겠어요.”\n당신도 모른다고 말했다.\n“그래도 오늘 많이 걸어오셨네요.”',
   '백지가 대합실 창문 너머로 보고 있었다.\n당신과 눈이 마주치자, 이번에는 자기 신청서를 들여다봤다.',
   '[03호가 작은 식당의 메모를 표에 띄웠다.]\n“백지 씨도 오세요. 저녁은 18:20까지. — 모래”'
  ],()=>{p().served=true;toast('당직실에서 백지의 여행 시간표를 살펴보세요.');});
 }
 function welcome(choice){speak('처음 온 손님',choice==='quiet'?['그럼 잠깐만 이렇게 있을게요.\n대답할 말을 찾지 않아도 된다니 좀 이상하네요.','[당신은 옆자리의 짐을 치우고 한 걸음 물러났다.]\n손님은 컵을 내려놓고 처음으로 창밖을 보았다.']:['네. 다만 무슨 말을 해야 할지 모르겠어요.','후추가 두 사람 사이에 몸을 밀어 넣었다.\n“그럴 땐 내 얘기부터 해. 내가 오늘 먹은 건…”','손님이 짧게 웃었다.\n당신은 이야기를 고를 시간을 조금 더 기다렸다.'],()=>{p().guestChoice=choice;});}
 function routeBoard(){
  if(!p().served){speak('환승 시간표',['먼저 승강장 손님에게 물 한 잔을 건네자.\n검표원도 안심하고 여행 이야기를 할 수 있을 것 같다.']);return;}
  const route=itinerary();
  if(p().ticket||route.at==='sea'){speak('완성한 여행 계획',['우리 역 17:10 → 솔숲역 17:25\n솔숲역 17:35 → 물결마을 18:05','10분 동안 환승하고 저녁 전에 도착한다.\n가운데 인쇄기에서 표를 꺼내자.']);return;}
  const choices=trains.filter(t=>t.from===route.at).map(t=>({text:`${clock(t.dep)} 출발 → ${names[t.to]} ${clock(t.arr)} 도착`,action:()=>{
   if(t.dep<route.time){speak('엇갈린 환승',['솔숲역에 도착하는 시각은 '+clock(route.time)+'이다.\n이 열차는 '+clock(t.dep)+'에 이미 떠난다.','첫 열차의 계획은 남아 있다.\n시간표를 다시 조사해 더 늦게 출발하는 연결편을 고르자.']);return;}
   if(t.arr>1100){speak('저녁시간을 지난 도착',['이 편은 '+clock(t.arr)+'에 도착한다.\n식당은 18:20에 저녁 주문을 마친다.','다른 연결편이나 출발 경로를 골라보자.\n시간표에서 처음부터 다시 계획할 수도 있다.']);return;}
   p().route.push(t.id);save();objective();tone(440,.4);speak('표 위에 그은 선',[`${names[t.from]} ${clock(t.dep)} → ${names[t.to]} ${clock(t.arr)}`,t.to==='sea'?'저녁시간 안에 도착한다. 가운데 인쇄기에서 표를 받자.':'다시 시간표를 조사해 여기서 이어 타는 열차를 고르자.']);
  }}));
  if(route.list.length)choices.push({text:'처음부터 다시 계획하기',action:()=>{p().route=[];save();objective();routeBoard();}});
  speak('환승 시간표',[`현재 계획: ${names[route.at]} ${clock(route.time)}\n목표: 물결마을에 18:20까지 도착\n\n이후에 탈 열차를 고르자. 실제 시간은 흐르지 않는다.`],null,choices);
 }
 function depart(){speak('먼저 떠나는 검표원',[
  '[백지는 승차권을 내밀다가 웃었다.\n오늘 표를 확인할 사람은 당신이었다.]',
  '백지: 돌아오는 날짜가 비어 있는데 괜찮습니까?\n당신: 나중에 쓰셔도 됩니다.',
  state().choice==='hang'?'문 위의 방울이 울렸다.\n떠나는 사람을 보내는 소리로도 쓸 수 있었다.':'후추가 여울의 안부가 적힌 표를 백지에게 건넸다.\n“방울 든 사람을 찾으면 돼. 이번에는 바닷가 쪽이야.”',
  `백지: ${address()}, 문은 부탁합니다.\n잠그는 것보다 열어두는 쪽을요.`,
  '[당신은 승강장에 남았다.\n이번에는 열차를 놓쳐서 남은 것이 아니었다.]',
  p().guestChoice==='quiet'?'벤치의 손님이 조용히 옆자리를 두드렸다.\n당신은 잠깐 앉았다.':'벤치의 손님이 물었다. “당신은 어디서 왔어요?”\n당신은 조금 긴 이야기를 시작했다.'
 ],()=>{p().ended=true;save();objective();showEnding({eyebrow:'THE END · A PLACE TO COME BACK TO',title:p().guestChoice==='quiet'?'말없이 함께 있던 날':'처음 듣는 이야기',body:'마지막까지 남던 사람이 처음으로 먼저 떠났다.\n역에는 다음 사람을 맞을 불빛이 남았다.\n\n여울은 동생의 오늘을 듣고,\n03호는 바다를 보여주고,\n후추는 발소리를 세지 않고 잠들었다.\n\n당신도 돌아갈 곳을 하나 얻었다.\n\n— 내일 분실물 보관소 · 첫 번째 여정 끝 —',next:false});tone(523,2);tone(783,2);});}
 function handle(id){if(state().chapter!==5)return false;switch(id){
  case 'keeper':keeper();break;
  case 'visitor':visitor();break;
  case 'machine':if(p().ended)speak('자판기 · 03호',['백지 씨에게 첫 휴가 사진이 왔어요.\n사진 절반이 엄지손가락입니다.','그래도 전시했습니다.\n사람들은 풍경보다 그 얘기를 더 좋아하더라고요.']);else if(!p().guestChoice)speak('자판기 · 03호',['사진 잘 받았습니다. 화면 앞에 사람이 모이네요.','승강장 손님이 뭘 원하시는지 먼저 물어봐 주세요.\n사연 제출은 선택 사항으로 바꿨습니다.']);else if(p().cup)speak('자판기 · 03호',['컵은 이미 받으셨어요.\n따뜻할 때 승강장 손님에게 건네주세요.']);else speak('자판기 · 03호',['따뜻한 물 한 잔. 결제 없이 내어드립니다.','사진 속 모래 씨는 빈 의자 앞에도 컵을 놓더군요.\n저도 조금 배웠습니다.','[03호가 손에 쥐기 좋은 온도의 컵을 내밀었다.]\n“오늘의 메뉴는 환영입니다. 메뉴 이름은 좀 부끄럽네요.”'],()=>{p().cup=true;});break;
  case 'route-board':routeBoard();break;
  case 'printer':if(p().ticket)speak('승차권 인쇄기',['백지의 표는 이미 주머니에 있다.\n대합실 안내 데스크로 가져가자.']);else if(itinerary().at!=='sea')speak('승차권 인쇄기',['아직 연결되지 않은 여행이다.\n위쪽 시간표에서 출발과 환승 편을 골라보자.']);else speak('누군가의 첫 승차권',['솔숲역 경유 · 물결마을 18:05 도착\n승객: 백지 / 목적: 휴가','직업을 적는 칸은 없다.\n당신은 표를 접지 않고 조심스레 챙겼다.'],()=>{p().ticket=true;});break;
  case 'office-door':if(!p().met)speak('당직실 문',['안내 데스크의 백지에게 먼저 인사하자.']);else move(9,240,246);break;
  case 'office-back':move(0,405,231);break;
  case 'garden-door':move(10,240,246);break;
  case 'garden-back':move(9,407,229);break;
  case 'door':move(1,240,244);break;
  case 'return':move(0,240,241);break;
  case 'depart':depart();break;
  case 'locker':speak('백지의 사물함',['여벌 장갑 여섯 켤레, 고친 열쇠,\n출발하지 않은 여행안내서 한 권.','책갈피처럼 끼워둔 쪽지에는\n“언젠가, 근무복 말고 다른 옷으로”라고 적혀 있다.']);break;
  case 'garden-plant':speak('옥상 화단',p().watered?['방금 준 물이 흙에 천천히 스며든다.\n꽃 한 송이가 아직 펼쳐지는 중이다.']:['물뿌리개가 화단 옆에 놓여 있다.\n당신은 남아 있던 물을 조금 나누어 주었다.','[접힌 잎 사이에서 작은 꽃이 고개를 들었다.]'],()=>{p().watered=true;});break;
  case 'garden-letter':speak('바닷가에서 온 편지',p().ended?['백지의 엽서: 바다를 봤습니다.\n개찰구가 없어서 한참 어디로 들어가는 건지 찾았습니다.','모래 씨의 식당에는 제 자리가 있더군요.\n아무것도 맡지 않는 자리는 처음 앉아봅니다.','추신. 내일은 한 번 더 쉬겠습니다.\n돌아가는 표는 그다음에 쓸 생각입니다.']:[state().day4.choice==='table'?'여울의 편지: 나루의 월급 이야기는 결국 저녁까지 갔어요.\n다음에는 제가 처음 역무원이 된 날을 이야기하려고요.':'여울의 편지: 바다를 좀 더 걸었어요.\n걷는 동안 무슨 이야기를 했는지는 다음에 얼굴 보고 할게요.','모래의 메모: 백지 씨도 와요.\n18:20 전에 도착하면 저녁을 함께 먹을 수 있어요.']);break;
  case 'garden-chair':speak('두 개의 의자',['한 의자 아래에 고양이 털이,\n다른 의자 아래에는 누군가 읽던 책이 남아 있다.','빈자리에도 먼저 앉았던 사람의 온기가 있다.\n당신은 잠깐 앉았다가, 다음 사람 몫의 의자를 남겼다.']);break;
  case 'cat':speak('후추',[p().ended?`${address()}. 다음엔 이름을 잊지 않아도 놀러 와.\n우린 그냥 만나도 재미있잖아.`:'오늘의 근무는 낮잠이야.\n새 손님에게 편안함이 뭔지 시범을 보이는 중이지.',p().ended?'[후추가 다시 눈을 감았다.\n당신은 깨우지 않고 조금 더 곁에 있었다.]':'지도는 주머니 속 메모에 넣어뒀어.\n고양이는 지도 없이도 다니지만, 너는 아직 연습 중이니까.']);break;
  case 'board':speak('새 안내판',['분실물이 없어도 방문 가능.\n아무 말 없이 쉬어가도 좋음.\n문 닫는 시간: 마지막 사람이 정하지 않아도 됨.','03호의 바다 사진 옆에, 새 의자를 놓을 자리가 생겼다.']);break;
  case 'plant':speak('여울이 남긴 화분',['물뿌리개 옆에 옥상 정원 안내가 붙었다.\n대합실 오른쪽 아래 당직실을 지나갈 수 있다.']);break;
  case 'clock':speak('오늘의 시계',['오늘의 열차는 시간표를 따라 움직인다.\n시간표 퍼즐에 실제 시간 제한은 없다.']);break;
  default:return false;
 }return true;}
 function journal(){const n=p(),notes=['다섯 번째 이야기 — 문을 닫는 사람. 백지의 첫 휴가를 돕기로 했다.'];if(n.guestChoice)notes.push(n.guestChoice==='quiet'?'손님에게 조용히 쉴 자리를 마련했다. 따뜻한 물 한 잔이면 충분하다고 했다.':'손님 옆에 앉아도 좋다는 답을 들었다. 먼저 따뜻한 물을 가져가자.');if(n.served)notes.push('모래의 저녁 초대: 물결마을에 18:20까지. 우리 역에서 17:00 이후 출발. 환승 열차는 도착한 뒤에 출발해야 한다.');if(n.route.length)notes.push('현재 여행 계획: '+itinerary().list.map(t=>`${names[t.from]} ${clock(t.dep)} → ${names[t.to]} ${clock(t.arr)}`).join(' / '));if(n.ticket)notes.push('백지의 승차권을 챙겼다. 안내 데스크로 가져가자.');if(n.ended)notes.push('첫 번째 여정을 마쳤다. 옥상 정원에 백지의 휴가 엽서가 도착했다.');return notes;}
 function inspector(x,y){rect(x-6,y-16,13,16,'#a4b7af');rect(x-5,y-27,11,11,'#d7bda3');rect(x-8,y-29,17,5,'#536d77');rect(x-8,y-24,17,2,'#d4d6b6');rect(x-4,y,4,5,'#354956');rect(x+3,y,4,5,'#354956');}
 function lobbyExtras(){if(state().chapter!==5)return;rect(413,197,36,52,'#2a424d');rect(413,195,36,4,'#a8b495');text('당직실',431,190,'#e0ddae',6,'center');if(!p().ready)inspector(348,141);else rect(328,131,15,7,'#e3d6af');rect(78,103,26,11,'#94b6b7');rect(78,114,26,11,'#ccba93');glow(90,117,36,'#f5d79922');}
 function platformExtras(){if(state().chapter!==5)return;rect(118,154,11,11,'#d6b697');rect(117,166,14,17,'#8f809a');rect(119,181,4,8,'#303e52');rect(127,181,4,8,'#303e52');rect(116,151,15,6,'#514854');if(p().served)rect(137,172,5,6,'#e6deba');if(p().ready&&!p().ended){rect(270,100,92,51,'#899e9c');rect(284,111,33,30,'#3c596a');rect(323,111,26,40,'#ddcf9f');inspector(303,178);text('17:10 · 솔숲행',317,97,'#f7e4b9',6,'center');}}
 function drawOffice(){rect(0,0,480,288,'#243844');rect(20,50,440,117,'#637a79');rect(20,167,440,112,'#586365');for(let y=181;y<279;y+=23)rect(20,y,440,1,'#6d7a75');rect(166,67,148,76,'#293f4b');text('백지의 첫 여행',240,86,'#ebddb7',8,'center');text(p().route.length===2?'우리 역 → 솔숲역 → 물결마을':'도착 뒤에 탈 수 있는 열차는?',240,108,'#b4cec5',7,'center');text('저녁 초대 · 18:20까지',240,130,'#e4c792',7,'center');rect(210,144,60,10,'#a38f70');rect(69,107,39,68,'#82928b');rect(72,111,33,60,'#5f7876');rect(96,139,3,8,'#ded0a0');rect(216,190,48,27,'#8b9490');rect(221,195,38,10,'#29434b');rect(228,212,23,7,'#ddd7b7');text(p().ticket?'표 발급 완료':'승차권 인쇄기',240,235,'#e3e4ca',6,'center');rect(415,197,31,47,'#a6bba6');text('옥상 정원 ↑',431,191,'#e6eccb',6,'center');rect(209,271,63,6,'#b5c4a3');text('↓ 대합실로',240,264,'#e6eccb',7,'center');}
 function drawGarden(time){rect(0,0,480,288,'#6e829b');rect(0,68,480,80,'#c1a38e');rect(366,88,18,18,'#f7d1a1');glow(375,97,64,'#f6d39b33');for(let i=0;i<13;i++)rect(i*39,123-(i%3)*7,27,30,'#667a88');rect(20,153,440,124,'#788680');for(let x=24;x<460;x+=26){rect(x,129,3,31,'#4e6970');rect(x,139,26,3,'#92aaa0');}for(let y=178;y<277;y+=23)rect(20,y,440,1,'#8e9987');rect(68,150,55,18,'#927862');for(let i=0;i<5;i++){const x=74+i*9;rect(x,135-i%2*6,3,19,'#648969');if(p().watered)rect(x-2,133-i%2*6,7,5,i%2?'#e5d19e':'#c7aebc');}rect(339,147,37,26,'#677f7b');rect(345,152,25,14,'#ded2a9');rect(346,157,19,1,'#8d9485');for(const x of [166,220]){rect(x,187,20,15,'#536f70');rect(x,206,20,6,'#a49070');rect(x+3,212,3,9,'#53636a');}for(let i=0;i<7;i++)rect((i*79+time*4)%440+20,103+(i*13)%35,2,1,'#f3d5a07a');text('아무 일 없어도 올라오는 곳',240,70,'#f6e6c5',7,'center');rect(209,271,63,6,'#c3c9a9');text('↓ 당직실로',240,264,'#f1e7c7',7,'center');}
 return {start,task,handle,journal,roomEntities,obstacles,normaliseRoute,lobbyExtras,platformExtras,drawOffice,drawGarden};
};
