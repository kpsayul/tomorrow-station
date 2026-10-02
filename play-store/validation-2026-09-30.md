# Google Play 준비 파일 검증 — 2026-09-30

## 결과

`tomorrow-station-1.8.1.aab`와 같은 소스의 출시 APK를 빌드하고 로컬 검증을 마쳤다. Play Console 업로드나 Google의 심사 통과를 의미하지는 않는다.

- 패키지: `io.github.kpsayul.tomorrowstation`
- 공개 개발자명: `URAwesome`
- 버전: `1.8.1`, versionCode `10`
- 최소 SDK: 24 / 대상 SDK: 36
- AAB: 3,138,547 bytes
- AAB SHA-256: `4a4c4a1e24c44e6e8919d6306252e3598dd538e5aa40269e805640efeda22bef`
- 업로드 인증서 SHA-256: `c5b3783210028870b5e35fa0e4700a52a93fb624f6264ef881e66167d72cd7f7`

## 확인한 항목

- Gradle `bundleRelease assembleRelease` 성공.
- AAB `jarsigner -verify`: `jar verified.` 확인. Android 업로드 키의 자체 서명 인증서 관련 일반 경고는 별도로 확인했다.
- 출시 APK `apksigner verify --print-certs` 성공. 매니페스트의 버전·SDK를 확인했고 디버그 가능 빌드가 아니다.
- AAB의 `base/assets/public` 16개 파일이 현재 모바일 산출물과 바이트 단위로 일치한다.
- AAB에 개인 키나 암호 파일이 없으며, 패키징된 네이티브 `.so` 라이브러리가 없다.
- 권한은 인터넷 및 앱 내부 수신자 보호용 권한이다. 광고 ID, 위치, 연락처, 카메라, 광범위한 저장소 접근 권한은 없다.
- `node mobile/build.test.mjs` 통과: 모바일 오프라인 파일 구성, 웹 분석 코드 및 개발 파일 제외 확인.
- 공개용·앱 내부·최종 모바일 산출물의 개인정보처리방침에 개발자명 `URAwesome`과 `aira.info.0000@gmail.com`이 포함된다. 게임 크레딧에도 `URAwesome`을 반영했다.
- 스토어 짧은 설명 36자 / 전체 설명 685자. 각각 80자 / 4,000자 제한 이내다.
- 아이콘 512×512 RGBA PNG, 그래픽 1024×500 RGB PNG, 휴대전화 스크린샷 4장 1920×1080 RGB PNG를 검사하고 직접 확인했다.
- 스크린샷은 동일 게임 소스의 Android 디버그 앱에서 촬영했다. 상태를 준비해 실제 장면과 대사를 표시했으며, 가짜 게임 화면을 합성하지 않았다. 출시 APK는 같은 게임 파일을 포함한다.
- 서명 스크립트의 PowerShell 구문 검사와 `git diff --check` 통과.

## 출시 APK 실행 확인

개발자명 변경 전 출시 APK를 별도의 임시 Android 13 가상 디바이스에서 설치하고, 콜드 스타트, 시작 버튼 조작, 첫 이야기 화면 표시를 확인했다. 앱은 정상적으로 전면에 실행됐고 AndroidRuntime 로그에 이 앱의 치명적 예외가 없었다.

가상 디바이스는 `-read-only -no-window -no-snapshot`으로 실행했다. 사용자 화면과 기존 가상 디바이스 저장 상태를 사용하지 않았다. 초기 부팅·빌드 중 나타났던 Android System UI 응답 오류는 해소한 뒤 다시 촬영했으며, 최종 스토어 이미지에는 시스템 오류창이나 안내창이 없다.

이후 사용자 지정 개발자명 `URAwesome`을 개인정보처리방침과 크레딧에 반영해 AAB/APK를 다시 만들었다. 재빌드의 서명과 포함 파일을 검증했으며, 표시 문구만 바뀐 이 빌드의 가상 디바이스 실행은 반복하지 않았다. 위 해시와 크기는 재빌드 기준이다.

이번 출시 APK 확인은 시작 구간의 실행 점검이다. 전체 이야기·분기 회귀 검토는 기존 `STORY-REVIEW-2026-09-30.md`에 기록돼 있다. 이번 준비에서는 이야기를 변경하지 않았다.

## 아직 남은 외부 단계

- 개발자 계정 확인 및 콘솔이 요구하는 기기 인증.
- 개인정보처리방침 공개 웹 게시와 주소 접근 확인.
- Play Console에서 AAB 수락, 앱 서명, 콘텐츠 설문·등급, 실제 테스트 설치 확인. 별도 bundletool 검증은 실행하지 않았다.
- 실제 테스터 모집과 비공개 테스트, 프로덕션 액세스 신청·심사.
- 별도 보관 위치로 업로드 키 백업. 키는 현재 PC의 `%LOCALAPPDATA%/TomorrowStation/signing`에 있으며, 개인 키와 암호는 배포 묶음에 포함하지 않는다. 백업 방법은 제출 안내에 있다.
