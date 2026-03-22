

## SmartSongFlow에 "이전" 버튼 추가

### 변경 파일
`src/components/songs/SmartSongFlow.tsx` — Footer 영역 수정

### 변경 내용

Footer 버튼 영역(501-526줄)에서 "취소" 버튼 옆에 **"이전" 버튼** 추가:

- `currentStep > 1`일 때만 표시
- 클릭 시 `setCurrentStep(currentStep - 1)` 호출
- `ChevronLeft` 아이콘 사용
- `currentStep === 1`이면 기존 "취소" 버튼만 표시

### 레이아웃

```text
[취소] [← 이전]                    [임시저장] [다음 →]
```

- "이전" 버튼: `variant="outline"`, `size="sm"`
- Step 1에서는 "이전" 숨김

### 기술 상세
- `ChevronLeft` import 추가 (lucide-react)
- 이미 progress bar 클릭으로 이전 단계 이동이 가능하지만, 명시적 버튼이 없어 사용자가 인지하지 못하는 문제 해결

