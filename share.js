'use strict';
window.createGameSharing=function(api){
 const $=id=>document.getElementById(id),link='https://kpsayul.github.io/tomorrow-station/?utm_source=player&utm_medium=share&utm_campaign=first_journey';
 const pitch='이름을 잃어버린 당신이, 다른 사람들의 분실물을 찾아주는 한밤의 역.';
 let message=pitch;
 function drawCard(){
  const canvas=$('share-card'),ctx=canvas.getContext('2d'),s=api.state();
  const fill=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  fill(0,0,1200,630,'#101e2c');ctx.imageSmoothingEnabled=false;ctx.drawImage(api.canvas,540,0,1050,630);
  const shade=ctx.createLinearGradient(0,0,1200,0);shade.addColorStop(0,'#101e2c');shade.addColorStop(.46,'#101e2cf5');shade.addColorStop(1,'#101e2c40');fill(0,0,1200,630,shade);
  ctx.strokeStyle='#92ac8866';ctx.lineWidth=2;ctx.strokeRect(28,28,1144,574);
  const text=(value,x,y,size,color='#edf0e5',weight=500)=>{ctx.fillStyle=color;ctx.font=`${weight} ${size}px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;ctx.fillText(value,x,y);};
  text('NIGHT PLATFORM',64,91,18,'#c5dfb9',700);
  text('내일 분실물',60,193,60,'#f1efdf',700);text('보관소',60,269,60,'#f1efdf',700);
  const lines=s.ended?(s.choice==='carry'?['나는 기다리던 마음과 함께','한 걸음 나아가기로 했다.']:['나는 누군가 돌아올','자리를 남겼다.']):['이름을 잃어버린 당신이,','다른 사람들의 분실물을 찾는 밤.'];
  text(lines[0],64,354,30);text(lines[1],64,400,30);text(s.ended?'너라면 어떤 선택을 할까?':'다섯 이야기 · 열한 공간 · 당신의 선택',64,459,22,'#bdcfc6');
  fill(64,509,270,49,'#c5dfb9');text('무료 · 설치 없이 바로 플레이',79,541,18,'#24352f',700);
  text('kpsayul.github.io/tomorrow-station',64,586,18,'#aabebb');
  message=s.ended?lines.join(' ')+' 너라면 어떤 선택을 할까?':pitch;
  canvas.setAttribute('aria-label',message+' 내일 분실물 보관소');$('share-message').textContent=message;
 }
 function open(){api.keys.clear();drawCard();$('share-link').value=link;$('share-status').textContent='카드를 저장하거나 플레이 링크를 친구에게 보내보세요.';$('native-share').hidden=typeof navigator.share!=='function';$('share-menu').showModal();}
 $('share-game').onclick=$('share-ending').onclick=open;
 $('copy-share-link').onclick=async()=>{
  try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(link);$('share-status').textContent='플레이 링크를 복사했어요.';window.tomorrowMetrics?.track('share',{method:'copy_link'});}
  catch{$('share-link').focus();$('share-link').select();$('share-status').textContent='자동 복사가 안 되어 링크를 선택했어요. 길게 누르거나 Ctrl/Cmd+C로 복사해주세요.';}
 };
 $('native-share').onclick=async()=>{try{await navigator.share({title:'내일 분실물 보관소',text:message,url:link});$('share-status').textContent='공유 창을 열었어요.';window.tomorrowMetrics?.track('share',{method:'native'});}catch(error){if(error.name!=='AbortError')$('share-status').textContent='공유 창을 열지 못했어요. 링크 복사를 이용해주세요.';}};
 $('download-share-card').onclick=()=>{
  const button=$('download-share-card');button.disabled=true;
  try{$('share-card').toBlob(blob=>{button.disabled=false;if(!blob){$('share-status').textContent='이미지를 만들지 못했어요. 링크 복사를 이용해주세요.';return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tomorrow-station-my-story.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('share-status').textContent='결과 카드를 저장했어요. 이미지와 플레이 링크를 함께 보내주세요.';window.tomorrowMetrics?.track('share',{method:'download_card'});},'image/png');}
  catch{button.disabled=false;$('share-status').textContent='이미지 저장을 지원하지 않아요. 링크 복사를 이용해주세요.';}
 };
 $('close-share').onclick=()=>$('share-menu').close();$('share-menu').addEventListener('close',()=>{api.keys.clear();api.canvas.focus({preventScroll:true});});
 return {open};
};
