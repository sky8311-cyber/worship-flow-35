

# 법적 위험 완화 — 항목 2~5 구현

## 변경 사항

### 1. robots.txt — `/public-view` 크롤러 차단 (항목 2)
Protected paths 섹션에 `Disallow: /public-view` 추가

### 2. SEO 키워드에서 제3자 브랜드명 제거 (항목 3)
다음 파일들의 `keywordsKo` / `descriptionKo`에서 **피아워십, 마커스워십, 어노인팅, Hillsong, CCM악보** 제거:

| 파일 | 제거 대상 |
|---|---|
| `src/pages/Landing.tsx` | descriptionKo의 "마커스워십, 어노인팅, 피아워십 등 다양한 찬양을 관리하세요", keywordsKo의 "마커스워십, 어노인팅, 피아워십, CCM악보" |
| `src/pages/Features.tsx` | descriptionKo의 "피아워십 악보 관리도 지원합니다", keywordsKo의 "피아워십, 마커스워십, 어노인팅" |
| `src/pages/MobileAppLanding.tsx` | keywordsKo의 "피아워십, 마커스워십, 어노인팅" |
| `src/pages/News.tsx` | keywordsKo의 "피아워십" |
| `src/pages/Help.tsx` | keywordsKo의 "피아워십" |
| `src/pages/auth/SignUp.tsx` | keywordsKo의 "피아워십" |

**유지**: `LandingFAQ.tsx`의 FAQ 질문 "마커스워십, 피아워십 등의 곡도 관리할 수 있나요?" — 이것은 사용자 질문/답변 형태이므로 상표 사용이 합리적. `MockupScreenContent.tsx`의 목업 데이터(아티스트명)도 UI 시연 목적이므로 유지. `translations.ts`의 mockup 데이터도 유지. `update-curation-profile` Edge Function의 예시 프롬프트도 내부 AI 처리용이므로 유지.

### 3. Features.tsx "악보" → "참고 자료" (항목 4)
| 위치 | Before | After |
|---|---|---|
| L42 | `scores, YouTube references` | `uploaded references, YouTube links` |
| L43 | `가사, 악보, YouTube 레퍼런스` | `가사, 참고 자료, YouTube 레퍼런스` |
| L56 | `View scores in fullscreen` | `View uploaded materials in fullscreen` |
| L57 | `악보를 전체화면으로` | `참고 자료를 전체화면으로` |
| L63 | `scores, and notes` | `reference materials, and notes` |
| L64 | `악보, 노트를` | `참고 자료, 노트를` |

### 4. Features.tsx CTA "무료" 제거 (항목 5에 포함)
| Before | After |
|---|---|
| `무료로 K-Worship의 모든 기능을 경험해 보세요` | `K-Worship의 모든 기능을 경험해 보세요` |
| `Experience all features of K-Worship for free` | `Experience all features of K-Worship` |

### 5. Landing.tsx SEO description 수정 (항목 5)
| Before | After |
|---|---|
| `descriptionKo`: "...마커스워십, 어노인팅, 피아워십 등 다양한 찬양을 관리하세요." | "...예배 준비, 콘티 제작, 팀 협업을 위한 플랫폼입니다." |
| `keywordsKo`: "...마커스워십, 어노인팅, 피아워십...CCM악보" | "...찬양팀관리, 워십세트, 주일예배, CCM" |

## 총 변경 파일: 7개
`public/robots.txt`, `src/pages/Landing.tsx`, `src/pages/Features.tsx`, `src/pages/MobileAppLanding.tsx`, `src/pages/News.tsx`, `src/pages/Help.tsx`, `src/pages/auth/SignUp.tsx`

