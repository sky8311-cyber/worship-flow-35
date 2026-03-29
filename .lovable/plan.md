

# 아치 지붕 너비 = 건물 너비 정확히 일치 + 참조 이미지 기반 개선

## 문제 원인
현재 `preserveAspectRatio="xMidYMax meet"` 설정으로 인해 SVG가 고정 비율을 유지하면서 컨테이너보다 좁게 렌더링됨. viewBox 비율(360:160 = 2.25:1)과 실제 컨테이너 비율(~232:96 = 2.42:1)이 불일치.

## 해결 방법

### `GothicArchTop.tsx` 재설계

**핵심 변경: 아치를 "배경 fill + 장식 stroke" 분리**

1. **배경 fill path**: `preserveAspectRatio="none"`으로 강제 가로 꽉 채움
2. **장식 아치 stroke + 별 + 텍스트**: 별도 SVG 레이어로 `preserveAspectRatio="xMidYMax meet"` 유지 (비율 왜곡 방지)

또는 더 단순한 접근:

**viewBox 비율을 컨테이너에 맞추고 높이를 auto로 변경**
- 고정 높이(`h-[96px]`) 제거 → `aspect-ratio` CSS 활용
- 또는 viewBox 가로를 넓혀서 비율 일치시킴

**참조 이미지 기반 개선** (첨부된 고딕 아치 도면 참조):
- 아치 하단에 **pillar base (기둥 받침대)** 추가 — 건물 벽과 자연스럽게 연결
- 기둥 받침대가 건물 border-x와 정확히 정렬
- 외부 아치 + 내부 아치 사이 간격을 더 벌려 이중 아치 느낌 강화

```text
현재:                    개선 후:
    ╱╲                      ╱╲
  ╱    ╲                  ╱ ╱╲ ╲
 ╱      ╲               ╱ ╱    ╲ ╲
│        │             ┃│ │      │ │┃  ← pillar base
┊ (gap)  ┊             ┃└─┘      └─┘┃  ← 건물 벽과 정렬
├────────┤             ├────────────┤
│building│             │  building  │
```

### 구체적 SVG 변경

**Expanded 모드:**
- viewBox: `0 0 100 50` (비율을 2:1로 단순화)
- 아치 path가 x=0 ~ x=100 전체 사용
- `preserveAspectRatio="none"` 적용하되, 별과 텍스트는 HTML overlay로 분리
- 또는: viewBox `0 -20 100 70`, height auto, width 100%

**Collapsed 모드:**
- 동일 원리로 viewBox 조정

### 파일 변경

| 파일 | 변경 |
|------|------|
| `GothicArchTop.tsx` | SVG path 재설계: pillar base 추가, preserveAspectRatio 수정으로 가로 100% 보장, 참조 이미지 스타일 반영 |

