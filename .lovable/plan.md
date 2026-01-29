

# 멤버십 카드 UI 수정 계획

## 문제 분석

### 1. 카드 잘림 현상
스크린샷에서 확인된 문제:
- **원인**: 카드 상단의 뱃지가 `absolute -top-3` 위치로 카드 영역 밖으로 확장됨
- Carousel 컴포넌트의 `overflow-hidden` 설정이 이 확장된 뱃지를 잘라냄
- 모바일 카드 기본 너비(`basis-[85%]`)로 인해 양쪽 여백이 좁음

### 2. "신용카드 필요 없음" 메시지
삭제 대상 번역 키:
- `churchAccount.trialNote` - Membership.tsx와 UpgradePlanDialog.tsx에서 사용
- `churchAccount.trialDescription` - CreateChurchAccountDialog.tsx에서 사용  
- `churchAccount.noPaymentRequired` - 미사용으로 보임

---

## 구현 계획

### 1. Membership.tsx - 카드 및 캐러셀 레이아웃 수정

**변경 내용:**
- 캐러셀 컨테이너에 `overflow-visible` 클래스 추가하여 상단 뱃지가 보이도록 함
- 캐러셀 전체에 상단 패딩(`pt-4`) 추가하여 뱃지 공간 확보
- 하단 Footer Note (trialNote) 부분 제거

```typescript
// 변경 전
<div className="md:hidden mb-8">
  <Carousel ...>
    <CarouselContent className="-ml-2">
    
// 변경 후
<div className="md:hidden mb-8 pt-4">
  <Carousel className="overflow-visible" ...>
    <CarouselContent className="-ml-2 overflow-visible">
```

```typescript
// 제거할 부분 (line 537-542)
{/* Footer Note */}
<div className="text-center">
  <p className="text-sm text-muted-foreground">
    {t("churchAccount.trialNote")}
  </p>
</div>
```

### 2. UpgradePlanDialog.tsx - Footer Note 제거

**변경 내용:**
```typescript
// 제거할 부분 (line 167-169)
<p className="text-xs text-muted-foreground text-center mt-4">
  {t("churchAccount.trialNote")}
</p>
```

### 3. CreateChurchAccountDialog.tsx - trialDescription 수정

**변경 내용:**
- `trialDescription` 대신 신용카드 언급 없는 간단한 설명으로 대체

```typescript
// 변경 전
<DialogDescription>
  {t("churchAccount.trialDescription")}
</DialogDescription>

// 변경 후 - 새 번역 키 사용 또는 다른 설명 사용
<DialogDescription>
  {t("churchAccount.createDialogDescription")}
</DialogDescription>
```

### 4. translations.ts - 번역 정리

**변경 내용:**
- `trialNote` 값 수정: "신용카드 필요 없음" 부분 제거
- `trialDescription` 값 수정: "신용카드 없이" 부분 제거
- 또는 해당 키들의 사용처를 모두 제거

```typescript
// 변경 전 (English)
trialDescription: "30-day free trial - Start now without a credit card!",
trialNote: "30-day free trial - No credit card required",

// 변경 후
trialDescription: "Start your 30-day free trial now!",
trialNote: "30-day free trial included",

// 변경 전 (Korean)
trialDescription: "30일 무료 체험 - 신용카드 없이 지금 바로 시작하세요!",
trialNote: "30일 무료 체험 - 신용카드 필요 없음",

// 변경 후
trialDescription: "지금 바로 30일 무료 체험을 시작하세요!",
trialNote: "30일 무료 체험 포함",
```

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/Membership.tsx` | 캐러셀 상단 패딩 추가, overflow-visible 적용, Footer Note 제거 |
| `src/components/church/UpgradePlanDialog.tsx` | 하단 trialNote 텍스트 제거 |
| `src/components/church/CreateChurchAccountDialog.tsx` | trialDescription 대체 |
| `src/lib/translations.ts` | 신용카드 관련 문구 제거/수정 (EN & KO) |

---

## 예상 결과

**모바일 멤버십 페이지:**
```text
┌─────────────────────────────────┐
│    [현재 플랜] ← 뱃지 보임      │
│  ┌─────────────────────────┐    │
│  │       기본멤버          │    │
│  │         무료            │    │
│  │        영구 무료         │    │
│  │  예배공동체를 만들고...   │    │
│  │                         │    │
│  │  ✓ 예배공동체 생성       │    │
│  │  ✓ 워십세트 생성 및 관리  │    │
│  │  ✓ 곡 라이브러리 관리     │    │
│  │  ✓ 템플릿 및 반복 예배    │    │
│  │                         │    │
│  │    [현재 멤버십]         │    │
│  └─────────────────────────┘    │
│      ← 스와이프하여 비교 →      │
└─────────────────────────────────┘
                ↓
        (신용카드 언급 없음)
```

