

# 전체 플랫폼 법적 용어 감사 및 수정

## 문제점
"무료", "free", "sheet music" 등 플랫폼이 콘텐츠를 제공하거나 무료 악보를 배포하는 것처럼 오해될 수 있는 표현이 다수 남아있음.

## 수정 원칙
- **"무료로 시작하기" / "Get started free"** → **"지금 시작하기" / "Get started"** (가격 관련 표현 제거)
- **"무료 가입" / "Sign up free"** → **"가입하기" / "Sign up"**
- **"sheet music management"** → **"uploaded reference management"** or **"참고 자료 관리"**
- 가격표에서 쓰는 "무료" (팀멤버/기본멤버 요금)는 **유지** — 이것은 pricing tier 설명이므로 법적 문제 없음
- 30일 체험 관련 "무료 체험"도 **유지** — 이것은 trial 설명
- "is_free" 같은 코드 변수명은 변경 불필요

## 변경 대상 (13개 파일)

### 1. `src/pages/Demo.tsx`
| 위치 | Before | After |
|---|---|---|
| L106 | `무료로 써볼 수 있습니다` | `체험해볼 수 있습니다` |
| L131 | `${songs.length}곡의 찬양을 무료로 체험하세요` | `${songs.length}곡의 찬양을 체험해보세요` |
| L132 | `Try ${songs.length} worship songs for free` | `Try ${songs.length} worship songs` |
| L155 | `무료 가입` | `가입하기` |

### 2. `src/components/demo/DemoSignupCTA.tsx`
| Before | After |
|---|---|
| `무료 회원가입이 필요합니다` | `회원가입이 필요합니다` |
| `Sign up for free to use this feature` | `Sign up to use this feature` |
| `무료 가입하기` | `가입하기` |
| `Sign up free` | `Sign up` |

### 3. `src/components/landing/LandingHeroSimple.tsx`
| Before | After |
|---|---|
| `무료로 시작하기` / `Get started free` | `지금 시작하기` / `Get started` |

### 4. `src/lib/translations.ts`
| Key | Before | After |
|---|---|---|
| `hero.ctaButton` | `무료로 시작하기` | `지금 시작하기` |
| `cta.ctaButton` | `무료로 시작하기` | `지금 시작하기` |
| `faq.q5.question` | `K-Worship은 무료인가요?` | `K-Worship 멤버십은 어떻게 되나요?` |
| `faq.q5.answer` | `핵심 기능을 무료로 제공합니다...` | `기본 멤버로 핵심 기능을 이용할 수 있습니다. 팀 협업 및 공동체 관리를 위한 고급 기능은 정식 멤버십으로 제공됩니다.` |

### 5. `src/components/landing/LandingFAQ.tsx`
| Before | After |
|---|---|
| `무료인가요?` | `멤버십은 어떻게 되나요?` |
| `기본 기능은 무료로 제공됩니다...` | `기본 멤버로 핵심 기능을 이용할 수 있습니다. 팀 협업 및 공동체 관리 등 고급 기능은 정식 멤버십으로 제공됩니다.` |
| `Is K-Worship free?` | `What membership plans are available?` |
| `Core features are free...` | `Core features are available to all members. Advanced features like team collaboration and community management are offered through premium membership.` |
| `sheet music management` (FAQ 답변들) | `reference material management` / `참고 자료 관리` |

### 6. `src/components/atelier-landing/AtelierFAQ.tsx`
| Before | After |
|---|---|
| `무료인가요?` / `Is it free?` | `어떻게 시작하나요?` / `How do I get started?` |
| `기본 기능은 무료로 제공됩니다...` | `워십 아틀리에의 기본 기능은 모든 멤버에게 제공됩니다...` |
| `core features...are free` | `Core features of Worship Atelier are available to all members...` |

### 7. `src/pages/auth/SignUp.tsx`
| Before | After |
|---|---|
| `Create your free K-Worship account` | `Create your K-Worship account` |
| `K-Worship 무료 계정을 만드세요` | `K-Worship 계정을 만드세요` |

### 8. `supabase/functions/send-referral-invite/index.ts`
| Before | After |
|---|---|
| `다양한 기능을 무료로 이용하세요!` | `다양한 기능을 이용하세요!` |
| `all for free!` | 제거 |
| `sheet music` references | `reference materials` / `참고 자료` |

### 9. `src/pages/Help.tsx`
- 모든 `sheet music` → `uploaded reference material` / `참고 자료`
- `view sheet music` → `view uploaded materials` / `자료 보기`
- `Sheet Music Only` (인쇄 모드명) → `Reference Materials Only`

### 10. `src/pages/MobileAppLanding.tsx`
| Before | After |
|---|---|
| `sheet music sharing` | `reference material sharing` |
| `악보 공유` | `참고 자료 공유` |
| SEO keywords의 `sheet music` | `worship reference materials` |

## 변경하지 않는 항목
- 가격표의 "무료" (planMemberPrice, freeLabel, freeForever) — pricing tier 표시
- 30일 체험 관련 "무료 체험" — trial 기능 설명
- 코드 변수명 (is_free 등)
- `download-score-image` edge function 내부 로직
- `악보` 자체가 song_scores 테이블 컬럼 등 내부 용어로 쓰이는 경우

