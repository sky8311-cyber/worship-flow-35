

# 곡 추가 드롭다운 & AI 보강 수정 계획

## 문제 분석

### 문제 1: 키/언어 선택 드롭다운이 다이얼로그 뒤에 숨김

**원인:**
- SongDialog는 `z-[60]` 사용
- `Popover`와 `Drawer`는 이미 `z-[70]`으로 수정됨 (아티스트 선택기 등)
- 하지만 **언어/키 선택에 사용되는 `<Select>`(Radix UI Select)** 는 별도 컴포넌트이며 여전히 `z-50` 사용

```
// src/components/ui/select.tsx (현재)
"relative z-50 max-h-96..."  // ← Dialog(z-[60])보다 낮음!
```

**해결책:**
`select.tsx`의 `SelectContent` z-index를 `z-[70]`으로 수정

---

### 문제 2: AI 곡 정보 보강 실패 (enrich-song 404)

**원인:**
Edge Functions가 라이브(Published) 환경에 배포되지 않았습니다. 로그 확인 결과:

| Function | Status |
|----------|--------|
| enrich-song | 404 NOT FOUND |
| rewards-credit | 404 NOT FOUND |
| sync-worship-leader-role-v2 | 404 NOT FOUND |
| process-automated-emails | 404 NOT FOUND |

코드는 `supabase/functions/` 폴더에 존재하지만, 실제 Supabase 프로젝트에 배포되어 있지 않습니다.

**해결책:**
모든 Edge Functions를 재배포합니다.

---

## 수정 내용

### 1. Select 컴포넌트 z-index 수정

**파일:** `src/components/ui/select.tsx`

```tsx
// 변경 전 (line 68-69)
"relative z-50 max-h-96 min-w-[8rem]..."

// 변경 후
"relative z-[70] max-h-96 min-w-[8rem]..."
```

### 2. Edge Functions 배포

다음 핵심 함수들을 즉시 배포:
- `enrich-song` (AI 곡 정보 보강)
- `scrape-lyrics` (가사 스크래핑 - enrich-song의 의존성)
- `rewards-credit` (보상 시스템)
- `sync-worship-leader-role-v2` (역할 동기화)
- 기타 404 반환 중인 함수들

---

## Z-Index 계층 정리 (수정 후)

| 레이어 | 컴포넌트 | z-index |
|--------|---------|---------|
| 1 | BottomTabNavigation | `z-50` |
| 2 | Dialog / Sheet | `z-[60]` |
| 3 | **Select / Popover / Drawer** | `z-[70]` ← 통일 |
| 4 | Toast 알림 | `z-[100]` |

---

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/ui/select.tsx` | `z-50` → `z-[70]` |
| Edge Functions | 모두 재배포 |

---

## 기대 결과

| 기능 | 수정 전 | 수정 후 |
|-----|--------|--------|
| 언어 선택 드롭다운 | 다이얼로그 뒤에 숨김 | 정상 표시 |
| 키 선택 드롭다운 | 다이얼로그 뒤에 숨김 | 정상 표시 |
| AI 곡 정보 보강 | 404 에러 실패 | 정상 동작 |
| 보상 시스템 | 404 에러 | 정상 동작 |

