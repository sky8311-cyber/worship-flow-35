

# 아치 지붕 너비 불일치 수정

## 문제 원인

Layer 2 (장식 아치)가 `preserveAspectRatio="xMidYMax meet"`를 사용하여 비율을 유지하므로, 컨테이너가 viewBox 비율(300:200 = 1.5:1)보다 넓으면 아치가 좌우 여백을 남기고 좁게 렌더링됨. Layer 1 (배경 fill)은 `"none"`으로 꽉 채우지만 Layer 2는 안 맞음.

## 해결

### `GothicArchTop.tsx`

**두 레이어를 하나의 SVG로 통합**, `preserveAspectRatio="none"` 사용:
- 배경 fill path와 모든 장식 요소(아치, quatrefoil, crocket, finial, 기둥, 텍스트)를 **하나의 SVG** 안에 넣음
- `preserveAspectRatio="none"` → 가로를 컨테이너에 100% 맞춤
- 텍스트는 SVG 내부에 유지 (stretching 됨 — 하지만 viewBox 비율과 container 비율 차이가 크지 않으므로 미미함)

**Collapsed 모드도 동일하게 통합**

| 파일 | 변경 |
|------|------|
| `GothicArchTop.tsx` | Layer 1 + Layer 2를 단일 SVG로 통합, `preserveAspectRatio="none"` 적용 |

