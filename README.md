# K-Worship

예배팀을 위한 통합 관리 플랫폼

**Lovable Project**: https://lovable.dev/projects/2ed7309e-d6b0-4f05-9642-be9265249510

## 네이티브 앱 빌드 가이드 (Android/iOS)

이 프로젝트는 Capacitor를 사용하여 네이티브 앱으로 빌드할 수 있습니다.

### 요구 사항

- **Android**: Android Studio + JDK 17+
- **iOS**: Mac + Xcode 15+ (iOS 빌드는 Mac에서만 가능)

### 빌드 단계

```bash
# 1. GitHub에서 프로젝트 클론
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. 의존성 설치
npm install

# 3. 네이티브 플랫폼 추가
npx cap add android  # Android용
npx cap add ios      # iOS용 (Mac 필요)

# 4. 웹 앱 빌드 및 동기화
npm run build
npx cap sync

# 5. 앱 실행
npx cap run android  # Android 에뮬레이터/디바이스
npx cap run ios      # iOS 시뮬레이터/디바이스
```

### 개발 중 핫 리로드

현재 설정은 Lovable 샌드박스 URL을 사용하여 개발 중 실시간 미리보기가 가능합니다.
프로덕션 빌드 시에는 `capacitor.config.ts`의 `server.url`을 제거하세요.

### 참고 자료

- [Capacitor 공식 문서](https://capacitorjs.com/docs)
- [Lovable 네이티브 앱 가이드](https://docs.lovable.dev/tips-tricks/native-mobile-apps)

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2ed7309e-d6b0-4f05-9642-be9265249510) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/2ed7309e-d6b0-4f05-9642-be9265249510) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
