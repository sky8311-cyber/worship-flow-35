

# 루프탑 전광판 (애니메이션 텍스트 스크린)

## 디자인
- 루프탑 중앙~우측에 배치, 나무/파라솔/무대 **뒤** 레이어
- 3D 입체감: 기둥 2개 + 두께감 있는 베젤 프레임 + 흰색 스크린
- 밤에는 스크린 발광 효과

## 애니메이션 텍스트 (무한 루프)
| # | 텍스트 | 애니메이션 |
|---|--------|-----------|
| 1 | 삶을 예배로 만드는 공간 | Fade In |
| 2 | WORSHIP ATELIER | 랜덤 (slide/scale/fade) |
| 3 | by K-Worship | 랜덤 |
| 4 | 나만의 공작소에 | 랜덤 |
| 5 | 입주하세요! | 랜덤 |

- 각 텍스트 ~3초 표시 → 페이드아웃 → 다음 텍스트
- `foreignObject` 사용하여 한글 어절 자동 줄바꿈 (`word-break: keep-all`)

## 구현

### `StudioSidePanel.tsx` — `RooftopScene` 수정

1. **SVG 레이어 순서** (spotlight 뒤, trees 앞):
```
[floor] → [spotlight] → [★ 전광판] → [trees] → [parasols] → [stage] → [railing]
```

2. **전광판 SVG 구조**:
   - 기둥 2개 (바닥에서 스크린까지)
   - 스크린 뒷면 두께 (2px 오프셋, 어두운 색)
   - 스크린 본체 (흰색, rounded)
   - 베젤 프레임 (stroke)
   - 밤: glow filter

3. **애니메이션 텍스트**: `useState` + `useEffect`로 인덱스 순환, `foreignObject` 안에 텍스트 렌더링. CSS transition으로 fade/scale/slide 애니메이션 적용. 랜덤 애니메이션은 텍스트 전환 시 배열에서 랜덤 선택.

4. **React.memo 유지**: 전광판 내부 state는 `RooftopScene` 안에서 관리하되, 텍스트 애니메이션 부분만 별도 내부 컴포넌트로 분리하여 부모 리렌더 방지.

## 파일
- `src/components/worship-studio/StudioSidePanel.tsx`

