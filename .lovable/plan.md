

# 템플릿 미리보기 다이얼로그 레이아웃 수정

## 문제점 분석

스크린샷에서 확인된 문제:
1. 본문 영역이 화면을 넘어감 (스크롤 영역이 제대로 작동 안 함)
2. 모바일에서 다이얼로그가 너무 넓음
3. 변수 안내 메시지가 본문 위에 겹쳐서 표시됨

## 수정 계획

### AutomatedEmailTemplatePreviewDialog.tsx

| 수정 항목 | 기존 | 변경 |
|----------|------|------|
| 다이얼로그 너비 | `max-w-2xl` | `max-w-2xl w-full` + 모바일 패딩 |
| 스크롤 영역 높이 | `flex-1 min-h-0` | `max-h-[40vh]` 또는 `h-[300px]` 명시적 높이 |
| 본문 컨테이너 | `overflow` 없음 | `overflow-hidden` 추가 |
| 변수 안내 메시지 | 본문 내 표시 | 하단으로 분리 및 간소화 |

### 코드 변경 내용

```typescript
// DialogContent 수정
<DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">

// ScrollArea에 명시적 높이 설정
<ScrollArea className="h-[300px] max-h-[40vh] border rounded-lg bg-white dark:bg-zinc-950">

// 변수 안내 메시지 간소화
<div className="text-xs text-muted-foreground p-2 bg-muted rounded">
  {{user_name}}, {{days}}, {{community_name}} 등의 변수가 실제 데이터로 치환됩니다.
</div>
```

## 예상 결과

수정 후:
- 본문이 고정 높이 내에서 스크롤됨
- 모바일 화면에서 다이얼로그가 화면 내에 맞춤
- 변수 안내 메시지가 하단에 깔끔하게 표시됨
- 전체 다이얼로그가 화면을 넘어가지 않음

