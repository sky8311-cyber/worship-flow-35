

# 프랑스 고딕 3단 아치 지붕 재설계

## 참조 이미지 분석

첨부된 이미지는 프랑스 고딕 양식의 **3련 아치 (triple lancet arcade)**:
- 중앙 아치가 가장 높고 뾰족함
- 좌우 아치는 낮고 대칭
- 각 아치 꼭대기에 **트레포일(trefoil/quatrefoil)** 장식 창문
- 아치 사이에 기둥(column/pillar)
- 아치 가장자리에 **크로켓(crocket)** 장식 — 뾰족한 잎 모양 반복 패턴
- 각 꼭대기에 **피니얼(finial)** — 뾰족한 꽃봉오리 장식

## 구현 계획

### `GothicArchTop.tsx` 전면 재설계

```text
    ⚜           ⚜           ⚜     ← finials (3개)
   ╱╲          ╱╲          ╱╲
  ╱◇◇╲       ╱◇◇╲       ╱◇◇╲    ← crocket 장식
 ╱ ╱╲  ╲    ╱  ╱╲  ╲    ╱ ╱╲ ╲
╱ ╱ ✿╲  ╲ ╱  ╱ ✿╲  ╲  ╱ ╱ ✿╲ ╲  ← quatrefoil 창문
│ │    │  ││  │    │  ││ │    │ │
│ │    │  ││  │    │  ││ │    │ │  ← 이중 아치 기둥
┃ └────┘  ┃┃  └────┘  ┃┃ └────┘ ┃
├─────────┴┴──────────┴┴────────┤  ← 건물 벽과 정렬
│         building body          │
```

**SVG 구조 (viewBox: `0 0 300 200`):**

1. **Layer 1 — 배경 fill** (`preserveAspectRatio="none"`)
   - 3개 아치 실루엣을 하나의 합쳐진 path로 → 건물 배경색(`#f8f6f0`)으로 채움
   - 가로 0~300 전체 사용 → 컨테이너 너비와 정확히 일치

2. **Layer 2 — 장식 디테일** (`preserveAspectRatio="xMidYMax meet"`)
   - **중앙 아치** (x: 90~210, 높이 ~180): 가장 높고 뾰족한 lancet
   - **좌측 아치** (x: 0~110, 높이 ~140): 중앙보다 낮음
   - **우측 아치** (x: 190~300, 높이 ~140): 좌측과 대칭
   - 각 아치는 **외부 + 내부 이중선**
   - 아치 사이 **기둥(columns)** — 세로선 + 작은 주두(capital) 장식
   - 각 아치 상단에 **quatrefoil 창문** — 4잎 클로버 형태의 SVG path
   - 아치 외곽선에 **crocket 장식** — 작은 삼각/잎 형태 반복
   - 3개 꼭대기에 **finial** — 뾰족한 꽃봉오리/십자가 장식
   - 중앙 finial 우측에 기존 **금색 별(★)** 유지

3. **브랜드 텍스트** — 중앙 아치 내부에 "WORSHIP ATELIER" / "by K-Worship"

**높이 변경:**
- Expanded: `96px` → `140px` (모바일 `120px`) — 3단 아치의 디테일을 충분히 표현
- Collapsed: `40px` → `52px` — 단순화된 3개 뾰족한 실루엣만

### `StudioSidePanel.tsx` 변경

- 건물 높이를 더 높이기 위해 road/lawn 영역은 유지하되, 빌딩 body의 `flex-1` 비율이 자연스럽게 늘어남 (아치가 커지면 전체 빌딩이 더 임팩트 있어짐)
- 변경 최소화 — GothicArchTop의 높이만 늘어나므로 레이아웃은 자동 적용

### Collapsed 모드

- 3개의 작은 뾰족한 삼각형 실루엣 (중앙 높고 양쪽 낮게)
- quatrefoil/crocket 생략, finial만 간략 표현

## 파일 변경

| 파일 | 변경 |
|------|------|
| `GothicArchTop.tsx` | 전면 재설계: 3단 아치 + quatrefoil 창문 + crocket + finial + 기둥 |
| `StudioSidePanel.tsx` | 변경 없음 (아치 높이 증가는 자동 반영) |

