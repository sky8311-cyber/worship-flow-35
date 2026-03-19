

## 문제 분석

스크린샷에서 확인된 이슈:
1. **"기본 멤버" + "정식멤버" 뱃지가 동시 표시됨** — `RoleBadge role="worship_leader"`가 한국어로 "기본 멤버"를 표시하고, 별도로 tier 뱃지가 "정식멤버"를 표시. 정식멤버로 올라갔으면 "기본 멤버"는 불필요.
2. **정식멤버 뱃지에 아이콘 없음** — 현재 `<Badge variant="outline">` 텍스트만 사용. 이미 `TierBadge` 컴포넌트(아이콘 포함)가 존재하지만 사용하지 않음.
3. **"예배 프로필 설정" 아이콘이 User** — AI 기능임을 나타내는 아이콘/뱃지 필요.
4. **AI 뱃지 패턴 부재** — AI 기능을 표시하는 공통 뱃지가 없음.

## 수정 계획

### 1. AppHeader 뱃지 로직 수정 (lines 202-218)

- tier가 `premium` 또는 `church`이면 `RoleBadge role="worship_leader"` 숨김 (tier 뱃지가 대체)
- 기존 plain `Badge`를 `TierBadge` 컴포넌트로 교체 (아이콘 자동 포함: premium = Crown+Star, church = Building2+Shield)

### 2. 재사용 가능한 AiBadge 컴포넌트 생성

- `src/components/AiBadge.tsx` — 작은 "AI" 라벨 + Sparkles 아이콘
- 크기 옵션 (sm/md), AI 기능 표시가 필요한 곳에서 공통 사용

### 3. "예배 프로필 설정" 메뉴 아이콘 변경

- `User` → `Sparkles` 아이콘으로 교체
- "NEW" 뱃지 옆에 또는 대신 `AiBadge` 추가 (프로필 미완료 시 "NEW" 유지, 완료 시 "AI" 뱃지 표시)

### 기술 상세

**AppHeader.tsx 뱃지 영역 변경:**
```tsx
// Before: worship_leader role badge always shown
{isWorshipLeader && <RoleBadge role="worship_leader" />}
// After: hide when tier supersedes
{isWorshipLeader && tier !== "premium" && tier !== "church" && (
  <RoleBadge role="worship_leader" />
)}

// Before: plain Badge for tier
<Badge variant="outline">{TIER_CONFIG[tier].label}</Badge>
// After: TierBadge component with icons
<TierBadge tier={tier} size="sm" />
```

**AiBadge 컴포넌트:**
```tsx
// 작은 인라인 뱃지: [✨ AI]
<span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full 
  bg-gradient-to-r from-violet-100 to-blue-100 text-violet-700 text-xs font-medium">
  <Sparkles className="w-3 h-3" /> AI
</span>
```

**수정 파일:**
- `src/components/AiBadge.tsx` — 새 파일
- `src/components/layout/AppHeader.tsx` — 뱃지 로직 + 메뉴 아이콘

