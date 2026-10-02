// Compile the accepted manuscript into offline dialogue. No Markdown is fetched at runtime.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const manuscript = (await readFile(new URL('STORY-HOMECOMING-MANUSCRIPT.md', root), 'utf8')).replace(/\r/g, '');
function between(source, start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw new Error(`Missing manuscript boundary: ${start} / ${end}`);
  return source.slice(a + start.length, b).trim();
}
function replace(source, before, after) {
  if (!source.includes(before)) throw new Error(`Missing branch text: ${before}`);
  return source.replace(before, after);
}
function pages(source, past = false) {
  return source.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => {
    p = p.replace(/^> ?/gm, '').replace(/\n/g, ' ');
    if (past) p = p.replace(/^온:/, '과거의 온:');
    if (/^(당신|온|여울|후추|03호|백지|수진|재문|어린 온|과거의 온|손님|연):/.test(p)) return p.replace(/: “(.*)”$/, ': $1');
    return '이야기: ' + p;
  });
}
const main = manuscript.split('# 이름 회수를 미룬 경로의 교체문')[0];
const sections = [...main.matchAll(/^## (현재|과거|다음 목요일) · (.+)\n([\s\S]*?)(?=^##? |$(?![\s\S]))/gm)];
const section = title => {
  const match = sections.find(s => s[2] === title);
  if (!match) throw new Error('Missing scene: ' + title);
  return match[3].replace(/\n---\s*$/, '').trim();
};
const scenes = {};
function add(id, source, { deferred = source, past = false, letter = false } = {}) {
  const convert = value => letter ? pages(value).map(p => p.startsWith('이야기: >') ? p.replace('이야기: >', '당신의 답장:') : p) : pages(value, past);
  scenes[id] = { name: convert(source), letter: convert(deferred) };
}
add('one', between(main, '---\n\n', '\n기존의 2장 도입'));
add('two-reveal', '온은 편지 뒷면을 보았다.\n\n' + between(main, '온은 편지 뒷면을 보았다.', '\n선택:'));
add('two-name', between(main, '### 이름을 돌려받은 경우\n', '\n### 지금은'));
add('two-letter', between(main, '### 지금은 편지만 가져가는 경우\n', '\n### 공통'));
add('five-arrival', section('바닷가 역과 귀환 열차'));
add('five-guest', section('창문 옆의 손님'));
const box = section('보관 상자');
const boxStart = box.indexOf('후추는 상자 안을 들여다보지 않았다.');
const boxText = box.slice(0, boxStart).trim();
const boxDeferred = replace(boxText, '엄마가 쓰던 것이었다.\n\n그 위에 아버지의 글씨로 이름이 적혀 있었다. 뚜껑과 통이 섞이지 않게 붙인 테이프였다. 끝부분이 조금 들떠 있었다.', '온은 뚜껑에 붙은 테이프를 읽었다.\n\n온: “수진이 누구야?”\n\n후추: “너희 엄마.”\n\n도시락통을 들고 한동안 서 있었다. 언제 쓰던 것인지 바로 떠오르지는 않았다.');
add('five-box', boxText, { deferred: boxDeferred });
const toy = box.slice(boxStart);
let toyDeferred = replace(toy, between(toy, '온: “어릴 때 이게 싫었는데.”', '\n\n열차를 뒤집었다.'), '\n\n후추: “아까 봤잖아. 고쳐 준 거.”\n\n온은 책상 위로 열차를 밀었다. 한쪽으로 조금씩 기울다가 후추의 앞발에 닿았다.\n\n후추: “나한테 오네.”\n\n온: “잡아 줘. 떨어지겠다.”');
toyDeferred = replace(toyDeferred, '온: “어릴 때 이게 싫었는데.”', '온: “이것만 색이 다르네.”');
toyDeferred = replace(toyDeferred, '온: “엄마 거였어?”', '온: “여기에도 엄마 이름이 있네.”');
toyDeferred = replace(toyDeferred, '후추: “너희 아빠는 뭘 그렇게 뜯어?”\n\n온이 웃었다.\n\n온: “움직이는 거.”', '후추: “분해하지 말라는데 고쳤네.”\n\n온: “엄마한테 혼났겠다.”');
toyDeferred = replace(toyDeferred, '엄마였다.\n\n병실 밖에서 웃고 있었다.', '온: “저 사람이 엄마야?”\n\n후추: “응.”\n\n온은 열차 밑에서 읽은 이름을 다시 보았다.\n\n온: “엄마.”\n\n여자는 여전히 남자를 놀리고 있었다.');
add('five-toy', toy, { deferred: toyDeferred });
const festival = section('온이 태어나기 전, 동네 축제');
const festivalCut = festival.indexOf('두 사람은 역 앞 벤치에 앉았다.');
add('six-festival', festival.slice(0, festivalCut));
add('six-photos', festival.slice(festivalCut));
const house = section('어린 온의 집, 비 오는 날 전날 밤');
let houseDeferred = replace(house, '그 방이 싫었던 날들을 기억했다. 친구가 놀러 오겠다고 하면 다른 데서 놀자고 했었다. 겨울에 이불 밖으로 손을 빼기 싫었던 것도 기억했다.', '온은 방의 좁은 틈과 창틀에 붙인 테이프를 보았다. 어린 자신이 누운 곳 가까이 몸을 낮췄다.\n\n온: “여기서 살았구나.”\n\n후추는 그 옆에 앉았다.');
houseDeferred = replace(houseDeferred, '싫었던 방 안에 이런 밤도 있었다.', '수진이 글씨를 적던 자리를 엄지손가락으로 문질렀다.');
add('six-house', house, { deferred: houseDeferred });
add('six-rain', section('다음 날, 도림역'));
const phone = section('짧은 전화');
const phoneDeferred = replace(phone, '온: “응. 아빠 지금 통화 돼?”', '온: “아빠. 이름은 아직 맡겨 뒀어.”\n\n전화 너머가 잠깐 조용해졌다.\n\n재문: “응.”\n\n온: “기차를 봤는데, 물어보고 싶은 게 생겼어. 지금 통화 돼?”');
add('six-phone', phone, { deferred: phoneDeferred });
const unpack = section('상자 앞');
add('seven-box', unpack, { deferred: replace(unpack, '온: “이 달엔 휴가가 이틀 남았었어.”', '온은 남은 휴가 칸에 적힌 ‘2’를 읽었다.\n\n온: “이렇게 나눠서 왔었구나.”') });
const waiting = section('보호자 대기실');
const waitingEnd = waiting.indexOf('기억 속의 온이 시간을 확인하는 동안');
add('seven-care', waiting.slice(0, waitingEnd), { past: true });
add('seven-friends', waiting.slice(waitingEnd), { deferred: '달력 사이에서 사진 한 장이 나왔다. 친구들 사이의 온이 웃고 있었다.\n\n온은 사진의 날짜를 보았다. 기억 속에서 아버지에게 쉬겠다고 말한 토요일이었다.' });
const hospital = section('병실의 저녁');
const hospitalCut = hospital.indexOf('이 장면 뒤에 다른 저녁이 이어졌다.');
add('seven-tv', hospital.slice(0, hospitalCut), { past: true });
add('seven-tired', hospital.slice(hospitalCut), { past: true });
add('seven-empty', section('병원을 나오는 날'), { past: true });
add('seven-deposit', section('이름을 맡기기 전의 밤'), { past: true });
const present = section('이름을 쓰는 자리');
const presentCut = present.indexOf('휴대전화에 아버지의 답장이 와 있었다.');
add('seven-present', present.slice(0, presentCut));
const call = present.slice(presentCut);
add('seven-call', call, { deferred: replace(call, '온은 이름표를 옷깃 안쪽에 고쳐 달았다. 차가운 가장자리가 손끝에 닿았다.', '온은 접수표를 꺼냈다. 이름을 돌려주지 말라는 문장이 남아 있었다.\n\n온: “그때는 이게 필요했겠지.”\n\n후추가 온을 올려다봤다.\n\n온: “이제는 아빠 목소리를 아는 채로 가고 싶어.”') });
add('eight-name', between(manuscript, '온: “백지 씨. 이름을 돌려받고 싶어요.”', '\n이후 연에게').replace(/^/, '온: “백지 씨. 이름을 돌려받고 싶어요.”\n\n'));
add('eight-leave', section('우리 역을 떠나며'));
add('eight-bread', section('도림역'));
add('eight-bench', section('벤치'));
add('eight-train', section('열차를 주고받다'));
add('eight-dinner', section('집'));
add('eight-photos', section('사진 봉투'));
// The letter retains its own speaker instead of becoming the narrator's words.
const reply = section('답장').replace(/^>\s*$/gm, '').split(/\n\s*\n/).map(p => p.startsWith('>') ? p.replace(/^> ?/gm, '').replace(/^/, '당신의 답장: ') : p).join('\n\n');
add('eight-letter', reply);
for (const route of ['name', 'letter']) scenes['eight-letter'][route] = scenes['eight-letter'][route].map(p => p.replace('이야기: 당신의 답장:', '당신의 답장:'));
add('eight-after', section('짧은 후일담'));
await writeFile(new URL('homecoming-text.js', root), "'use strict';\n// Generated by story/build-homecoming.mjs from the accepted manuscript.\nwindow.homecomingText = " + JSON.stringify(scenes, null, 2) + ';\n');
console.log(`Compiled ${Object.keys(scenes).length} homecoming scenes from ${fileURLToPath(new URL('STORY-HOMECOMING-MANUSCRIPT.md', root))}`);
