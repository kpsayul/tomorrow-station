// The app presentation is kept separate from the browser's document layout.
export function installAppUI() {
  const $ = id => document.getElementById(id);
  if (!document.body.classList.contains('native-app') || !$('start')) return;
  const wrap = document.querySelector('.game-wrap');
  const hud = document.createElement('nav');
  hud.className = 'app-hud'; hud.setAttribute('aria-label', '게임 안내와 메뉴');
  hud.innerHTML = `<button id="app-task" aria-label="현재 목표 자세히 보기"><span class="app-task-caption">지금 할 일</span><span id="app-task-label"></span></button><button id="app-menu-open" aria-label="게임 메뉴 열기"><span aria-hidden="true">☰</span> 메뉴</button>`;
  wrap.append(hud);
  const menu = document.createElement('dialog');
  menu.id = 'app-menu'; menu.setAttribute('aria-labelledby', 'app-menu-title');
  menu.innerHTML = `<div class="app-menu-head"><h2 id="app-menu-title">잠깐 쉬어가기</h2><button id="app-menu-close" aria-label="게임 메뉴 닫기">닫기 ×</button></div><div class="app-menu-body"><div id="app-menu-actions"></div><p class="app-control-help">왼쪽 조이스틱을 끌어 이동해요. 바깥쪽까지 밀면 달려요. 출입구는 걸어 들어가면 이동하고, 물건이나 사람은 오른쪽 버튼으로 조사해요.</p></div>`;
  document.body.append(menu);
  const menuBody = menu.querySelector('.app-menu-body'), actions = $('app-menu-actions');
  menuBody.prepend($('guide'));
  for (const id of ['save-button', 'load-button', 'journal-button', 'sound', 'run-toggle', 'share-game', 'review-journey']) actions.append($(id));
  menuBody.append($('save-status'), document.querySelector('.footer-links'));
  for (const id of ['save-button', 'load-button', 'journal-button', 'share-game', 'review-journey', 'next-night']) {
    // Close the pause sheet before the original button handler opens its dialog.
    $(id).addEventListener('click', () => menu.close(), true);
  }
  const controls = document.createElement('div');
  controls.className = 'app-touch-controls';
  controls.innerHTML = `<div class="app-stick-wrap"><button id="app-stick" aria-label="이동 조이스틱. 끌어서 이동, 바깥쪽으로 밀면 달리기"><span class="app-stick-cross" aria-hidden="true">✥</span><span id="app-stick-thumb" aria-hidden="true"></span></button><span id="app-stick-caption" aria-hidden="true">이동 · 밀어서 달리기</span></div>`;
  const action = $('touch-action');
  action.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v11h-8l-5 4v-4H5z"/></svg><span id="app-action-label">대화·조사</span>`;
  controls.append(action); wrap.append(controls);
  $('game').setAttribute('aria-label', '왼쪽 조이스틱으로 이동하고 오른쪽 버튼으로 대화·조사합니다.');
  $('next').innerHTML = '계속 <span aria-hidden="true">→</span>';
  const readingKey = 'tomorrow-station-reading-size';
  const textSize = document.createElement('button'); textSize.id = 'app-text-size';
  document.querySelector('.dialogue-head').append(textSize);
  const setReadingSize = large => {
    document.body.classList.toggle('reading-large', large);
    textSize.textContent = large ? '가 −' : '가 +';
    textSize.setAttribute('aria-pressed', String(large));
    textSize.setAttribute('aria-label', large ? '큰 글씨 끄기' : '큰 글씨 켜기');
    textSize.title = large ? '기본 글씨로 읽기' : '더 큰 글씨로 읽기';
  };
  let largeReading = false;
  try { largeReading = localStorage.getItem(readingKey) === 'large'; } catch { /* Reading still works without storage. */ }
  setReadingSize(largeReading);
  textSize.onclick = () => {
    largeReading = !largeReading; setReadingSize(largeReading);
    try { localStorage.setItem(readingKey, largeReading ? 'large' : 'normal'); } catch { /* Keep the setting for this session. */ }
  };
  document.querySelector('#start .eyebrow').textContent = '내일 분실물 보관소';
  const startActions = document.createElement('div'); startActions.className = 'app-start-actions';
  $('begin').before(startActions); startActions.append($('continue'), $('begin'));

  const stick = $('app-stick'), thumb = $('app-stick-thumb');
  let pointer = null;
  const emit = (x = 0, y = 0, run = false, pace = 0) => window.dispatchEvent(new CustomEvent('tomorrow-move', { detail: { x, y, run, pace } }));
  const reset = () => {
    const captured = pointer; pointer = null;
    if (captured !== null && stick.hasPointerCapture(captured)) stick.releasePointerCapture(captured);
    thumb.style.transform = ''; stick.classList.remove('held', 'running');
    $('app-stick-caption').textContent = '이동 · 밀어서 달리기'; emit();
  };
  const drag = event => {
    if (pointer !== event.pointerId) return;
    const box = stick.getBoundingClientRect(), radius = (box.width - 52) / 2;
    const x = (event.clientX - box.x - box.width / 2) / radius, y = (event.clientY - box.y - box.height / 2) / radius;
    const magnitude = Math.hypot(x, y), scale = Math.max(1, magnitude);
    thumb.style.transform = `translate(${x / scale * radius}px, ${y / scale * radius}px)`;
    const strength = Math.max(0, Math.min(1, (magnitude - .18) / .82));
    // Blend walking into running instead of doubling speed at one threshold.
    const blend = Math.max(0, Math.min(1, (magnitude - .65) / .35));
    const pace = blend * blend * (3 - 2 * blend);
    const run = magnitude > .85;
    emit(magnitude ? x / magnitude * strength : 0, magnitude ? y / magnitude * strength : 0, run, pace);
    stick.classList.toggle('running', run); $('app-stick-caption').textContent = run ? '달리는 중' : '이동 중';
  };
  stick.addEventListener('pointerdown', event => {
    if (pointer !== null || !document.body.classList.contains('native-playing') || document.querySelector('dialog[open]')) return;
    event.preventDefault(); pointer = event.pointerId; stick.setPointerCapture(pointer); stick.classList.add('held'); drag(event);
  });
  stick.addEventListener('pointermove', drag);
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) stick.addEventListener(name, event => { if (event.pointerId === pointer) reset(); });
  window.addEventListener('blur', reset);
  window.addEventListener('tomorrow-room-change', reset);
  window.addEventListener('resize', reset);
  window.addEventListener('tomorrow-app-state', event => { if (!event.detail.isActive) reset(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  const openMenu = () => { reset(); menu.showModal(); };
  $('app-menu-open').onclick = $('app-task').onclick = openMenu;
  $('app-menu-close').onclick = () => menu.close();
  const stateChanged = () => {
    const title = !$('start').hidden || !$('ending').hidden;
    const reading = !$('dialogue').hidden, paused = !!document.querySelector('dialog[open]');
    document.body.classList.toggle('native-title', title);
    document.body.classList.toggle('native-playing', !title && !reading);
    document.body.classList.toggle('native-reading', reading);
    document.body.classList.toggle('native-paused', paused);
    document.body.classList.toggle('native-has-save', !$('continue').hidden);
    if (title || reading || paused) reset();
  };
  const stateObserver = new MutationObserver(stateChanged);
  for (const id of ['start', 'ending', 'dialogue', 'continue']) stateObserver.observe($(id), { attributes: true, attributeFilter: ['hidden'] });
  for (const dialog of document.querySelectorAll('dialog')) stateObserver.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  const taskChanged = () => {
    const title = $('guide-title').textContent || '역무원에게 말을 걸어보세요';
    if ($('app-task-label').textContent !== title) $('app-task-label').textContent = title;
    const detail = $('guide-detail'), text = detail.textContent.replace(/E\s*(?:\/|또는)\s*Enter/g, '오른쪽 대화 버튼');
    if (detail.textContent !== text) detail.textContent = text;
  };
  new MutationObserver(taskChanged).observe($('guide'), { childList: true, subtree: true });
  const targetChanged = () => {
    const ready = !$('interaction').hidden, label = ready ? $('interaction-label').textContent : '대화·조사';
    if (action.disabled === ready) action.disabled = !ready;
    if ($('app-action-label').textContent !== label) $('app-action-label').textContent = label;
    const accessible = ready ? `${label} 대화 또는 조사` : '대화·조사: 대상 가까이로 이동하세요';
    if (action.getAttribute('aria-label') !== accessible) action.setAttribute('aria-label', accessible);
  };
  new MutationObserver(targetChanged).observe($('interaction'), { attributes: true, attributeFilter: ['hidden'], childList: true, subtree: true });
  stateChanged(); taskChanged(); targetChanged();
}
