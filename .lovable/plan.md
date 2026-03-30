
# 전광판 모바일 텍스트 오버플로우 + 데스크탑 로고 태그라인 크기 불일치 수정 계획

## 확인된 원인
1. `StudioSidePanel.tsx`의 전광판 텍스트 크기 계산이 여전히 `screenW` 비중이 커서, 모바일에서 건물 폭이 늘어날 때 글자가 과대 계산됩니다.  
2. 전광판 높이(`bbH`)는 모바일 보정이 있어도 텍스트 2~3줄 상황(특히 한글 문구) 대비 여유가 부족합니다.  
3. 로고 SVG 태그라인을 키워도 `StudioHeader.tsx`에서 로고 이미지가 `h-16` 고정이라 데스크탑에서 “같은 크기처럼” 보입니다.

## 구현 변경
### 1) 모바일 전광판 텍스트를 “영역 기준”으로 재계산
- 파일: `src/components/worship-studio/StudioSidePanel.tsx`
- `BillboardText`에 모바일 여부를 전달하고, 폰트 크기를 폭/높이 동시 제한으로 재설계:
  - `fontSize = min(width기준, height기준, 언어별 상한)`
  - 한글 문구는 모바일에서 더 보수적으로 축소
- 텍스트 스타일 보정:
  - `lineHeight` 하향(예: 1.3 → 1.1~1.2)
  - `maxWidth/maxHeight` 및 중앙 정렬 유지
  - 오버플로우 방지(전광판 내부 클리핑 유지)

### 2) 모바일 전광판 박스 비율 재조정
- 파일: `src/components/worship-studio/StudioSidePanel.tsx`
- `RooftopScene`의 모바일 전광판 치수를 별도 규칙으로 조정:
  - `bbH`를 추가 확장(현재보다 상향)
  - `bbY`를 함께 조정해 루프탑 안에서 자연스러운 위치 유지
- 목적: 건물 가로 스트레치가 생겨도 전광판 텍스트가 항상 내부에 머물도록 안정화

### 3) 데스크탑에서 로고 태그라인이 실제로 더 크게 보이게 수정
- 파일: `src/components/worship-studio/StudioHeader.tsx`
- 로고 `<img>`를 반응형 높이로 변경:
  - 모바일/태블릿/데스크탑 구간별 `h-*` 분리(데스크탑 더 크게)
- 필요 시 헤더 패딩 미세 조정으로 레이아웃 균형 유지

### 4) 태그라인 자체 크기 추가 상향
- 파일: `src/assets/worship-atelier-logo.svg`
- 태그라인 `font-size`를 한 단계 더 확대하고(`110` → 더 큰 값), `y` 위치를 함께 조정해 겹침/클리핑 방지
- 데스크탑에서 확대된 헤더 로고와 결합해 가독성 확보

## 검증 계획
1. 모바일(390px/375px)에서 전광판 순환 문구 전부 확인:
   - 어떤 문구도 전광판 밖으로 나오지 않는지
2. 데스크탑(1366px+)에서 헤더 로고 확인:
   - 태그라인이 이전 대비 확실히 커졌는지
   - 로고가 잘리지 않고 수직 정렬이 유지되는지
3. 낮/밤 모드 모두에서 전광판 텍스트 가독성 확인

## 기술 상세
- 수정 대상 파일:
  - `src/components/worship-studio/StudioSidePanel.tsx`
  - `src/components/worship-studio/StudioHeader.tsx`
  - `src/assets/worship-atelier-logo.svg`
- 핵심은 “폭 기반 단일 스케일”에서 “폭+높이+언어별 상한” 스케일로 전환하는 것입니다.
- 로고는 SVG 내부 텍스트 크기만 키우는 것으로는 한계가 있으므로, 헤더 표시 크기(`img height`)를 반응형으로 함께 조정해야 데스크탑에서 차이가 체감됩니다.
