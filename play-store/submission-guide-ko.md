# Google Play 제출 순서

## 이번에 준비한 것

- 서명된 `artifacts/play-store/tomorrow-station-1.8.1.aab`가 **Play Console 업로드 파일**이다.
- 같은 폴더의 `*-release.apk`는 출시 빌드를 직접 확인하는 용도다. Play Console에는 AAB를 올린다.
- `listing-ko.md`: 이름, 설명, 공개 문의 주소, 출시 노트, 이미지 대체 텍스트.
- `tester-guide-ko.md`: 테스터 모집 글과 피드백 안내. 아직 전송하거나 모집하지 않았다.
- `app-content-ko.md`: 앱 콘텐츠·데이터 보안 답변의 근거.
- 아이콘, 그래픽 이미지, 실제 Android 스크린샷은 `artifacts/play-store/`에 있다.
- 개인정보처리방침의 공개용 원본은 저장소 루트의 `android-privacy.html`이다. 같은 내용이 앱 내부에도 포함된다.

개발자 계정 본인 인증은 2026-10-02 사용자 확인으로 완료됐다. Google Play 업로드·테스트 배포는 아직 진행하지 않았다. 공개용 개인정보처리방침은 저장소 루트의 `android-privacy.html`이며, GitHub Pages 배포 후 아래 주소에서 실제로 열리는지 확인하고 콘솔에 등록한다.

## 콘솔에서 진행할 순서

1. 계정 본인 인증은 완료됐다. 콘솔에 별도의 실제 Android 기기 인증 작업이 남아 있다면 완료한다.
2. 앱 만들기: `내일 분실물 보관소` / 한국어 / 게임 / 무료. 공개 문의 주소는 `aira.info.0000@gmail.com`.
3. 기본 스토어 등록정보에 `listing-ko.md`와 이미지 파일을 넣는다. 공개 개발자명은 `URAwesome`으로 맞춘다.
4. `android-privacy.html`을 공개 웹에 배포한 뒤 로그인 없이 열리는지 확인한다. 기존 GitHub Pages 경로를 쓰면 주소 후보는 `https://kpsayul.github.io/tomorrow-station/android-privacy.html`이다. 게시 전에는 콘솔에 완료된 주소처럼 제출하지 않는다. 웹 통계용 `privacy.html`과 구별한다.
5. 앱 콘텐츠의 광고·앱 액세스·타겟 연령·등급·데이터 보안 등 표시되는 항목을 채운다. 설문 문구는 콘솔의 최신 질문을 기준으로 한다.
6. 테스트 및 출시 → 테스트 → 내부 테스트에서 새 버전을 만들고 AAB를 올린다. Play 앱 서명은 Google이 앱 서명 키를 생성하도록 설정할 수 있다. 첫 설치와 저장을 소수 인원으로 확인한다. 내부 테스트는 다음 단계의 비공개 테스트 인원/기간을 대체하지 않는다.
7. 비공개 테스트 트랙을 만들고 국가/지역, 테스터 이메일 목록 또는 Google 그룹, 피드백 주소를 정한다. 같은 빌드를 비공개 트랙에 사용할 수 있다. 출시 노트를 넣고 콘솔에서 변경사항 검토·테스트 배포를 진행한다.
8. 콘솔에서 생성된 참여 링크를 등록된 테스터에게 전달한다. 프로덕션 신청 때 최소 12명이 직전 14일 연속 참여 상태여야 한다. 실제 의견과 수정 내용을 기록한다.
9. 조건을 충족하면 대시보드에서 프로덕션 액세스를 신청한다. 승인 후 프로덕션 트랙으로 출시하고 앱 검토를 요청한다. 신청·심사·최종 공개는 서로 다른 단계다.

기존에 직접 설치한 디버그 앱과 Google Play가 배포하는 앱은 서명이 다르므로 그대로 덮어 설치되지 않을 수 있다. **기존 진행이 있다면 먼저 게임의 저장 파일 내보내기를 사용한다.** 설치 충돌로 기존 앱을 지워야 할 때에도 내보낸 파일이 있는지 먼저 확인하고, 새 앱에서 가져온다.

## 서명 키 보관과 다음 빌드

업로드 키는 `%LOCALAPPDATA%/TomorrowStation/signing/upload.jks`에 있다. 저장소와 배포 자료에는 넣지 않았다. 비밀번호는 같은 폴더의 `upload-password.clixml`에 현재 Windows 사용자용 DPAPI 암호화로 보관한다. 이 암호화 파일을 다른 PC로 복사하는 것만으로는 복원할 수 없다.

PC를 바꾸기 전에는 `mobile/export-upload-key.ps1`로 별도 암호의 키 복사본을 개인 백업 위치에 만들어 두고 암호를 보관한다. 비밀번호·개인 키는 채팅, GitHub, 스토어 이미지 폴더에 올리지 않는다. `upload-certificate.pem`은 공개 인증서이므로 개인 키가 아니다.

다음 빌드는 저장소 루트에서 다음 명령으로 만든다. 기존 키를 재사용한다.

```powershell
./mobile/build-play.ps1
```

이미 Play에 올린 버전을 수정해서 다시 올릴 때는 `android/app/build.gradle`의 `versionCode`를 올린다. 스토어 업로드 이력을 확인하지 않고 번호를 재사용하지 않는다.

## 공식 안내

- [앱 만들기](https://support.google.com/googleplay/android-developer/answer/9859152?hl=ko)
- [Play 앱 서명](https://support.google.com/googleplay/android-developer/answer/9842756?hl=ko)
- [테스트 트랙](https://support.google.com/googleplay/android-developer/answer/9845334?hl=ko)
- [새 개인 계정의 테스트 요건](https://support.google.com/googleplay/android-developer/answer/14151465?hl=ko)
- [스토어 이미지 규격](https://support.google.com/googleplay/android-developer/answer/9866151?hl=ko)
