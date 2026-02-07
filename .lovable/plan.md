

# 온보딩 체크리스트 "더이상 보지 않기" 옵션 추가

## 현재 상태

현재 `WLOnboardingChecklist` 컴포넌트는:
- 우측 상단 X 버튼으로 닫기 가능 (영구 dismiss)
- "시작하기" 버튼만 표시

## 변경 사항

### UI 변경

현재 단계의 "시작하기" 버튼 영역에 "더이상 보지 않기" 체크박스 추가:

```
┌─────────────────────────────────────────────────────┐
│  [현재 단계]                                         │
│  ○ 공동체 만들기                                     │
│    예배팀 또는 교회를 위한 공동체 생성                  │
│                                                     │
│    ☐ 더이상 보지 않기     [시작하기 →]                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 구현 세부사항

1. **체크박스 상태 추가**
   ```typescript
   const [dontShowAgain, setDontShowAgain] = useState(false);
   ```

2. **체크박스 + 시작하기 버튼 레이아웃**
   - 현재 단계 아이템 하단에 체크박스와 버튼을 나란히 배치
   - 체크박스 체크 시 상태 저장
   - X 버튼 또는 다른 곳 클릭으로 닫을 때 체크 상태 반영

3. **dismiss 로직 수정**
   - 체크박스가 체크된 상태에서 X 버튼 클릭 시 영구 dismiss
   - 체크박스가 체크된 상태에서 외부 클릭/닫기 시에도 영구 dismiss

---

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/dashboard/WLOnboardingChecklist.tsx` | 체크박스 상태 및 UI 추가 |

---

## 코드 변경 상세

### 1. Import 추가
```typescript
import { Checkbox } from "@/components/ui/checkbox";
```

### 2. 상태 추가
```typescript
const [dontShowAgain, setDontShowAgain] = useState(false);
```

### 3. Action 버튼 영역 수정 (라인 223-232)

**Before:**
```tsx
{isCurrent && step.action && (
  <Button
    size="sm"
    onClick={step.action}
    className="shrink-0 gap-1"
  >
    {t("onboarding.start")}
    <ChevronRight className="w-4 h-4" />
  </Button>
)}
```

**After:**
```tsx
{isCurrent && step.action && (
  <div className="flex flex-col items-end gap-2 shrink-0">
    <Button
      size="sm"
      onClick={step.action}
      className="gap-1"
    >
      {t("onboarding.start")}
      <ChevronRight className="w-4 h-4" />
    </Button>
    <label className="flex items-center gap-1.5 cursor-pointer">
      <Checkbox 
        checked={dontShowAgain}
        onCheckedChange={(checked) => {
          setDontShowAgain(checked === true);
          if (checked === true) {
            handleDismiss();
          }
        }}
        className="h-3.5 w-3.5"
      />
      <span className="text-xs text-muted-foreground">
        {language === "ko" ? "더이상 보지 않기" : "Don't show again"}
      </span>
    </label>
  </div>
)}
```

---

## 동작 방식

| 액션 | 결과 |
|------|------|
| "시작하기" 클릭 | 해당 단계 액션 실행 (기존과 동일) |
| 체크박스 체크 | 즉시 영구 dismiss (localStorage 저장 + 컴포넌트 숨김) |
| X 버튼 클릭 | 영구 dismiss (기존과 동일) |

---

## 번역 키 (선택적)

필요시 `translations.ts`에 추가:
```typescript
"onboarding.dontShowAgain": {
  ko: "더이상 보지 않기",
  en: "Don't show again"
}
```

현재는 인라인으로 처리하여 간단하게 구현합니다.

