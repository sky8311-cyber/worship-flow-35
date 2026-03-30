

# 전광판 모든 텍스트에 타자기(Typewriter) 효과 적용

## 변경 내용

### `src/components/worship-studio/StudioSidePanel.tsx`

1. **모든 스크린의 `anim`을 `"typewriter"`로 통일**
   - `BILLBOARD_SCREENS` 배열의 5개 항목 전부 `anim: "typewriter"`로 변경
   - `BILLBOARD_ANIMATIONS` 배열과 랜덤 애니메이션 선택 로직은 사용되지 않게 됨 (추후 정리 가능)

2. **타자기 로직 단순화**
   - `isTypewriter` 분기 제거 → 모든 스크린이 동일하게 타자기 동작
   - 스크린 전환 시 항상 `setCharCount(0)` 호출
   - CSS transform 기반 애니메이션 클래스(`billboard-slide-up`, `billboard-scale-pop` 등) 적용 중단 → 위치 이탈 문제 원천 제거

3. **영문 텍스트 타자기 속도 조정**
   - 영문은 글자 수가 많으므로 타이핑 간격을 한글(150ms)보다 빠르게 조정 (예: 80~100ms)
   - 스크린 전환 인터벌도 텍스트 길이에 맞게 동적 계산하여 타이핑 완료 후 잠시 머물다 전환

이 변경으로 CSS transform 애니메이션이 완전히 제거되어, 모바일/데스크탑 모두에서 텍스트가 전광판 밖으로 나가는 문제가 근본적으로 해결됩니다.

