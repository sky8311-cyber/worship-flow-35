
# 자동 이메일 UI 개선 (3가지 문제 해결)

## 발견된 문제들

### 1. 템플릿 미리보기 닫기 버튼 미작동
- **원인**: `AutomatedEmailTemplatePreviewDialog`가 조건부 렌더링(`{templatePreviewType && ...}`)으로 감싸져 있음
- **증상**: `onOpenChange`에서 `templatePreviewType`을 `null`로 설정하면 컴포넌트가 즉시 언마운트되어 닫기 애니메이션이 작동하지 않고 Dialog가 "멈춘" 것처럼 보임

### 2. 수신자 명단 좌우 스크롤 불가
- **원인**: `AutomatedEmailPreviewDialog`의 테이블이 `ScrollArea`로만 감싸져 있어 수직 스크롤만 가능
- **증상**: 모바일에서 "이름, 이메일, 경과일" 컬럼이 잘려 정보 확인 불가 (스크린샷에서 오른쪽 일부만 보임)

### 3. 다음 발송 예정일 및 수신자 업데이트 시간 표시 요청
- **현재**: 마지막 실행 시간만 표시
- **요청**: 각 자동 이메일별 다음 발송 예정일과 수신자 리스트 업데이트 예측 시간

---

## 수정 계획

### 파일 1: AutomatedEmailSettings.tsx

| 항목 | 현재 | 변경 |
|------|------|------|
| 템플릿 다이얼로그 렌더링 | `{templatePreviewType && <Dialog ...>}` | 항상 렌더링 + `open` prop으로 제어 |
| 다음 발송 예정일 | 표시 안함 | 각 카드 헤더에 표시 |
| 수신자 업데이트 시간 | 표시 안함 | 수신자 다이얼로그 하단에 표시 |

```typescript
// 변경 전 (507-529줄)
{templatePreviewType && (
  <AutomatedEmailTemplatePreviewDialog ... />
)}

// 변경 후
<AutomatedEmailTemplatePreviewDialog
  open={!!templatePreviewType}
  onOpenChange={(isOpen) => {
    if (!isOpen) setTemplatePreviewType(null);
  }}
  emailType={templatePreviewType || "inactive_user"}
  subject={...}
  body={...}
  triggerDays={...}
/>
```

**다음 발송 예정일 계산**:
```typescript
// 다음 발송 시간 계산 함수
const getNextScheduledTime = (scheduleHour: number) => {
  const now = new Date();
  const kstOffset = 9 * 60;
  const next = new Date(now);
  
  // UTC 시간으로 schedule_hour 설정
  next.setUTCHours(scheduleHour, 0, 0, 0);
  
  // 이미 지났으면 내일로
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
};
```

UI 표시:
```text
┌──────────────────────────────────────────────────────────┐
│ 👤 미접속자 리마인더              [활성]      81명 대상  │
│                              다음 발송: 내일 09:00 KST   │
└──────────────────────────────────────────────────────────┘
```

---

### 파일 2: AutomatedEmailPreviewDialog.tsx

| 항목 | 현재 | 변경 |
|------|------|------|
| 테이블 래퍼 | `ScrollArea`만 | `ScrollArea` + `overflow-x-auto` |
| 테이블 너비 | 자동 | `min-w-[600px]` 고정 (좌우 스크롤 가능) |
| 업데이트 시간 | 없음 | 푸터에 "조회 시간: 2026.01.26 11:23" 표시 |

```typescript
// 변경 전 (129줄)
<ScrollArea className="flex-1 min-h-0 border rounded-lg">
  <Table>...</Table>
</ScrollArea>

// 변경 후
<ScrollArea className="flex-1 min-h-0 border rounded-lg">
  <div className="overflow-x-auto">
    <Table className="min-w-[600px]">...</Table>
  </div>
</ScrollArea>
```

푸터에 조회 시간 추가:
```typescript
<div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
  <p className="flex items-center gap-1">
    <Clock className="w-3 h-3" />
    {language === "ko" 
      ? `조회: ${new Date().toLocaleString("ko-KR")}` 
      : `Fetched: ${new Date().toLocaleString("en-US")}`}
  </p>
  <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
    닫기
  </Button>
</div>
```

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `AutomatedEmailSettings.tsx` | 템플릿 다이얼로그 조건부 렌더링 제거 + 다음 발송 예정일 표시 |
| `AutomatedEmailPreviewDialog.tsx` | 테이블 좌우 스크롤 가능 + 조회 시간 표시 |

---

## 예상 결과

1. **닫기 버튼 정상 작동**: Dialog가 정상적으로 닫힘
2. **수신자 명단 스크롤**: 모바일에서 좌우 스와이프로 모든 컬럼 확인 가능
3. **발송 예정일 표시**: 각 이메일 유형별로 "다음 발송: 오늘 09:00 KST" 표시
4. **조회 시간 표시**: 수신자 명단 하단에 언제 조회했는지 표시하여 다음 업데이트 예측 가능
