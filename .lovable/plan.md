

# 아틀리에 빌딩 상단을 고딕 아치형으로 변형 — 구현 연구

## 로고 심볼 분석

로고의 아치 구조:
```text
        ★
      ╱    ╲         ← 뾰족한 꼭대기 (pointed arch)
    ╱        ╲
   │ ╱    ╲   │      ← 이중 아치 (outer + inner)
   ││      │  │
   ││      │  │      ← 수직 기둥 (pillars)
   ││      │  │
```

핵심 특징:
- **이중 고딕 pointed arch** (외부 + 내부)
- 꼭대기가 뾰족한 lancet arch 형태 (반원이 아닌 첨두형)
- 좌우 대칭 기둥
- 꼭대기 우측에 금색 4각 별 장식

## 현재 빌딩 구조

```text
  ┌─────────────────┐  ← rounded-t-xl (둥근 상단)
  │  Penthouse       │
  │  Friends          │
  │  Ambassadors      │
  ├─────────────────┤  ← 구분선
  │  1F Ground Floor  │
  │  🚪 Door + Stairs │
  ├─────────────────┤
  │ 🌿 Lawn          │
  ├─────────────────┤
  │ 🚗 Road          │
  └─────────────────┘
```

## 변형 목표

```text
         ★
        ╱╲
      ╱ ╱╲ ╲         ← SVG 이중 고딕 아치 (로고와 동일)
     ╱ ╱    ╲ ╲
    ╱ ╱      ╲ ╲
   │ │        │ │
  ┌┘ └────────┘ └┐    ← 아치에서 직선 벽으로 전환
  │  Penthouse    │
  │  Friends      │
  │  Ambassadors  │
  ├───────────────┤
  │  1F + Door    │
  │  Lawn + Road  │
  └───────────────┘
```

## 구현 방법

### 접근: SVG clip-path + 장식 아치 오버레이

1. **빌딩 상단을 `rounded-t-xl` 대신 SVG `clipPath`로 고딕 아치 형태 적용**
   - CSS `clip-path: url(#gothic-arch)` 사용
   - SVG `<clipPath>`에 로고와 동일한 pointed arch path 정의
   - 빌딩 너비에 맞게 viewBox 비율 조정

2. **장식용 이중 아치 SVG 오버레이**
   - 빌딩 상단 위에 `absolute` 배치된 SVG로 외부/내부 아치 라인 렌더링
   - 로고의 stroke 스타일 그대로: `stroke="#1F1F1F"`, `stroke-width` 비례 조정
   - 아치 라인은 빌딩 벽면 색상 위에 어두운 윤곽선으로 표현

3. **금색 별 장식**
   - 아치 꼭대기 우측에 로고와 동일한 4각 별 SVG
   - `fill="#B8902A"` (브랜드 골드)

4. **collapsed 상태 대응**
   - 좁은 폭에서도 아치 비율 유지 (viewBox 활용)
   - collapsed일 때는 단순화된 작은 아치만 표시

### 세부 구현

**파일:** `src/components/worship-studio/StudioSidePanel.tsx`

- `rounded-t-xl` 제거 → `rounded-none`으로 변경
- 빌딩 body div 위에 새 아치 컴포넌트 추가

**새 컴포넌트:** `src/components/worship-studio/GothicArchTop.tsx`
- Props: `width`, `collapsed`, `isMobile`
- 렌더링:
  - 외부 아치 path (로고 외부 아치 비율 그대로)
  - 내부 아치 path (로고 내부 아치 비율 그대로)
  - 금색 별 장식
  - 아치 내부는 빌딩 배경색(`from-slate-50`)으로 채움
  - 아치 외부는 투명 (하늘 배경 보임)

### 핵심 SVG path 변환

로고 원본 (660×540 영역):
```
외부: M150,520 L150,200 Q150,130 200,90 L280,20 Q330,-20 380,20 L460,90 Q510,130 510,200 L510,520
내부: M195,520 L195,230 Q195,170 230,140 L290,90 Q330,60 370,90 L430,140 Q465,170 465,230 L465,520
```

빌딩 폭(~232px, w-64 - mx-3*2)에 맞게 스케일링:
- viewBox를 `0 0 660 200`으로 설정, 아치 높이는 약 80px
- 아치 아래는 직선 벽으로 자연스럽게 연결

### 옥상 간판 재배치
- 현재 아치 위 별도 div → 아치 내부 상단 중앙으로 이동
- 또는 아치 꼭대기 바로 아래에 작은 간판 배치

## 파일 변경 요약

| 파일 | 변경 |
|------|------|
| `GothicArchTop.tsx` (신규) | 이중 고딕 아치 SVG 컴포넌트 |
| `StudioSidePanel.tsx` | 빌딩 상단 `rounded-t-xl` → 아치 컴포넌트로 교체, 간판 위치 조정 |

## 주의사항
- SVG path는 로고 심볼과 **정확히 동일한 비율**을 유지해야 브랜드 일관성 확보
- 아치 높이가 너무 크면 스크롤 영역이 줄어드므로 60~80px 정도가 적절
- 모바일(`mx-6`)과 데스크탑(`mx-3`)에서 아치 폭이 달라지므로 viewBox 기반으로 반응형 처리

