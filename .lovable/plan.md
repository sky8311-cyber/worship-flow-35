

# 아틀리에 빌딩 → 11세기 프랑스 고딕 건축물 변환

## 개요
현재 단순 rounded-xl 박스 형태의 빌딩을 프랑스 고딕 양식의 사암색 건축물로 변환. 인라인 SVG로 3단 뾰족 아치(Triple Lancet) 지붕 + quatrefoil 장식을 구현하고, 1층 입구도 고딕 아치형으로 변경.

## 구조 (위→아래)

```text
        ╱╲     ╱╲     ╱╲        ← finial (십자가/꽃봉오리) 3개
       ╱  ╲   ╱  ╲   ╱  ╲       ← 뾰족 아치 3단 (가운데 높음)
      │ ◎ │ │ ◎ │ │ ◎ │       ← quatrefoil 창문
      │    │ │    │ │    │
      ┝━━━━┥ ┝━━━━┥ ┝━━━━┥       ← crocket 장식 + 기둥 연결
     ┃ ★ Worship Atelier ★ ┃    ← 브랜드명 (아치 내부)
     ┠──────────────────────┨    ← 코니스 (처마돌림띠)
     ┃  내 스튜디오 (펜트하우스) ┃
     ┃  이웃 1                ┃    ← 입주민 ScrollArea
     ┃  이웃 2                ┃       사암색 배경 + 미세 석재 질감
     ┃  ...                   ┃
     ┃  앰배서더               ┃
     ┠──────────────────────┨    ← 층간 구분 (석조 띠)
     ┃      ╱╲   ╱╲          ┃    ← 1층: 고딕 아치형 이중문
     ┃     │  │ │  │         ┃       양쪽 기둥 장식
     ┗━━━━━┷━━┷━┷━━┷━━━━━━━━━┛
     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    ← 벽돌 기단부
     ████████████████████████    ← 도로
```

## 파일 변경

### 1. `src/components/worship-studio/GothicRoof.tsx` (새 파일)
- 인라인 SVG 컴포넌트: 3단 뾰족 아치 (Triple Lancet Arcade)
- viewBox 기반으로 부모 너비에 맞게 자동 스케일
- 중앙 아치가 양쪽보다 높음 (참고 이미지 IMG_5835 기반)
- 각 아치 꼭대기에 finial (십자가/꽃봉오리 장식)
- 아치 내부에 quatrefoil (네잎 장식) 창문
- crocket (갈고리 장식) 아치 외곽선을 따라 배치
- 아치 사이 spandrel 영역에 tracery 패턴
- 색상: stroke `#8a7a6a`, fill `#d4c5a9` (사암), 창문 `#87CEEB/30%` (하늘빛 유리)
- Props: `collapsed` — true면 finial 하나만 렌더링 (h-6 정도)
- "Worship Atelier" 텍스트를 중앙 아치 내부에 배치

### 2. `src/components/worship-studio/GothicEntrance.tsx` (새 파일)
- 1층 고딕 아치형 입구 SVG
- 뾰족 아치 이중문 (현재 사각 문 대체)
- 양쪽에 고딕 기둥 (column with capital)
- 문 위에 작은 장미창 (rose window) 또는 tracery 장식
- 문 양쪽 벽면에 벽돌/석재 패턴
- 아치 위 tympanum (반달형 공간)에 작은 십자가
- 색상: 문 `#5a4d3e`, 벽돌 `#c8b89a`, 기둥 `#b8a88a`

### 3. `src/components/worship-studio/StudioSidePanel.tsx` 수정

**지붕 영역 (line 265-280):**
- 기존 "Rooftop sign" div 제거
- `<GothicRoof collapsed={collapsed} />` 삽입
- 높이: expanded `h-20~24`, collapsed `h-6`

**건물 본체 (line 284-294):**
- `rounded-t-xl` 제거 (지붕이 SVG로 대체되므로 상단 둥근 처리 불필요)
- 배경: `bg-gradient-to-b from-[#e8ddd0] via-[#ddd2c0] to-[#d4c5a9]` (사암 그라데이션)
- 벽면에 미세한 석재 질감: `background-image`로 2px 간격 수평선 (모르타르 조인트)
- border 색상: `#b8a88a` (사암에 맞게)
- `boxShadow` 유지하되 gold → 사암 톤

**층간 구분 (line 296-297):**
- 단순 border 대신 석조 코니스 스타일: `h-2 bg-gradient-to-r from-[#c8b89a] via-[#d4c5a9] to-[#c8b89a]` + 상하 border

**1층 Ground Floor (line 299-341):**
- 기존 사각 문 + 계단 제거
- `<GothicEntrance collapsed={collapsed} />` 삽입
- 배경: 벽돌 패턴 (`repeating-linear-gradient`로 가로+세로 선 조합)

**기단부 (line 343-365):**
- 잔디 → 석재 기단: `bg-[#a89070]` + 벽돌 패턴
- 또는 잔디 유지하되 기단 벽돌 한 줄 추가

**도로 (line 367-384):**
- 유지 (변경 없음)

## 색상 팔레트 (따뜻한 사암 Sandstone)

| 용도 | 색상 |
|------|------|
| 벽면 메인 | `#d4c5a9` |
| 벽면 어두운 | `#c8b89a` |
| 벽면 밝은 | `#e8ddd0` |
| 테두리/윤곽 | `#8a7a6a` |
| 기둥/장식 | `#b8a88a` |
| 창문 유리 | `rgba(135,206,235,0.3)` |
| 문 | `#5a4d3e` |
| 금색 포인트 | `#b8902a` (기존 유지) |

## collapsed 상태
- 지붕: finial(십자가/꽃봉오리) 장식 하나만 작게 표시 (6px 높이)
- 건물 본체: 기존 좁은 레이아웃 유지
- 1층: 축소된 아치 문 (기존 축소 문과 유사한 크기)

## 모바일
- `mx-6` 유지, 아치 SVG가 viewBox로 자동 맞춤
- 구름 이모지는 유지

