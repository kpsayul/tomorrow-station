'use strict';
// Chapters 6–8: a complete second arc. State is kept in the normal save envelope.
window.createSecondJourney=function(api){
 const {speak,toast,tone,save,objective,move,showEnding,rect,text,glow}=api;
 const state=()=>api.state(),p=()=>state().journey2;
 const chapter=()=>state().chapter,part=()=>p()[chapter()===6?'six':chapter()===7?'seven':'eight'];
 const address=()=>state().night2.choice==='name'?'온':'친구';
 const roomNames={11:'밤 우편열차',12:'끊어진 철교',13:'유리도시 광장',14:'반송 기록청',15:'중앙 우편국',16:'새벽의 연결교'};
 const titles={6:'지도에 없는 0번선',7:'반송된 도시',8:'마지막 수취인'};
 const minY={11:158,12:176,13:158,14:151,15:157,16:177};
 const rooms={
  11:[{id:'ieum',x:96,y:185,label:'기관사 이음',radius:29},{id:'parcel',x:229,y:179,label:'배달되지 않은 소포',radius:28},{id:'manifest',x:383,y:183,label:'발송 장부',radius:28},{id:'receiver',x:330,y:232,label:'03호의 수신표',radius:27},{id:'to-bridge',x:240,y:264,label:'철교 점검대로',radius:24}],
  12:[{id:'bag-0',x:96,y:206,label:'파란 우편낭',radius:28},{id:'bag-1',x:238,y:206,label:'붉은 우편낭',radius:28},{id:'bag-2',x:380,y:206,label:'하얀 우편낭',radius:28},{id:'relay',x:91,y:250,label:'철교 송신기',radius:24},{id:'cross',x:380,y:250,label:'도시행 출발 신호',radius:25},{id:'back-train',x:240,y:267,label:'우편열차로',radius:24}],
  13:[{id:'dam',x:105,y:205,label:'지도를 그리는 아이',radius:29},{id:'city-board',x:235,y:173,label:'꺼진 도착 안내판',radius:28},{id:'city-phone',x:381,y:204,label:'공중전화',radius:27},{id:'city-cat',x:308,y:246,label:'후추',radius:26},{id:'to-records',x:240,y:266,label:'반송 기록청으로',radius:24}],
  14:[{id:'clerk',x:91,y:180,label:'중앙국장 서린',radius:30},{id:'return-log',x:236,y:179,label:'반송 결재철',radius:29},{id:'witness',x:384,y:179,label:'배달원의 증언',radius:29},{id:'appeal',x:94,y:240,label:'이의 신청 단말',radius:26},{id:'dispatch',x:383,y:240,label:'중앙국 연결편',radius:26},{id:'back-city',x:240,y:266,label:'광장으로',radius:24}],
  15:[{id:'director',x:92,y:186,label:'서린과 이음',radius:30},{id:'archive',x:236,y:181,label:'끊긴 음성 원본',radius:29},{id:'live-wire',x:383,y:186,label:'바깥 노선 수신기',radius:28},{id:'routing',x:94,y:240,label:'광역 선로 제어대',radius:28},{id:'to-dawn',x:383,y:240,label:'연결교로',radius:26}],
  16:[{id:'last-signal',x:240,y:201,label:'마지막 출발 신호',radius:30},{id:'dawn-ieum',x:88,y:217,label:'이음',radius:28},{id:'dawn-cat',x:390,y:219,label:'후추',radius:27},{id:'home-letter',x:98,y:260,label:'우리 역에서 온 편지',radius:23},{id:'network-map',x:382,y:260,label:'이어진 노선도',radius:23},{id:'back-central',x:240,y:268,label:'중앙국으로',radius:23}]
 };
 const obstacles={
  11:[{x:80,y:153,w:27,h:30},{x:208,y:151,w:43,h:32},{x:362,y:153,w:43,h:32}],
  12:[{x:78,y:182,w:36,h:26},{x:220,y:182,w:36,h:26},{x:362,y:182,w:36,h:26}],
  13:[{x:83,y:174,w:36,h:31},{x:205,y:144,w:60,h:30},{x:366,y:162,w:30,h:42}],
  14:[{x:75,y:150,w:29,h:32},{x:214,y:150,w:44,h:31},{x:365,y:149,w:37,h:34}],
  15:[{x:75,y:155,w:34,h:31},{x:212,y:149,w:48,h:35},{x:366,y:155,w:34,h:32}],
  16:[{x:216,y:178,w:48,h:25}]
 };
 const sorting=['hold','return','trace'],sortNames={hold:'제자리 보관',return:'발신자에게 반송',trace:'주소 조사'};
 function roomEntities(room){return (rooms[room]||[]).map(e=>e.id==='witness'&&p().six.choice==='public'?{...e,label:'공개된 운행 명령'}:e);}
 function commit(change,message){change();save();objective();if(message)toast(message);}
 function start(next){
  if(next===6&&chapter()===5&&state().night5.ended){state().chapter=6;move(11,240,246);speak('두 번째 여정 · 밤 우편열차',[
   '목요일 여섯 시. 여울은 약속대로 전화를 걸었다.\n나루가 받았다. 두 사람은 십 분 넘게 통화를 했다.',
   '그날 밤, 03호에게서 검은 봉투 한 장이 나왔다.\n수신: 우리 역 / 반송 사유: 존재하지 않는 역.',
   '03호: 제가 분명 여기 있는데요. 존재 확인을 다시…\n[역 밖에서 처음 듣는 열차의 경적이 울렸다.]',
   '기관사가 열린 문에서 손을 내밀었다.\n“이음입니다. 당신 역만 그런 게 아니에요. 타요.”',
   '차창 밖으로 간판 없는 승강장들이 지나갔다.\n열두 개, 열세 개. 불 켜진 집들이 있는데 열차는 멈추지 않았다.'
  ]);}
  else if(next===7&&chapter()===6&&p().six.ended){state().chapter=7;move(13,240,249);speak('유리도시 · 지워진 주소',[
   '열차가 광장 한가운데 섰다. 사람들은 달려오지 않았다.\n누군가는 창문을 닫았고, 누군가는 번호판부터 적었다.',
   p().six.choice==='public'?'어젯밤 공개한 반송 원본이 벽마다 붙어 있었다.\n그 아래에 누군가 물었다. “왜 남의 이름까지 방송했어요?”':'공개한 기록의 이름 칸은 가려져 있었다.\n“증거라고 하기엔 빈칸이 많군요.” 중앙국장이 먼저 기다리고 있었다.',
   '이음이 중앙국장을 알아봤다.\n“서린 씨. 동쪽 노선도 이렇게 없앴어요?”',
   '서린: 여기서 그 얘기 하지 마요.\n이음: 그럼 언제 해요. 동생이 일하던 노선인데.',
   '광장 구석에서 아이가 지도를 다시 그리고 있었다.\n방금 열차가 선 자리에 처음으로 색을 칠했다.'
  ]);}
  else if(next===8&&chapter()===7&&p().seven.ended){state().chapter=8;move(15,240,250);speak('중앙 우편국 · 마지막 집하',[
   '우편국의 천장은 밤하늘처럼 높았다.\n열일곱 갈래 선로에서 봉투가 눈처럼 쏟아졌다.',
   '서린이 일괄 반송 스위치를 눌러 멈췄다.\n벨트 위에 종이가 밀렸다. 다음 집하 전까지 길을 정해야 했다.',
   '이음: 동쪽 노선 음성부터 틀어요. 자르지 말고.\n서린: 이걸 들으면, 나를 더 싫어할 겁니다.\n이음: 그건 내가 정할게요.',
   '03호가 수신표에서 말했다.\n“이번에는 수신 확인도 받죠. 보냈다는 말만 믿지 말고.”'
  ]);}
 }
 function captain(){
  const n=p().six;
  if(n.met){speak('기관사 · 이음',[n.ended?'“철교는 열렸어요. 도시에서는 내 말부터 믿지 않아도 돼요.”':'“보류와 거절은 달라요. 주소가 지워진 건 또 다르고.”\n이음이 철교 점검대의 세 우편낭을 가리켰다.']);return;}
  speak('기관사 · 이음',[
   '이음이 접힌 지도를 펼쳤다. “당신이 기다리며 만든 역도 여기 있어요.\n다른 누군가가 남겨둔 역들과 연결돼 있죠.”',
   `“지금은 ${state().night3.choice==='rest'?'쉼표역':'다음역'}이죠? 지도에는 아직 내일역이에요.\n주소를 고치려는 요청까지 반송됐더군요.”`,
   '“지도에서 빠지면 열차가 안 서요. 편지도 못 들어가고.\n안 오는 편지는 전부 ‘받기 싫은 것’으로 처리됩니다.”',
   '“나는 빈 열차를 몰아요. 승객이 타면 무단 운행이거든.”\n후추: 지금 우리 탔는데.\n이음: 그래서 먼저 이름을 알려드린 거예요.',
   '차창 밖에서 한 아이가 종이 지도를 흔들었다.\n이음은 경적을 두 번 울렸지만, 열차는 지나쳤다.',
   '“동생 결도 동쪽 노선 배달원이었어요. 폐선 뒤로\n‘돌아오지 마’라는 녹음 하나만 왔죠. 원본은 중앙국에 있고.”',
   '“철교에서 막힐 거예요. 소포, 장부, 03호 수신표를 살펴봐요.\n실제 요청과 반송 명령이 같은지 확인해야 건널 수 있어요.”'
  ],()=>commit(()=>{n.met=true;}));
 }
 function clue(id){
  const n=p().six;if(!n.met){speak('잠긴 우편칸',['기관사 이음이 열쇠를 들고 있다. 먼저 이야기를 듣자.']);return;}
  const lines={parcel:['파란 소포: “목요일까지 여기 맡겨주세요. 직접 찾으러 올게요.”','붉은 봉투: “잘못 주문했습니다. 보내신 분께 돌려주세요.”\n두 사람 모두 주소와 이름을 적었다.'],manifest:['하얀 봉투의 수신지는 유리도시. 어제까지 배달한 주소다.\n수취 거절 서명은 없는데 「거절」 도장이 찍혀 있다.','장부 여백: “지도에서 주소가 사라짐. 사람이 없어진 것은 아님.”\n이음이 그 줄에 세 번 밑줄을 그었다.'],receiver:[state().choice==='hang'?'03호: 문 위 방울이 잘 울립니다. 우리 역은 그대로 있어요.':'03호: 방울 든 여울 씨가 방금 전화했습니다. 우리 역은 그대로예요.','03호: 중앙 분류가 셋을 한데 묶었습니다. 보류, 거절, 주소 실종.\n보류는 보관, 거절은 반송, 사라진 주소는 조사해야죠.','후추: 기계가 기계 욕을 해도 돼?\n03호: 저는 업무 얘기를 하고 있습니다.']};
  speak(id==='receiver'?'자판기 · 03호':'우편물의 기록',lines[id],()=>commit(()=>{if(!n.clues.includes(id))n.clues.push(id);},`대조할 기록 ${n.clues.length+(n.clues.includes(id)?0:1)} / 3`));
 }
 function bag(index){
  const n=p().six;if(n.clues.length<3){speak('봉인된 우편낭',['소포, 발송 장부, 03호 수신표부터 비교하자.\n이 우편물을 남의 뜻대로 보내면 같은 일이 반복된다.']);return;}
  if(n.aligned){speak('분류를 마친 우편낭',[`${['파란 소포','붉은 봉투','하얀 봉투'][index]} → ${sortNames[n.route[index]]}\n요청서가 겉면에 함께 붙어 있다.`]);return;}
  speak(['파란 소포','붉은 봉투','하얀 봉투'][index],[[
   '“목요일까지 여기 맡겨주세요.”\n아직 찾으러 오지 않은 소포다.',
   '“잘못 주문했어요. 보내신 분께 돌려주세요.”\n수취인이 직접 서명했다.',
   '배달하던 도시가 지도에서 사라졌다.\n수취인이 거절했다는 기록은 없다.'
  ][index]+`\n현재 처리: ${sortNames[n.route[index]]||'미정'}`],null,Object.entries(sortNames).map(([value,label])=>({text:label,action:()=>commit(()=>{n.route[index]=value;},`${index+1}번 우편낭 → ${label}`)})));
 }
 function relay(){
  const n=p().six;
  if(n.aligned){speak('철교 송신기',[n.choice==='public'?'실명 원본이 전송됐다. 누가 분류를 바꿨는지 도시가 확인할 수 있다.':'발신인 이름을 가린 사본이 전송됐다. 원본은 당신이 보관하고 있다.','오른쪽 아래 출발 신호에서 도시로 들어갈 수 있다.']);return;}
  if(n.clues.length<3){speak('철교 송신기',['기록 세 개를 대조한 뒤 우편낭을 분류해야 한다.']);return;}
  const wrong=n.route.map((v,i)=>v===sorting[i]?null:i).filter(v=>v!==null);
  if(wrong.length){speak('되돌아온 분류표',['확인이 필요한 우편낭:\n'+wrong.map(i=>['파랑: 찾으러 올 때까지 보관 요청.','빨강: 발신자에게 돌려달라는 서명.','하양: 주소 실종. 거절 서명 없음.'][i]).join('\n'),'맞춘 분류는 남아 있다. 필요한 우편낭만 고치자.']);return;}
  speak('기관사 · 이음',[
   '다르게 분류한 세 요청서가 철교의 차단기를 열었다.\n잘못 반송된 원본을 도시로 보내면 정차 허가를 요구할 수 있다.',
   '이음: 원본이면 중앙국도 부인 못 해요. 대신 발신인 이름이 나가요.\n후추: 우리가 그 사람들 대신 결정해도 되는 거야?',
   '이음: 가리고 보내면 위조라고 하겠죠. 증언해줄 사람을 더 찾아야 해요.\n기관사의 손이 송신 버튼 위에서 멈췄다.'
  ],null,[{text:'원본을 공개한다.',action:()=>publish('public')},{text:'발신인 이름을 가리고 보낸다.',action:()=>publish('private')}]);
 }
 function publish(choice){speak('첫 번째 송신',choice==='public'?[
  '당신은 원본을 보냈다. 전광판마다 같은 반송 도장이 떴다.\n직인 아래 중앙국의 운행 명령 번호가 보였다.',
  '이음: 이제 부인 못 할 거예요.\n후추: 이름 나온 사람한테는 우리가 직접 설명해야 해.'
 ]:[
  '당신은 이름을 가리고 사본을 보냈다.\n도시에서 답이 왔다. “얘기할 게 있어요. 기록청 뒤편으로 와요.”',
  '중앙국은 곧바로 증거 불충분이라고 응답했다.\n이음: 그럼 한 사람 더 만나야겠네요.'
 ],()=>commit(()=>{p().six.choice=choice;p().six.aligned=true;},'철교 오른쪽 아래 출발 신호가 켜졌습니다.'));}
 function cross(){const n=p().six;if(!n.aligned){speak('붉은 출발 신호',['세 우편낭을 분류하고 왼쪽 아래 송신기에서 확인하자.']);return;}
  if(n.ended){speak('도시행 열차',['「반송된 도시 시작」으로 다음 이야기를 이어갈 수 있다.']);return;}
  speak('0번선의 첫 정차',[
   '이음이 일곱 해 동안 쓰지 않았던 정차 레버를 내렸다.\n차창 밖의 아이가 달리기를 멈췄다.',
   '“오늘은 서요?”\n이음이 창문을 열었다. “응. 오늘은.”',
   '중앙국에서 새 명령이 왔다.\n「해당 도시의 거절 서명: 0건. 노선 폐쇄 명령은 유효함.」',
   '후추가 발톱으로 종이를 찍었다.\n“아무도 싫다고 안 했는데, 누가 싫대?”'
  ],()=>{commit(()=>{n.ended=true;});showEnding({eyebrow:'SECOND JOURNEY · CHAPTER 6',title:'아무도 거절하지 않은 도시',body:'열차 한 대가 시간표에 없는 곳에 멈췄다.\n광장에는 아직 사람들이 살고 있었다.\n\n기록청의 문이 열렸다.\n노선을 닫았던 사람이 직접 당신을 기다리고 있었다.',next:true});});
 }
 function citizen(){
  const n=p().seven;if(n.met){speak('아이 · 담',[n.ended?'“내 지도 틀린 거 아니었네.”\n담은 새 선로를 지우개 없이 한 번에 그었다.':'“엄마 주소는 여기야. 틀렸으면 내가 고칠게.\n그런데 틀린 데를 알려줘야 고치지.”']);return;}
  speak('아이 · 담',[
   '“엄마가 저쪽 공장에서 일해. 편지 보냈는데 계속 돌아와.”\n아이의 지도에는 공장 지붕 모양까지 그려져 있었다.',
   '“주소 틀렸대서 세 번 걸어가 봤어.\n집은 있는데 역이 없대. 그러면 편지는 어떻게 가?”',
   p().six.choice==='public'?'담이 벽의 공개 기록을 가리켰다. “저거 우리 엄마 이름이야.”\n당신은 허락받지 않고 내보냈다고 설명했다. 담은 종이를 떼어 접었다.':'“우리 이름 안 내보낸 건 고마워요.”\n아이가 접힌 배달원 쪽지를 내밀었다. “이 사람이 기다린대.”',
   '광장 끝에서 서린이 당신을 불렀다.\n담이 물었다. “저 사람한테 지도 보여주면 이번에는 봐줄까?”'
  ],()=>commit(()=>{n.met=true;}));
 }
 function clerk(){const n=p().seven;if(!n.met){speak('중앙국장 · 서린',['“먼저 저 아이 얘기부터 듣고 오세요.\n내 설명을 먼저 들으면 지도 대신 규정을 보게 될 테니까.”']);return;}
  if(n.director){speak('중앙국장 · 서린',[n.proven?'“이의 신청은 접수됐습니다. 이번에는 자동 반송 안 합니다.”':'“결재철과 운행 기록을 확인하세요.\n당신이 틀렸다면 여기서 운행을 멈춰주세요. 제가 틀렸다면… 저도요.”']);return;}
  speak('중앙국장 · 서린',[
   '“일곱 해 전 철교가 무너졌습니다. 동쪽에서 마지막으로 온 음성은\n‘돌아오지 마’. 노선을 닫은 건 나예요.”',
   '이음: 그 뒤로 동생 목소리를 한 번이라도 다시 확인했어요?\n서린: 돌아가다 다친 사람이 더 생기는 건 막아야 했습니다.',
   '“처음엔 임시 중단이었어요. 답이 없는 노선은 멈추도록 했죠.\n멈춘 노선의 편지도 답이 없는 것으로 처리되기 시작했습니다.”',
   '03호: 편지를 막아놓고 답을 기다렸군요.\n서린은 수신표를 보다가 서류함을 열었다.',
   '“결재철을 보세요. 그리고 다른 기록 하나와 대조해요.\n내 서명이 있다면 숨기지 않겠습니다.”'
  ],()=>commit(()=>{n.director=true;}));
 }
 function evidence(id){const n=p().seven;if(!n.director){speak('잠긴 기록함',['서린에게 기록을 열어달라고 요청해야 한다.']);return;}
  let lines;
  if(id==='return-log')lines=['주민들의 신청은 「배달 보류」였다.\n다음 장에는 똑같은 신청들이 「수취 거절」로 바뀌어 있었다.','승인: 서린 / 자동 연장: 7회.\n예외 보고: 담당자가 읽지 않음.'];
  else if(p().six.choice==='public')lines=['공개 원본의 운행 명령 번호가 중앙국 사본과 일치한다.\n수신 확인란은 일곱 해 동안 모두 비어 있었다.','열차를 보낸 기록만으로 배달 완료를 처리했다.\n주민들이 동의했다는 기록은 어디에도 없다.'];
  else lines=['배달원이 가림막 뒤에서 나왔다.\n“내 이름을 감춰줬더군요. 그래서 왔어요.”','“매년 돌아온 편지에 보류라고 적었습니다.\n중앙에서는 거절로 바꿨죠. 내 장부를 가져가세요.”','원본 장부에는 일곱 번의 이의 신청 날짜가 남아 있었다.\n담의 어머니가 직접 쓴 주소도 그대로였다.'];
  speak(id==='return-log'?'반송 결재철':p().six.choice==='public'?'운행 명령의 사본':'배달원의 증언',lines,()=>commit(()=>{if(!n.evidence.includes(id))n.evidence.push(id);}));
 }
 function appeal(){const n=p().seven;
  if(n.proven){speak('이의 신청 단말',['반송 명령 정지 요청: 접수됨.\n오른쪽 아래 중앙국 연결편으로 가자.']);return;}
  if(n.evidence.length<2){speak('이의 신청 단말',['반송 결재철과 옆의 기록을 모두 읽어야 한다.\n추측 대신 대조할 증거를 붙이자.']);return;}
  speak('이의 신청 단말',['서린이 묻는다. “폐선이 부당하다는 근거가 무엇입니까?”\n서명란 옆에는 자동 반송 버튼이 켜져 있다.'],null,[
   {text:'지도에 집이 그려져 있다.',action:()=>speak('중앙국장 · 서린',['“사람이 산다는 증거는 됩니다. 배달에 동의했다는 증거는 아니죠.”\n결재철에서 실제 요청이 무엇으로 바뀌었는지 보자.'])},
   {text:'보류 신청이 거절로 바뀌었다.',action:()=>speak('중앙국장 · 서린',[
    '당신은 두 장부를 나란히 놓았다. 같은 날짜, 다른 처리.\n서린이 결재란의 자기 서명에 손을 댔다.',
    '“안 읽었어요. 아무도 답하지 않는 노선이라고 믿었으니까.”\n이음: 결도? 내 동생 것도?',
    '서린은 자동 반송 버튼을 껐다.\n“원본 녹음이 중앙국에 있습니다. 같이 갑시다.”'
   ],()=>commit(()=>{n.proven=true;}))},
   {text:'이음이 동생을 기다리고 있다.',action:()=>speak('기관사 · 이음',['“그건 내 이유예요. 도시 사람들 신청까지 대신할 수는 없어요.”\n그녀가 당신에게 결재철을 다시 건넸다.'])}
  ]);
 }
 function dispatch(){const n=p().seven;if(!n.proven){speak('중앙국 연결편',['이의 신청 단말에서 반송의 근거부터 따져야 한다.']);return;}
  if(n.ended){speak('떠난 연결편',['「마지막 수취인 시작」으로 중앙국에 갈 수 있다.']);return;}
  speak('도시의 응답',[
   '서린이 일괄 반송을 멈추려면 각 주소의 실제 답이 필요하다고 했다.\n담이 엄마 주소를 쥐고 공중전화 앞으로 달려갔다.',
   '이음: 한꺼번에 방송하면 빨라요. 다들 광장에 나와줄까요?\n후추: 자기 사정이 남에게 들리는 게 싫을 수도 있잖아.',
   '서린: 한 집씩 봉함 답장을 받는 방법도 있어요. 시간이 더 들죠.\n어느 쪽이든 답하지 않은 집은 거절로 처리하지 않겠습니다.'
  ],null,[{text:'광장에서 함께 답한다.',action:()=>cityReply('square')},{text:'집마다 봉함 답장을 받는다.',action:()=>cityReply('letters')}]);
 }
 function cityReply(choice){speak(choice==='square'?'광장의 첫 방송':'집집마다 돌아온 봉투',choice==='square'?[
  '당신이 마이크를 켰다. 담이 자기 주소부터 또박또박 읽었다.\n닫혀 있던 창문 하나에서 대답이 나왔다. 그다음은 맞은편에서.',
  '말하지 않는 사람 앞에는 빈 봉투를 놓았다.\n“여기에 적어도 돼요. 오늘 안 적어도 되고요.”',
  '이음은 사람들 사이에서 동생의 이름을 부르려다 마이크를 내려놨다.\n“결의 건 원본으로 들을게요. 내가 하고 싶은 대답 말고.”'
 ]:[
  '당신과 담은 문마다 봉투를 두고 걸었다. 답이 없는 문도 있었다.\n그 문에는 반송 도장 대신 「아직 응답 없음」을 붙였다.',
  '기다리는 동안 연결편 한 대를 보냈다. 이음은 시계를 봤지만 재촉하지 않았다.\n가장 마지막으로 온 편지는 이름 대신 엄지손가락 자국을 찍었다.',
  '담이 엄마에게 쓴 봉투를 맨 위에 올렸다.\n“이번에는 엄마가 받았다는 답도 와?”'
 ],()=>{commit(()=>{p().seven.choice=choice;p().seven.ended=true;});showEnding({eyebrow:'SECOND JOURNEY · CHAPTER 7',title:choice==='square'?'도시가 대답한 날':'늦게 도착한 대답',body:'지도에서 지웠던 주소들이 하나씩 돌아왔다.\n\n서린이 동쪽 노선의 원본 목록을 내밀었다.\n「배달원 결 / 마지막 음성: 43초」\n\n이음이 갖고 있던 녹음은 겨우 3초였다.',next:true});});}
 function director(){const n=p().eight;if(n.met){speak('서린과 이음',[n.live?'이음은 수신기의 불을 보고 있었다.\n“기다릴 수 있어. 이제 어디를 보고 기다리는지 아니까.”':'“가운데 음성 원본부터 들읍시다.”\n서린이 자기 의자를 이음 쪽으로 밀었다.']);return;}
  speak('서린과 이음',[
   '서린: 사고 당일엔 첫 문장만 전달됐어요. 복구된 원본은 나중에 왔죠.\n나는 폐선한 노선의 추가 기록을 열어보지 않았습니다.',
   '이음: 그동안 나는 동생이 날 안 만나겠다는 말을 매일 들었어요.\n서린은 변명하려다 멈췄다.',
   '이음이 직접 재생 버튼에 손을 댔다.\n“사과는 나중에 들어요. 지금은 이 목소리부터.”'
  ],()=>commit(()=>{n.met=true;}));
 }
 function recording(){const n=p().eight;if(!n.met){speak('음성 원본 보관함',['이음과 서린을 먼저 부르자. 이 녹음의 수취인은 이음이다.']);return;}
  speak('배달원 결 · 원본 43초',[
   '“돌아오지 마. 아직 다리가 무너져 있어.\n북쪽 우회선으로 와. 거긴 사람 지나갈 수 있대.”',
   '“나는 남쪽 우편소에 있어. 사람들 편지부터 옮길게.\n언니가 늘 쓰는 주소로 답장 보낼게.”',
   '녹음이 끝난 뒤에도 이음은 버튼에서 손을 떼지 않았다.\n후추가 아주 천천히 옆 의자로 올라갔다.',
   '서린: 지금 거기 계신지는 확인해야 합니다. 일곱 해 전 녹음이니까.\n이음: 알아요. 그래서 이번에는 답을 받을 거예요.',
   '03호: 오른쪽 수신기로 현재 신호를 보내봅시다.\n돌아온 답이 옛 녹음인지 구별할 질문도 넣고요.'
  ],()=>commit(()=>{n.heard=true;}));
 }
 function liveWire(){const n=p().eight;if(!n.heard){speak('바깥 노선 수신기',['원본의 목적지를 확인한 다음에 연결할 수 있다.']);return;}
  if(n.live){speak('남쪽 우편소 · 결',['“언니, 나 지금 듣고 있어. 끊지 마.”\n이음은 수화기를 두 손으로 받았다.']);return;}
  if(!n.challenge){speak('자판기 · 03호',[
   '03호: 지금 처음 보내는 확인 부호는 「등대 28」입니다.\n복구된 옛 녹음의 부호는 「등대 03」이었죠.',
   '수신기에서 세 채널이 번갈아 울렸다.\n“등대 03. 돌아오지 마.” / “등대 28. 남쪽 우편소입니다.” / 잡음.',
   '이음이 당신을 봤다.\n“이번에 보낸 말에 답한 채널을 연결해줘.”'
  ],()=>commit(()=>{n.challenge=true;}));return;}
  speak('현재의 목소리',['메모의 확인 부호와 돌아온 응답을 비교하자.\n지금 보낸 질문에 답한 채널은 어느 쪽일까?'],null,[
   {text:'등대 03 · 돌아오지 마.',action:()=>speak('자판기 · 03호',['이건 복구된 옛 녹음입니다. 방금 보낸 부호는 「등대 28」.\n저장된 대답과 현재의 대답을 구별해야 합니다.'])},
   {text:'등대 28 · 남쪽 우편소입니다.',action:()=>speak('남쪽 우편소 · 결',[
    '“여기 결입니다. 확인 부호 등대 28.\n…언니? 그 경적 소리 아직도 쓰네.”',
    '이음: 왜 안 돌아왔어.\n결: 돌아갔어. 역이 없었어. 편지도 계속 돌아왔고.\n두 사람은 동시에 말을 멈췄다.',
    '결: 지금도 이 일 해. 주소 옮길 때마다 편지 남겨뒀어.\n언니는?\n이음: 나도. 빈 열차. 이제 안 비었어.',
    '담에게도 다른 답장이 왔다. 공장 교대실에서 보낸 어머니의 글씨였다.\n「오늘 밤 집에 가. 역 앞에서 만나자.」'
   ],()=>commit(()=>{n.live=true;},'현재의 수신 확인을 받았습니다.'))},
   {text:'응답 없는 채널을 닫는다.',action:()=>speak('후추',['“아무 대답 없다고 싫다는 건 아니라며.”\n그 채널은 그대로 두고, 부호가 맞는 쪽을 연결하자.'])}
  ]);
 }
 function routing(){const n=p().eight;if(n.policy){speak('광역 선로 제어대',[n.policy==='local'?'각 역이 자기 주소와 수신 여부를 확인한다. 중앙은 길을 연결한다.':'중앙과 각 역이 함께 확인한다. 한쪽 답만으로 노선을 지우지 않는다.','오른쪽 연결교에서 마지막 출발 신호를 보내자.']);return;}
  if(!n.live){speak('광역 선로 제어대',['옛 기록만으로 길을 정할 수 없다. 오른쪽 수신기에서 현재의 응답을 확인하자.']);return;}
  speak('다시 움직일 열일곱 노선',[
   '서린: 내 결재 하나로 도시를 지울 수 있게 두면 또 생깁니다.\n중앙에 두었던 확인 권한을 바꾸죠.',
   '이음: 각 역이 직접 정해요. 여기까지 허락받으러 오게 하지 말고.\n서린: 사람이 적은 역은 확인을 맡을 사람도 없어요.',
   '03호: 중앙과 역이 함께 확인하면요?\n이음: 서로 기다리다 또 늦어질 수 있죠.',
   '두 안 모두 응답 없는 주소를 남겨두고, 결정을 되돌릴 수 있다.\n어느 부담을 함께 지는 쪽으로 시작할까?'
  ],null,[{text:'각 역에 확인 권한을 나눈다.',action:()=>policy('local')},{text:'중앙과 역이 함께 확인한다.',action:()=>policy('shared')}]);
 }
 function policy(value){speak('새 운행 약속',value==='local'?[
  '각 역에 주소 장부와 정정 열쇠를 보냈다.\n이음은 사람이 없는 작은 역들을 맡아 순회하겠다고 했다.',
  '서린: 잘못 적은 주소가 생기면 누가 고치죠?\n당신: 틀렸다고 알려줄 창구부터 열어둬요. 우리 것도요.'
 ]:[
  '중앙과 역에 같은 장부를 놓았다. 수정은 양쪽에 표시된다.\n서린은 답이 늦은 요청도 볼 수 있도록 대기 목록을 열었다.',
  '이음: 시간이 더 걸리면 그동안 누가 기다리는지도 써요.\n서린은 첫 칸에 담의 이름을 적었다.'
 ],()=>commit(()=>{p().eight.policy=value;},'새 운행 약속을 저장했습니다. 연결교에서 출발 신호를 보내세요.'));}
 function finale(){const n=p().eight;if(n.ended){speak('새벽의 출발 신호',['열일곱 노선이 저마다 다른 시각에 깨어난다.\n이번 여정은 마쳤다. 친구들과 남은 편지를 살펴보자.']);return;}
  if(!n.policy){speak('잠긴 출발 신호',['중앙국 제어대에서 새 운행 약속을 정해야 한다.']);return;}
  speak('새벽의 연결교',[
   '당신이 신호를 내리자, 어둠 속 선로들이 한 번에 켜지지 않았다.\n먼저 가까운 역. 조금 뒤 강 건너. 가장 먼 쪽은 한참 뒤에.',
   p().seven.choice==='square'?'광장에서 받았던 목소리들이 수신 확인으로 돌아왔다.\n담이 엄마와 나란히 마이크를 잡고 자기 주소를 읽었다.':'봉함 답장에 찍힌 작은 표시들이 노선도에 켜졌다.\n담의 집에도 배달 완료가 떴다. 이번에는 어머니가 직접 서명했다.',
   p().six.choice==='public'?'서린은 공개 기록의 이름을 지우고 처리 잘못을 자기 이름으로 고지했다.\n당신은 담의 어머니에게도 공개한 일에 대한 답장을 보냈다.':'증언한 배달원은 자기 이름을 다시 적어도 된다고 했다.\n공개할 범위는 그가 직접 골랐다.',
   '이음이 경적을 두 번 울렸다. 남쪽에서 두 번이 돌아왔다.\n결은 긴 편지 대신 한 문장을 보냈다. “이번엔 역 앞에서 봐.”',
   '03호: 저도 바다 말고 다른 사진을 받을 수 있겠군요.\n후추: 내 사진 먼저. 장거리 출장비는 사진으로 받는다.',
   '우리 역에서 여울의 전화가 왔다.\n“기다리는 손님 있어요?”\n당신은 대답했다. “여기는 지금, 내려서 만나는 중이에요.”'
  ],()=>{commit(()=>{n.ended=true;});showEnding({eyebrow:'END OF THE SECOND JOURNEY',title:n.policy==='local'?'열일곱 개의 다음':'서로 확인한 새벽',body:(n.policy==='local'?'작은 역에는 주소를 고칠 사람이 더 필요했다.\n이음은 결을 만난 뒤, 두 사람이 함께 순회할 시간을 정했다.':'답이 늦어 출발을 미룬 열차도 있었다.\n서린은 지연 목록을 공개하고, 기다리는 역에 직접 전화를 걸었다.')+'\n\n모든 편지가 답을 받은 것은 아니었다.\n답이 없는 봉투에도 이제 돌아갈 자리가 남았다.\n\n우리 역으로 돌아온 소포에는 간판 하나가 들어 있었다.\n「0번선 · 정차합니다」\n\n— 두 번째 여정 끝 —',next:false});tone(523,2);tone(784,2);});}
 function epilogue(id){
  const n=p().eight;
  if(id==='dawn-ieum')speak('기관사 · 이음',n.ended?['“결은 생각보다 머리가 짧더라.”\n이음이 사진을 보여줬다. 둘 다 웃다가 눈을 감은 사진이었다.','“예전에 좋아하던 빵을 사갔더니 지금은 싫어한대.\n잘됐지. 일곱 해 전 얘기 말고 물어볼 게 생겨서.”']:['이음은 돌아오는 열차를 세고 있었다.\n“일곱 해 동안은 지나가는 것만 셌거든.”']);
  else if(id==='dawn-cat')speak('후추',[`${address()}. 네가 나를 기억해서 내가 여기 있다고 했지.`,n.ended?'“그런데 담이 내 이름을 알더라. 이음도, 결도.\n이제 네가 혼자 다 기억 안 해도 되겠네.”':'“저기서도 누가 내 이름을 부르면 좋겠다.\n근무표 적을 때 말고.”']);
  else if(id==='home-letter')speak('우리 역에서 온 편지',[state().day4.choice==='table'?'나루: 언니가 이번 목요일에는 밥을 하겠대. 모래가 걱정하더라.':'나루: 이번 목요일에는 내가 역으로 갈게. 길은 언니한테 물어봤어.',state().night5.guestChoice==='quiet'?'연: 조용히 앉아 있다가 편지 분류를 조금 도왔어요. 다음엔 그냥 놀러 올게요.':'연: 다음 손님이 와서 내 얘기보다 그분 얘기를 더 들었어요. 물은 03호가 줬고요.','백지: 휴가 이틀 연장했습니다. 새 노선으로 돌아갑니다.\n03호: 승인자 칸도 채웠습니다. 이번에는 물어보고요.']);
  else speak('이어진 노선도',n.ended?[n.policy==='local'?'각 역에 정정 창구가 켜져 있다. 작은 역에는 순회 열차 표시가 붙었다.':'두 개의 확인등이 나란히 켜진다. 한쪽이 꺼진 주소는 대기 목록에 남는다.','열일곱 이름 아래 빈 종이가 더 붙어 있다.\n누군가 새 주소를 연필로 쓰고 있다.']:['열일곱 노선의 이름이 돌아왔다.\n마지막 출발 신호는 연결교 가운데에 있다.']);
 }
 function handle(id){if(chapter()<6||chapter()>8)return false;
  if(chapter()===6){if(id==='ieum')captain();else if(['parcel','manifest','receiver'].includes(id))clue(id);else if(id.startsWith('bag-'))bag(Number(id.slice(-1)));else if(id==='relay')relay();else if(id==='cross')cross();else if(id==='to-bridge')move(12,240,244);else if(id==='back-train')move(11,240,244);else return false;}
  else if(chapter()===7){if(id==='dam')citizen();else if(id==='clerk')clerk();else if(['return-log','witness'].includes(id))evidence(id);else if(id==='appeal')appeal();else if(id==='dispatch')dispatch();else if(id==='to-records')move(14,240,247);else if(id==='back-city')move(13,240,246);else if(id==='city-board')speak('유리도시 안내판',[p().seven.ended?'일곱 해 만에 도착 시각이 떴다.\n누군가 바로 아래에 「엄마 오는 시간」이라고 적었다.':'출발지는 있는데 도착지가 전부 빈칸이다.\n아이의 손그림 지도에는 둘 다 있다.']);else if(id==='city-phone')speak('공중전화',[p().seven.proven?'엄마, 지금 이 도시 주소 다시 쓸 수 있대.\n담은 수화기를 내려놓지 않고 답을 기다렸다.':'“연결할 수 없는 주소입니다.”\n주소를 잘못 불렀다는 말은 없었다.']);else if(id==='city-cat')speak('후추',[p().six.choice==='public'?'“증거가 맞았다고 이름 공개도 괜찮았던 건 아니야.\n우리가 얘기 들을 차례도 있어.”':'“가렸다고 끝은 아니네.\n이제 말해준 사람 얘기가 제대로 전해지는지도 봐야지.”']);else return false;}
  else {if(id==='director')director();else if(id==='archive')recording();else if(id==='live-wire')liveWire();else if(id==='routing')routing();else if(id==='last-signal')finale();else if(id==='to-dawn')move(16,240,247);else if(id==='back-central')move(15,240,248);else if(['dawn-ieum','dawn-cat','home-letter','network-map'].includes(id))epilogue(id);else return false;}
  return true;
 }
 function task(){let t;const n=part(),c=chapter();
  if(n.ended)return {step:c===8?'2부 완료':'다음 이야기',title:c===6?'반송된 도시로':c===7?'중앙 우편국으로':'두 번째 여정 · 남은 편지',detail:c===8?'연결교의 이음, 후추, 편지와 노선도를 둘러보세요. 여정 돌아보기에는 여덟 편의 선택이 남아요.':'진행 안내의 다음 이야기 버튼으로 이어가세요. 떠나기 전 직접 저장으로 이곳을 남길 수 있어요.'};
  if(c===6){if(!n.met)t={room:11,id:'ieum',title:'빈 열차의 기관사',detail:'왼쪽 기관사에게 지도에서 빠진 역들을 물어보세요.'};else if(n.clues.length<3)t={room:11,id:['parcel','manifest','receiver'].find(id=>!n.clues.includes(id)),title:`서로 다른 요청 · ${n.clues.length} / 3`,detail:'소포, 발송 장부, 오른쪽 아래 03호 수신표를 조사하세요.'};else if(!n.aligned)t={room:12,id:n.route.some(v=>v===null)?`bag-${n.route.indexOf(null)}`:'relay',title:'거절한 사람은 누구인가',detail:'세 우편낭의 실제 요청에 맞는 처리를 고르고, 왼쪽 아래 송신기에서 확인하세요. 메모에 단서가 남아요.'};else t={room:12,id:'cross',title:'도시행 첫 정차',detail:'오른쪽 아래 출발 신호를 조사하세요.'};}
  else if(c===7){if(!n.met)t={room:13,id:'dam',title:'지도는 틀리지 않았다',detail:'광장 왼쪽의 아이에게 말을 걸어보세요.'};else if(!n.director)t={room:14,id:'clerk',title:'노선을 닫은 사람',detail:'기록청 왼쪽의 서린에게 설명을 요구하세요.'};else if(n.evidence.length<2)t={room:14,id:n.evidence.includes('return-log')?'witness':'return-log',title:`반송의 근거 · ${n.evidence.length} / 2`,detail:p().six.choice==='public'?'가운데 결재철과 오른쪽 운행 명령 사본을 대조하세요.':'가운데 결재철과 오른쪽 배달원의 증언을 대조하세요.'};else if(!n.proven)t={room:14,id:'appeal',title:'같은 신청, 다른 처리',detail:'왼쪽 아래 이의 신청 단말에서 모순을 지적하세요.'};else t={room:14,id:'dispatch',title:'도시의 응답을 모으는 방법',detail:'오른쪽 아래 연결편에서 다음 행동을 정하세요.'};}
  else {if(!n.met)t={room:15,id:'director',title:'남아 있던 40초',detail:'왼쪽의 이음과 서린에게 말을 걸어보세요.'};else if(!n.heard)t={room:15,id:'archive',title:'잘리지 않은 목소리',detail:'가운데 음성 원본을 이음과 함께 들어보세요.'};else if(!n.live)t={room:15,id:'live-wire',title:n.challenge?'지금 보낸 질문에 답한 채널':'과거의 녹음, 현재의 응답',detail:'오른쪽 수신기를 조사하세요. 확인 부호는 메모에도 남습니다.'};else if(!n.policy)t={room:15,id:'routing',title:'열일곱 노선의 새 약속',detail:'왼쪽 아래 제어대에서 앞으로 누가 주소를 확인할지 정하세요.'};else t={room:16,id:'last-signal',title:'새벽의 마지막 출발 신호',detail:'연결교 가운데 신호를 조사하세요. 실제 시간 제한은 없어요.'};}
  t.step=`0${c} / 08`;
  if(state().room!==t.room){t.id={11:'to-bridge',12:'back-train',13:'to-records',14:'back-city',15:'to-dawn',16:'back-central'}[state().room];t.detail=state().room===15?'오른쪽 아래 문에서 연결교로 나가세요.':'아래 중앙 출구에서 옆 공간으로 이동하세요.';}
  return t;
 }
 function journal(){const n=part(),notes=[`${chapter()}번째 이야기 — ${titles[chapter()]}`];
  if(chapter()===6){if(n.met)notes.push('지도에서 빠진 주소의 편지가 전부 거절로 반송됐다. 이음의 동생 결은 동쪽 노선 배달원이었다.');if(n.clues.includes('parcel'))notes.push('파랑: 목요일까지 맡아달라 → 제자리 보관. 빨강: 직접 서명한 반송 요청 → 발신자에게 반송.');if(n.clues.includes('manifest'))notes.push('하양: 주소가 사라졌지만 수취 거절 서명은 없다 → 주소 조사.');if(n.clues.includes('receiver'))notes.push('보류·거절·주소 실종을 구별한 뒤 철교 왼쪽 아래 송신기에서 확인.');notes.push('현재 분류: '+n.route.map((v,i)=>`${i+1} ${sortNames[v]||'미정'}`).join(' / '));if(n.choice)notes.push(n.choice==='public'?'실명 원본 공개. 중앙국 운행 번호가 드러났고, 발신인들의 이름도 노출됐다.':'이름을 가린 사본 공개. 원본은 내가 보관하고, 도시 배달원이 증언하겠다고 연락했다.');}
  if(chapter()===7){if(n.met)notes.push('담의 어머니 주소는 실제로 있다. 열차와 편지만 갈 수 없었다.');if(n.director)notes.push('서린이 일곱 해 전 노선을 닫았다. 답이 없는 노선의 편지도 차단하는 규정이 서로를 반복시켰다.');if(n.evidence.length)notes.push('결재철과 두 번째 기록을 대조하자. 주민의 보류 요청이 중앙에서 수취 거절로 바뀌었다.');if(n.proven)notes.push('이의 신청이 받아들여졌다. 오른쪽 아래 연결편에서 도시의 실제 응답을 모으자.');}
  if(chapter()===8){if(n.heard)notes.push('결의 원본: 무너진 다리로 돌아오지 말고 북쪽 우회선으로 오라는 말이었다. 현재 위치는 따로 확인해야 한다.');if(n.challenge)notes.push('지금 처음 보낸 확인 부호: 등대 28. 등대 03은 옛 녹음. 응답 없음은 거절이 아니다.');if(n.live)notes.push('남쪽 우편소에서 결의 현재 응답을 받았다. 담의 어머니도 직접 답장을 보냈다.');if(n.policy)notes.push(n.policy==='local'?'각 역이 주소를 확인한다. 작은 역에는 순회 지원이 필요하다.':'중앙과 역이 함께 확인한다. 대기와 지연을 공개한다.');if(n.ended)notes.push('두 번째 여정 완료. 연결교의 후일담과 우리 역에서 온 편지를 읽을 수 있다.');}
  return notes;
 }
 function worker(x,y,color='#b48a72'){rect(x-8,y-2,17,5,'#16273777');rect(x-5,y-18,11,18,color);rect(x-5,y-29,11,11,'#d8baa1');rect(x-7,y-32,15,7,'#3d4656');rect(x-5,y,4,6,'#293b4c');rect(x+2,y,4,6,'#293b4c');rect(x+2,y-24,1,2,'#283647');}
 function cat(x,y,time){rect(x-9,y-9,19,10,'#c6d0bc');rect(x+3,y-15,10,11,'#d9dec5');rect(x+3,y-18,3,6,'#d9dec5');rect(x+10,y-18,3,6,'#d9dec5');rect(x+10,y-11,1,2,'#284354');rect(x-14,y-8+Math.sin(time*2),7,3,'#b5c8b8');}
 function base(room,time){const palettes={11:['#253849','#5a6367'],12:['#142b42','#52606a'],13:['#35495e','#737875'],14:['#2d344b','#645963'],15:['#23394d','#596d73'],16:['#7896a7','#89958b']},[wall,floor]=palettes[room];rect(0,0,480,288,wall);rect(20,minY[room]-12,440,294-minY[room],floor);for(let y=minY[room]+10;y<278;y+=24)rect(20,y,440,1,'#c2c3ad25');text(roomNames[room],240,56,'#ece6c6',8,'center');for(let i=0;i<16;i++)rect((i*67+time*7)%480,66+(i*23)%65,1,1,'#d2d9c15a');}
 function exitLabel(label){rect(209,272,63,5,'#c5c4a2');text(label,240,266,'#e8e7ce',6,'center');}
 function draw(room,time){base(room,time);
  // Layered skyline and masonry establish scale without changing walkable paths.
  if([12,13,16].includes(room)){
   for(let i=0;i<23;i++){const x=i*22-9,h=12+(i*17)%39;rect(x,146-h,19,h,room===16?'#607f8b':'#21364b');for(let j=0;j<3;j++)if((i+j)%3===0)rect(x+4+j*4,151-h,2,3,room===16?'#d4c79b':'#c5b08055');}
  }
  if(room===11||room===14){rect(22,61,436,4,'#b2a38a');rect(22,141,436,5,'#827b70');for(const x of [47,292,420]){rect(x,61,21,3,'#e6d2a4');glow(x+10,89,48,'#edd2a01a');}}

  if(room===11){for(const x of [39,179,319]){rect(x,73,122,61,'#12293c');for(let i=0;i<5;i++){const xx=x+((i*29-time*17)%115+115)%115;rect(xx,99+(i%3)*6,6,15,'#9dac9855');}rect(x,132,122,4,'#a3977b');rect(x+3,76,116,2,'#91a0a15a');rect(x+59,76,3,56,'#566977');}for(const x of [35,167,303,439]){rect(x,75,3,63,'#929786');rect(x-8,135,19,5,'#626f74');}for(let i=0;i<9;i++){rect(46+i*46,62,23,8,i%2?'#947e69':'#718984');rect(54+i*46,64,7,4,'#cfbd98');}rect(53,196,38,6,'#7c6755');rect(55,202,3,8,'#263a49');rect(85,202,3,8,'#263a49');worker(96,181,'#ae8166');rect(208,155,43,27,'#ad9776');rect(225,155,7,27,'#d8c9a4');rect(362,155,43,28,'#7a6e65');rect(369,155,29,20,'#e1d1ac');rect(316,222,28,14,'#8cbbaf');text('03',330,233,'#254252',6,'center');exitLabel('↓ 철교 점검대');}
  else if(room===12){for(let i=0;i<20;i++)rect((i*83-time*24+9000)%480,107+(i*17)%59,19,1,'#83a8b435');for(const x of [36,147,291,438]){rect(x,66,5,112,'#748890');rect(x-13,87,31,4,'#a0a89a');}rect(0,170,480,5,'#aab4a1');for(let i=0;i<18;i++){rect(25+i*25,171,3,107,'#263b472a');rect(25+i*25,173,3,3,'#d9ccb1');}for(let i=0;i<3;i++){const x=96+i*142;rect(x-18,185,36,23,['#6c9eb1','#b57573','#d5ceb5'][i]);rect(x-12,179,24,8,'#a7a186');text(sortNames[p().six.route[i]]||'처리 미정',x,226,'#e9dfc2',6,'center');}rect(78,242,26,13,'#789c97');rect(367,237,25,17,p().six.aligned?'#b6d69d':'#8e5b62');text('송신',91,239,'#dee5c8',6,'center');text('출발',380,235,'#dee5c8',6,'center');if(p().six.aligned)glow(380,232,46,'#b9d89930');exitLabel('↓ 우편열차');}
  else if(room===13){for(let i=0;i<7;i++){const x=26+i*64;rect(x,78+(i%2)*14,52,77,'#65737c');rect(x-2,77+(i%2)*14,56,4,'#919d98');rect(x+40,83+(i%2)*14,3,67,'#425b68');rect(x+8,140,20,14,'#30495b');rect(x+5,132,26,7,i%2?'#ae8b78':'#7b9a94');for(let j=0;j<6;j++)rect(x+8+(j%3)*14,89+Math.floor(j/3)*22+(i%2)*14,8,12,p().seven.ended?'#e4d09c':'#9cb2b02f');}for(let i=0;i<11;i++)rect(32+i*41,217+(i%3)*12,22,1,'#b0c2b239');for(const x of [43,438]){rect(x,132,3,53,'#405b66');rect(x-5,126,13,7,'#b1bba3');glow(x+1,136,37,'#e2cda21b');}rect(205,141,60,30,'#1b3447');rect(202,139,66,3,'#a99d86');rect(213,171,4,10,'#455d64');rect(253,171,4,10,'#455d64');text(p().seven.ended?'도착 예정':'도착 —',235,159,'#e2d399',6,'center');worker(101,204,'#caa77a');rect(89,202,30,12,'#e1d8b8');rect(366,163,30,40,'#897e85');rect(372,169,18,23,'#21394c');cat(308,246,time);text('기록청 ↓',240,239,'#e6e2c6',7,'center');exitLabel('↓ 반송 기록청');}
  else if(room===14){for(let x=37;x<456;x+=59){rect(x,73,41,66,'#766779');for(let y=80;y<134;y+=13){rect(x+4,y,33,8,'#b3a28a');rect(x+19,y+2,8,3,'#e3d4b0');}}rect(198,99,78,28,'#313c4f');text('반송 · 보류 · 수신',237,117,'#e0d2b2',6,'center');for(let i=0;i<7;i++){rect(57+i*59,85,5,3,'#ded1b2');rect(57+i*59,111,5,3,'#ded1b2');}worker(91,179,'#7f95a4');rect(214,154,44,25,'#b29d85');rect(219,154,34,13,'#e1cfab');if(p().six.choice==='private')worker(384,179,'#a59b74');else{rect(365,154,37,27,'#d6cfb4');rect(371,160,25,2,'#987575');rect(371,168,25,2,'#987575');}rect(80,233,28,14,'#779694');rect(371,231,25,17,p().seven.proven?'#b6ccaa':'#98636a');exitLabel('↓ 유리도시 광장');}
  else if(room===15){rect(23,63,434,81,'#182f44');for(const x of [32,107,182,287,362,437]){rect(x,64,8,85,'#71858a');rect(x-4,64,16,5,'#b3b6a0');rect(x-4,144,16,5,'#b3b6a0');}rect(192,69,86,22,'#3b5361');text('중앙 집하 · 17개 노선',235,83,'#e0d6b3',6,'center');for(let i=0;i<17;i++){const x=24+i*27;rect(x,72,2,69,'#c4b59b35');const y=74+(time*15+i*19)%59;rect(x-3,y,9,6,'#dfd5b78a');}rect(32,136,416,5,'#9bada7');for(let i=0;i<32;i++)rect(33+i*13,141,9,3,'#354951');glow(239,115,92,'#e0d9b417');worker(87,184,'#7f95a4');worker(113,186,'#ae8166');rect(212,154,48,28,'#c1b190');rect(221,159,30,13,'#293e4d');rect(227,164,5,5,'#9ac4b5');rect(243,164,5,5,'#9ac4b5');rect(366,158,34,24,'#68958c');rect(375,164,16,10,p().eight.live?'#e4d39b':'#233b50');rect(79,231,30,17,'#7c9c99');text(p().eight.policy?'운행 준비':'운행 제어',94,226,'#e9ddbd',6,'center');rect(371,231,26,19,'#b1bca2');text('연결교 →',383,226,'#e9ddbd',6,'center');}
  else {rect(0,65,480,48,'#d3b6a0');rect(383,81,19,19,'#f3d9a7');glow(392,91,75,'#f5dba633');for(let i=0;i<9;i++){const x=9+i*59;rect(x,133-i%3*5,38,39,'#6c8990');rect(x+5,139-i%3*5,4,5,'#c0c6a7');rect(x+21,139-i%3*5,4,5,'#c0c6a7');}for(let i=0;i<17;i++){const x=16+i*28;rect(x,116,3,58,p().eight.ended?'#c4dcbe':'#5a7b86');rect(x-3,117,9,4,p().eight.ended?'#f3d79c':'#7c9395');}rect(0,174,480,4,'#c4c2a4');rect(0,119,480,1,'#c6d0b684');if(p().eight.ended){for(let i=0;i<4;i++){const x=((time*(9+i*2)+i*127)%510)-30;rect(x,147+i*6,28,5,'#dddac0');rect(x+3,148+i*6,4,2,'#617e88');rect(x+11,148+i*6,4,2,'#617e88');}}rect(216,178,48,25,'#42616a');rect(237,181,6,15,p().eight.ended?'#e6d897':'#b78870');worker(88,216,'#ae8166');if(p().eight.ended)worker(112,219,'#7eaea3');cat(390,219,time);rect(88,252,21,9,'#e8d9b4');rect(370,247,27,18,'#adc3b1');text(p().eight.ended?'17개 노선 연결':'출발 신호',240,221,'#f1e7c9',7,'center');exitLabel('↓ 중앙 우편국');}
 }
 return {start,handle,task,journal,roomEntities,obstacles,minY,roomNames,titles,draw};
};
