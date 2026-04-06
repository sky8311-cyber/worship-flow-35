

# /support 퍼블릭 고객지원 페이지 생성

## 개요

`/support` URL에 접근 가능한 퍼블릭 고객지원 페이지를 새로 만든다. 비로그인 사용자도 접근 가능하며, 기존 Features/Press 페이지와 동일한 레이아웃 패턴(LandingNav + LandingFooter / AppLayout)을 따른다.

## 페이지 내용

1. **이메일 연락처**: `hello@kworship.app` (기존 footer에서 사용 중인 주소)
2. **로그인 후 채팅 상담 안내**: 로그인하면 앱 내 실시간 고객상담 채팅을 이용할 수 있다는 안내
3. **운영 시간 / 응답 안내** (선택): 간단한 안내 문구

## 변경 파일

| 파일 | 변경 |
|---|---|
| `src/pages/Support.tsx` | **새 파일** — 퍼블릭 고객지원 페이지 |
| `src/App.tsx` | `/support` 라우트 추가 (퍼블릭, Legal/Features 옆) |
| `src/components/landing/LandingFooter.tsx` | supportLinks에 `/support` 링크 추가 |

## 구현 상세

### Support.tsx

- Features.tsx 패턴 차용: 비로그인 → LandingNav + LandingFooter 래핑, 로그인 → AppLayout 래핑
- 한/영 분기 (`language === "ko"`)
- 섹션:
  - **헤더**: "고객 지원" / "Customer Support"
  - **이메일 카드**: Mail 아이콘 + `hello@kworship.app` mailto 링크
  - **채팅 상담 카드**: MessageCircle 아이콘 + "로그인 후 앱 내 채팅으로 실시간 상담이 가능합니다" + 로그인/대시보드 버튼
  - **FAQ 링크** (선택): 기존 `/help` 페이지로 안내

### App.tsx

- L231 `<Route path="/legal">` 근처에 추가:
  ```
  <Route path="/support" element={<Support />} />
  ```

### LandingFooter.tsx

- L27-29 supportLinks 배열에 `/support` 페이지 링크 추가

