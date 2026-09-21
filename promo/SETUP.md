# 통계 연결과 배포 자료

현재 기본 설정은 `analytics-config.js`의 측정 ID가 빈칸입니다. 이 상태에서는 통계 태그를 로드하지 않고, 실제 접속자·완주 데이터도 쌓이지 않습니다. 로컬 숫자를 전체 이용자 수로 표시하지 않습니다.

## Google Analytics 연결

1. https://analytics.google.com/ 에서 본인 Google 계정으로 계정과 GA4 속성을 만듭니다.
2. 웹 데이터 스트림 주소를 `https://kpsayul.github.io/tomorrow-station/`으로 지정합니다.
3. 이 게임은 필요한 이벤트를 직접 보내므로 스트림의 **향상된 측정**은 끕니다. 자동 스크롤·다운로드·폼·사이트 검색 이벤트를 추가하지 않기 위한 설정입니다.
4. 공개 측정 ID `G-...`를 `analytics-config.js`의 `measurementId`에 넣고 배포합니다. 비밀번호나 Measurement Protocol API secret은 필요하지 않으며 저장소에 넣지 않습니다.
5. 로컬 개발과 영상 제작은 집계하지 않습니다. 공개 주소를 새 브라우저에서 열어 게임 시작 후 **실시간** 보고서의 이벤트 수신을 확인합니다. `?preview=1`, 브라우저 추적 거부 또는 게임의 통계 참여 거부 설정은 전송을 끕니다.

공식 안내: https://developers.google.com/analytics/devguides/collection/ga4/events

| 이벤트 | 의미 |
| --- | --- |
| `page_view` | 게임 페이지 열기 (새로고침 포함) |
| `game_start` | 처음부터 플레이 시작 |
| `game_resume` | 이어 하기 또는 저장 불러오기 |
| `chapter_start` | 각 이야기 새로 시작 (`chapter`: 1~8) |
| `chapter_complete` | 마지막 대화까지 읽고 해당 이야기 완료 |
| `share` | 링크 복사·공유 창 완료·결과 이미지 저장 (`method`) |

`entry_source`는 `social`, `community`, `itch`, `player`, `direct`, `referral`, `other` 중 하나입니다. 지정된 캠페인 링크로 들어오면 같은 탭의 재방문에도 유입 분류를 이어갑니다. 인식하지 않는 URL 매개변수와 해시, 저장 파일, 대화와 선택 내용은 이벤트에 넣지 않습니다. 광고 개인화와 Google Signals를 비활성화합니다.

`chapter`(숫자), `entry_source`, `method`를 필요에 따라 GA4 맞춤 측정기준에 등록합니다. 탐색 보고서에서 `page_view → game_start → chapter_complete(chapter=1) → chapter_start(chapter=2)`를 확인합니다. 방문 이벤트 수와 고유 이용자 수는 다르며, 같은 탭 세션의 시작·완료는 중복 집계를 줄입니다. 같은 사람이 여러 기기에서 방문할 수 있으므로 고유 이용자 수도 실제 사람 수와 일치하지 않습니다. 이어 하기는 별도 경로로 해석하세요. `share`는 버튼 동작이며 실제 게시나 친구의 방문을 보장하지 않습니다.

## itch.io 올리기

1. 본인 계정으로 https://itch.io/game/new 에서 새 프로젝트를 만듭니다.
2. **Kind of project: HTML**을 선택하고 `media/tomorrow-station-itch.zip`을 업로드합니다. 외부 링크만 걸어두는 대신 실제 플레이 파일을 제공합니다.
3. 브라우저 실행을 켜고, 임베드 크기는 우선 960×900, 전체 화면 버튼과 모바일 친화 옵션을 사용합니다. PC와 휴대폰에서 직접 플레이해 본 뒤 조정하세요.
4. `media/itch-cover.png`와 세 장의 `scene-*.png`, `POSTS.md`의 설명을 사용합니다. 언어는 Korean으로 표시합니다. 비용은 무료로 설정합니다.
5. 미리보기에서 시작·저장·화면 크기를 확인한 후 Public으로 공개합니다. 별도 itch.io 계정이 필요하며, 준비된 파일만으로 자동 등록되지는 않습니다.

공식 안내: https://itch.io/docs/creators/html5

itch.io용 묶음에는 통계 계정을 넣지 않고, GitHub Pages의 원래 저장과도 분리됩니다. itch.io의 방문 통계는 자체 대시보드에서 확인합니다. 이 게임에서 추가한 GA4 진행 이벤트는 원래 공개 주소에서만 보냅니다.

## 자료 다시 만들기

Playwright와 H.264/AAC 녹화를 지원하는 Microsoft Edge가 있는 환경에서 부모 폴더를 `python -m http.server 8080`으로 서비스한 뒤, 게임 폴더에서 `node promo/build-promo.cjs`를 실행합니다. 대표 이미지 2개, 실제 장면 스크린샷 3개, 원본 게임 음악을 바탕으로 합성한 15초 MP4를 만듭니다. 후속 `python promo/package.py`는 배포에 필요한 파일만 화이트리스트로 모아 두 ZIP을 생성합니다.
