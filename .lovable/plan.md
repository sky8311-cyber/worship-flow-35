

# "피아워십" 키워드 추가 계획

## 현재 상태
이미 포함된 곳: `index.html`, `Landing.tsx`, `public/llms.txt` — 변경 불필요

## 추가할 파일 (5개)

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/MobileAppLanding.tsx` | `keywordsKo`에 `피아워십, 마커스워십, 어노인팅` 추가 |
| `src/pages/Features.tsx` | `keywordsKo`에 `피아워십, 마커스워십, 어노인팅` 추가 |
| `src/pages/Help.tsx` | `keywordsKo`에 `피아워십` 추가 |
| `src/pages/News.tsx` | `keywordsKo`에 `피아워십` 추가 |
| `src/pages/auth/SignUp.tsx` | `keywordsKo`에 `피아워십, 찬양팀` 추가 |

각 페이지의 `keywordsKo` 문자열 끝에 자연스럽게 키워드를 추가합니다. `descriptionKo`가 있는 페이지 중 주요 페이지(`Features.tsx`, `MobileAppLanding.tsx`)에는 description에도 "피아워십"을 자연스럽게 포함시킵니다.

