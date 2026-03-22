

## 튜토리얼 모바일 최적화 — 화면 밖 툴팁 문제 수정

### 문제
430×550 모바일 뷰포트에서 툴팁이 화면 밖으로 밀려나 버튼을 누를 수 없음. 원인:
- `tooltipPosition === "bottom"` 일 때 `top`이 뷰포트 높이를 초과해도 클램핑 없음
- 타겟 요소가 화면 하단에 있으면 툴팁이 완전히 보이지 않음
- 툴팁에 `max-height`/`overflow` 없어 긴 설명도 잘림
- 닫기 버튼 접근 불가 → 앱 전체 사용 불가 상태

### 수정 사항 (1개 파일)

**`src/components/tutorial/TutorialOverlay.tsx`**

1. **툴팁 위치 뷰포트 클램핑**: top/bottom 계산 후 뷰포트 경계 내에 강제 배치
   - bottom 모드: `top = Math.min(계산값, window.innerHeight - tooltipHeight - safeMargin)`
   - top 모드: 같은 로직으로 상단 벗어남 방지
   - 공간 부족 시 자동으로 반대편으로 전환

2. **툴팁 max-height + 스크롤**: `max-h-[60vh] overflow-y-auto` 추가하여 작은 화면에서도 내용 접근 가능

3. **safe-area 고려**: 하단 패딩에 `env(safe-area-inset-bottom)` 반영

4. **모바일 전용 "건너뛰기" 링크**: 닫기(X) 외에 하단에 "튜토리얼 건너뛰기" 텍스트 버튼 추가 — 항상 보이는 위치에 배치

