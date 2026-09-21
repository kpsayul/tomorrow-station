'use strict';
(() => {
 const id=window.TOMORROW_ANALYTICS?.measurementId||'',ledgerKey='tomorrow-metrics-v1';
 const query=new URLSearchParams(location.search),sources=['social','community','itch','player'];
 let enabled=false,ledger={at:Date.now(),sent:[],source:'direct'};
 const validHost=location.hostname==='kpsayul.github.io'&&location.pathname.startsWith('/tomorrow-station/');
 try{const previous=JSON.parse(sessionStorage.getItem(ledgerKey));if(previous&&Date.now()-previous.at<30*60*1000&&Array.isArray(previous.sent))ledger=previous;}catch{}
 const source=query.get('utm_source');if(source)ledger.source=sources.includes(source)?source:'other';
 else if(!sources.includes(ledger.source)&&document.referrer){try{ledger.source=new URL(document.referrer).origin===location.origin?'direct':'referral';}catch{}}
 const optedOut=()=>{try{return localStorage.getItem('tomorrow-analytics-opt-out')==='1';}catch{return false;}};
 function track(name,details={}){
  if(!enabled||optedOut()||!['page_view','game_start','game_resume','chapter_start','chapter_complete','share'].includes(name))return;
  const parameters={entry_source:ledger.source};
  if(Number.isInteger(details.chapter)&&details.chapter>=1&&details.chapter<=8)parameters.chapter=details.chapter;
  if(['copy_link','native','download_card'].includes(details.method))parameters.method=details.method;
  // Count each milestone once per tab session, including across save/reload.
  const key=name+':'+(parameters.chapter||'');
  if(!['page_view','share'].includes(name)&&ledger.sent.includes(key))return;
  try{window.gtag('event',name,parameters);if(!ledger.sent.includes(key))ledger.sent.push(key);ledger.at=Date.now();sessionStorage.setItem(ledgerKey,JSON.stringify(ledger));}catch{}
 }
 window.tomorrowMetrics={track,get enabled(){return enabled&&!optedOut();}};
 if(!/^G-[A-Z0-9]{6,20}$/.test(id)||!validHost||query.has('preview')||navigator.doNotTrack==='1'||optedOut())return;
 enabled=true;window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments);};
 const pageLocation=new URL('https://kpsayul.github.io/tomorrow-station/');
 if(sources.includes(source)){pageLocation.searchParams.set('utm_source',source);pageLocation.searchParams.set('utm_medium',source==='player'?'share':'referral');pageLocation.searchParams.set('utm_campaign','first_journey');}
 let referrer='';try{if(document.referrer)referrer=new URL(document.referrer).origin;}catch{}
 window.gtag('js',new Date());
 window.gtag('config',id,{send_page_view:false,page_location:pageLocation.href,page_referrer:referrer,page_title:'내일 분실물 보관소',allow_google_signals:false,allow_ad_personalization_signals:false});
 const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);document.head.append(script);
 track('page_view');
})();
