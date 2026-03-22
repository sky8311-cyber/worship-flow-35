
## 즉시 재수정 계획 (요청사항 그대로 반영)

### 확인된 원인
1. **Heart 툴팁 누락**
   - `SongCard`/`SongTable`에서 쓰는 `FavoriteButton` 자체가 Tooltip을 렌더링하지 않음.
2. **헤더 버튼 오버랩 미해결**
   - `SongLibrary` 상단 우측 툴바가 `absolute top-4 right-4`로 배치되어, 필터 헤더/입력 영역과 레이아웃 충돌이 계속 발생.

---

## 구현 계획

### 1) Heart 버튼에 “즐겨찾기” 툴팁 추가 (공통 컴포넌트에서 일괄 해결)
**파일:** `src/components/FavoriteButton.tsx`

- `FavoriteButton` 내부 `Button`을 Tooltip으로 감쌈
- 툴팁 문구는 기본적으로 `t("navigation.favorites")` 사용 (ko: 즐겨찾기 / en: Favorites)
- 이렇게 하면 **카드뷰/테이블뷰 모두 자동 반영**되어 중복 수정 방지

---

### 2) 데스크탑 헤더 오버랩 구조 자체 수정 (absolute 제거)
**파일:** `src/pages/SongLibrary.tsx`

- `CardHeader`의 우측 컨트롤 블록을 `absolute` 방식에서 **일반 flow 레이아웃**으로 변경
- 상단 영역을 `좌측(검색/필터 타이틀) + 우측(뷰 토글 + 액션 버튼)` 구조의 반응형 flex/grid로 재배치
- `일괄 가져오기 / 중복곡 검색 / 곡 추가` 버튼 그룹에 `wrap`/`gap`/`shrink-0`를 적용해 폭이 줄어도 겹치지 않게 처리
- 기존 모바일 액션 행(`sm:hidden`)은 유지, 데스크탑 전용 행(`hidden sm:flex`)만 충돌 없이 재배치

---

### 3) 검증 기준 (이번 수정 완료 기준)
1. 카드뷰/테이블뷰 모두 Heart hover/focus 시 **“즐겨찾기” 툴팁 표시**
2. 데스크탑 `/songs`에서 `곡 추가 + 일괄 가져오기 + 중복곡 검색` 버튼이 서로/헤더와 **겹치지 않음**
3. 필터 영역(검색창, 언어/키/정렬 select)과 상단 우측 버튼 간 **중첩 없음**

---

## 수정 파일
1. `src/components/FavoriteButton.tsx`
2. `src/pages/SongLibrary.tsx`

---

## 기술 상세 (간단)
- 근본 원인이 개별 페이지가 아니라 **공용 FavoriteButton의 툴팁 부재**이므로 컴포넌트 단에서 해결
- 오버랩은 padding 미세조정으로는 재발 가능성이 높아, **absolute 포지셔닝 제거**가 가장 안정적인 수정 방향
