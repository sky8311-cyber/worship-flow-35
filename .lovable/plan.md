

# 데모 페이지 카드형 리디자인 계획

## 현재 문제
데모 페이지의 카드가 실제 `SongLibrary`의 `SongCard` 컴포넌트와 다른 커스텀 인라인 카드를 사용 중. 악보 이미지 미리보기도 없고, 레이아웃도 다름.

## 변경 내용

### `src/pages/Demo.tsx` 수정

1. **기존 `SongCard` 컴포넌트 재사용**: 커스텀 인라인 카드를 제거하고, 실제 송 라이브러리에서 사용하는 `SongCard` 컴포넌트를 import하여 사용
   - `onEdit`, `onDelete` props는 전달하지 않음 (읽기 전용)
   - `onToggleCart`로 카트 기능 연결
   - `score_file_url`을 song 객체에 매핑

2. **그리드 레이아웃 변경**: 
   - 모바일: `grid-cols-2` (실제 SongLibrary와 동일)
   - 태블릿: `md:grid-cols-3`
   - 데스크탑: `lg:grid-cols-4 xl:grid-cols-5`

3. **모바일 최적화**:
   - 검색/필터 영역 간소화 — 필터를 접을 수 있는 구조 또는 한 줄로 배치
   - 헤더의 버튼 텍스트를 모바일에서 아이콘 only로 축소
   - CTA 배너를 모바일에서 더 컴팩트하게

4. **리스트뷰도 유지** (기존 테이블 뷰 그대로)

### 변경 파일

| 파일 | 변경 |
|------|------|
| `src/pages/Demo.tsx` | SongCard 재사용, 그리드 레이아웃 변경, 모바일 최적화 |

기존 `SongCard` 컴포넌트는 수정하지 않으며, Demo에서 props만 적절히 전달합니다. `tempo` 필드도 fetch query에 추가합니다.

