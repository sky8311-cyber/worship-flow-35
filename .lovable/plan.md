

# 히어로 섹션에 접속 버튼 3개 추가

## 목표
"스크롤하여 더 보기" 아래에 3개의 접속 버튼을 추가하여 방문자 이탈을 방지합니다.

## 버튼 구성

| 버튼 | 아이콘 | 뱃지 | 동작 |
|------|--------|------|------|
| Apple iOS App | Apple 아이콘 | Coming Soon | 비활성 (toast 안내) |
| Android App | Play Store 아이콘 | Coming Soon | 비활성 (toast 안내) |
| Web App | Globe 아이콘 | 없음 | `/login` 페이지로 이동 |

## 디자인
- 스크롤 인디케이터 바로 아래에 배치
- 3개 버튼 가로 배열 (모바일: 세로 스택)
- iOS/Android 버튼은 `outline` variant + `opacity-70` + "Coming Soon" 뱃지 (작은 텍스트)
- Web App 버튼은 `default` variant (primary 색상)으로 강조
- framer-motion stagger 애니메이션 적용

## 기술 변경

### 파일: `src/pages/MobileAppLanding.tsx`

스크롤 인디케이터(`</motion.div>` 라인 130) 아래에 버튼 그룹 추가:

```text
[스크롤 인디케이터]

[Apple iOS App]  [Android App]  [Web App 시작하기]
 Coming Soon      Coming Soon
```

- lucide-react 아이콘 사용: `Smartphone`, `Globe` + 커스텀 Apple/Play 아이콘 (SVG inline)
- Web App 버튼 클릭 시 `navigate("/login")`
- iOS/Android 클릭 시 `toast` ("준비 중입니다")
- 한/영 라벨 지원

## 변경 범위
- 파일 1개 수정 (`MobileAppLanding.tsx`)
- 기존 기능에 영향 없음

