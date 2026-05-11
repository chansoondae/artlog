# ArtLog

ArtFriends/ArtBus 투어 멤버들이 같은 날, 각자 가장 인상 깊었던 작품을 2초 영상으로 공유하고 분할 화면 브이로그를 자동 완성하는 웹 앱.

## 시작하기

### 1. Firebase 콘솔 세팅

[Firebase 콘솔](https://console.firebase.google.com/)에서 새 프로젝트를 만들고 아래 서비스를 활성화:

1. **Authentication**
   - 좌측 메뉴 → Authentication → Sign-in method
   - **Google** 활성화
   - **익명(Anonymous)** 활성화

2. **Firestore Database**
   - 좌측 메뉴 → Firestore Database → 데이터베이스 만들기
   - 테스트 모드로 시작 (운영 전 Security Rules 배포 필수)
   - 리전: `asia-northeast3` (서울) 권장

3. **Storage**
   - 좌측 메뉴 → Storage → 시작하기
   - 테스트 모드로 시작

4. **Web 앱 등록**
   - 프로젝트 설정 → 앱 추가 → 웹(`</>`)
   - 앱 닉네임 입력 후 등록
   - 표시되는 `firebaseConfig` 값을 복사

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local`에 Firebase 콘솔에서 복사한 값 입력:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. 개발 서버 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 열기. 콘솔에 `Firebase app name: [DEFAULT]`가 찍히면 연결 성공.

## 기술 스택

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** + **shadcn/ui**
- **Firebase** (Auth / Firestore / Storage)
- **ffmpeg.wasm** (클라이언트 영상 트리밍)

## 프로젝트 구조

설계 문서: `ARTLOG_DESIGN.md` 참고
