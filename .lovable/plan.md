

## Institute 페이지 수정 — 로고 4배 + 영상 세로 + 2컬럼 레이아웃

### 1. 헤더 로고 4배 확대 (`InstituteLayout.tsx`)
- 로고 `height: 32` → `height: 128` (32 × 4)
- 헤더 패딩 `py-2` → `py-4`로 조정

### 2. Hero 영역을 2컬럼 레이아웃으로 변경 (`Institute.tsx`)

현재 Hero는 전부 세로 스택. 변경 후:

```text
┌──────────────────────────────────────────────┐
│  eyebrow + title + subtitle                  │
│                                              │
│  ┌─────────┐  ┌────────────────────────────┐ │
│  │ 세로영상  │  │  Stats (3개 세로 나열)      │ │
│  │  9:16    │  │  AI 코치 배너              │ │
│  │  180px   │  │                            │ │
│  │  wide    │  │                            │ │
│  └─────────┘  └────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**왼쪽 컬럼**: 세로 영상 플레이스홀더
- `width: 180px`, `aspectRatio: '9/16'` (세로 숏폼)
- 배경 `#1a1a1a`, Play 버튼 + 레이블

**오른쪽 컬럼**: 기존 Stats 3개 + AI 코치 배너를 세로로 배치
- Stats 3개를 세로 column으로 변경 (기존 가로 → 세로)
- 그 아래 AI 코치 배너

eyebrow, 타이틀, 서브텍스트는 2컬럼 위에 전체 너비로 유지.

### 3. 바텀 네비 — 모든 페이지 표시 (`InstituteLayout.tsx`)
- `showBottomNav = isMain` → `showBottomNav = true`

### 수정 파일
| 파일 | 변경 |
|---|---|
| `src/layouts/InstituteLayout.tsx` | 로고 4x, 바텀 네비 항상 표시 |
| `src/pages/Institute.tsx` | Hero 2컬럼 레이아웃 (세로 영상 + 우측 stats/AI배너) |

