
## 작업 이해

현재 SetBuilder 페이지에 있는 "요약 섹션"을 제거하고, 그 자리에 "곡 순서 변경" 기능을 인라인으로 통합. 두 곳(인라인 + 기존 다이얼로그)의 순서 변경 UI에 (1) 곡 제목 + 코드 표시, (2) 드래그앤드랍, (3) 화살표 버튼 (데스크탑/모바일 모두), (4) 맨 아래 "키 순서" 요약을 포함시켜 요약 섹션을 완전히 대체.

## 탐색 필요

먼저 현재 코드 확인 필요:
1. SetBuilder의 "요약 섹션" 위치/구성
2. 기존 ReorderItemsDialog 재사용 가능 여부 (이미 드래그+화살표 구현됨)
3. 곡 코드(키) 데이터 구조

## 변경 계획

### 1) ReorderItemsDialog 컴포넌트 강화 (`src/components/set-builder/ReorderItemsDialog.tsx`)
- `getItemLabel`: 곡일 때 `"제목 (Key)"` 형식으로 변경 (key는 song_data의 active key — set_songs.score_key 또는 default key)
- 리스트 맨 아래 "키 순서" 요약 추가: 곡들의 키만 추출해 `G → D → Em → C` 형태로 표시
- 드래그+화살표는 이미 구현됨 (모바일/데스크탑 공통)

### 2) SetBuilder 인라인 통합 (`src/pages/SetBuilder.tsx`)
- 기존 "요약 섹션" 제거
- 같은 위치에 ReorderItemsDialog 내부 콘텐츠를 **인라인 패널**로 렌더링
- 재사용 위해 `ReorderItemsDialog`의 본체를 별도 `ReorderItemsPanel` 컴포넌트로 분리 → Dialog와 Inline 양쪽에서 사용
- 인라인 버전은 자동 저장 (변경 시 즉시 onSave 호출), Dialog 버전은 기존대로 Save/Cancel

### 3) 키 순서 요약 (양쪽 공통)
- 패널 하단에 구분선 + "키 순서" 라벨
- 곡 항목만 필터하여 키 추출, `→` 구분자로 표시
- 컴포넌트(교독문 등)는 키 표시에서 제외

## 영향 파일
1. `src/components/set-builder/ReorderItemsDialog.tsx` — 라벨에 키 추가, 키 순서 요약, 본체 컴포넌트 분리
2. `src/pages/SetBuilder.tsx` — 요약 섹션 제거 → 인라인 ReorderItemsPanel 삽입

## 확인 필요
- "요약 섹션" 정확한 위치/구성 확인 후 진행
- 곡의 활성 키 소스: `set_songs.score_key` 우선, 없으면 `song.default_key` 폴백

데이터 변경 없음. 승인 시 구현.
