

## 워십세트 페이지 모바일 수평 정렬 수정

### 문제
스크린샷에서 자로 표시한 것처럼, 페이지 요소들의 왼쪽 정렬이 일치하지 않음:
- 상단 액션 버튼들 (불러오기, 새로 만들기): `container px-4` = 16px 패딩
- Card 내부 콘텐츠 (제목, 뷰 토글, 필터, 카드 목록): `container px-4` + Card `p-6` = 16px + 24px = 40px 패딩

이중 패딩으로 인해 카드 안의 콘텐츠가 상단 버튼들보다 훨씬 안쪽에 위치.

### 수정 (1개 파일)

**`src/pages/WorshipSets.tsx`**:
1. Card의 `CardHeader` 패딩을 모바일에서 축소: `p-6` → `p-4 sm:p-6`
2. Card의 `CardContent` 패딩을 모바일에서 축소: `p-6 pt-0` → `p-4 pt-0 sm:p-6 sm:pt-0`
3. 또는 더 근본적으로: 모바일에서 Card 래퍼를 제거하고 직접 콘텐츠만 표시하여 `container px-4`와 동일 레벨로 정렬

**권장 방식**: CardHeader와 CardContent에 모바일용 패딩 축소 클래스 적용
- `CardHeader className="relative p-4 sm:p-6"`  
- `CardContent`에 `className="p-4 pt-0 sm:p-6 sm:pt-0"` 전달

이렇게 하면 모바일에서 container px-4 (16px) + Card p-4 (16px) = 32px로 상단 버튼(16px)과의 차이가 줄어들어 시각적으로 정렬됨.

