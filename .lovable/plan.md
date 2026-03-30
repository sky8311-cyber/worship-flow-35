

# 전광판 스크린 4 — 타자기(Typewriter) 효과

## 변경 사항

### `StudioSidePanel.tsx` — `BillboardText` 컴포넌트 수정

1. **스크린 4 데이터에 타입 추가**: `BILLBOARD_SCREENS[3]`에 `anim: "typewriter"` 속성 추가
2. **타자기 상태 관리**: 스크린 4일 때 `useState`로 표시할 글자 수를 0부터 하나씩 증가시키는 `useEffect` 추가 (약 150ms 간격)
3. **텍스트 표시**: `text.slice(0, charCount)` + 깜빡이는 커서(`|`) 표시
4. **타이밍 조정**: 스크린 4의 표시 시간을 타이핑 완료 + 여유 시간으로 충분히 확보 (전체 interval은 유지하되, 타자기 효과가 interval 안에 맞도록 150ms × 7글자 ≈ 1초)
5. **스크린 4에서는 랜덤 애니메이션 클래스 대신 타자기 효과 직접 처리** — `animClass` 무시하고 자체 렌더링

### 파일
- `src/components/worship-studio/StudioSidePanel.tsx`

