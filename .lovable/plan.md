
## 4가지 정리 작업

### 1) 예배 순서 카드 (SetComponentItem) 헤더 통일
**현재**: 우측에 X(삭제) 버튼만 별도 컬럼(`<div>`)으로 분리. 편집 개념은 없으나 송 카드와 위치/패딩이 어긋남.
**수정** (`src/components/SetComponentItem.tsx`):
- 우측 별도 컬럼 제거
- 헤더 영역(현재 `<div className="flex items-center justify-between">` 줄 125)에 송 카드와 동일한 액션 컨테이너 배치: `<div className="flex items-center gap-1 flex-shrink-0 -mr-1 -mt-1">` + X 버튼 (`h-8 w-8 ghost text-muted-foreground hover:text-destructive`)
- 본문 우측 패딩/여백 제거 → 본문이 카드 끝까지 폭 활용 (송 카드와 컬럼 정렬)

### 2) 담당자 + 소요시간 같은 줄 (2 columns), 모바일은 2줄
**수정** (`SetComponentItem.tsx` 줄 202-225):
- `CollapsibleContent` 내부를 `grid grid-cols-1 sm:grid-cols-2 gap-2`로 변경
- 두 Input 모두 `w-full` (현재 소요시간만 `w-32` 고정 → 제거)
- 아이콘은 Input 내부 `relative` + `absolute left-2`로 배치하거나, 현재처럼 `flex items-center gap-2 min-w-0` + `Input className="w-full"` 유지
- 아래 RichTextEditor도 동일 width (`w-full`이 기본이지만 부모 컨테이너 width 정렬 확인)

### 3) "이력" 버튼 outline 추가
**수정** (`src/components/set-builder/SongProgressionSettings.tsx` 줄 98):
- `variant="ghost"` → `variant="outline"` 으로 변경
- 사이즈/높이는 그대로 (`h-7 px-2 text-xs`)

### 4) "가사 가져오기" + "복사" 버튼 일관성 + 모바일 정리
**현재** (`SetSongItem.tsx` 줄 383-435):
- "가사 가져오기"는 Switch + Label + Download 아이콘 (스위치 형태)
- "복사"는 ghost Button (별도 우측 배치)
- 모바일에서 두 영역이 분리되어 복잡해 보임
**수정**:
- 두 버튼 모두 동일한 outline 버튼 스타일로 통일: `variant="outline" size="sm" className="h-7 px-2 text-xs gap-1"`
- "가사 가져오기"는 Switch 제거 → `Button` (toggle 동작: 체크 시 활성 variant, 미체크 시 outline). 아이콘은 `Download`
- "복사" 버튼도 동일한 `h-7 px-2 text-xs` outline
- 한 줄에 정렬: `<div className="flex items-center gap-1 flex-wrap">` — 모바일에서 좁으면 `flex-wrap`으로 자연스럽게 줄바꿈, 데스크톱에서는 한 줄
- 가사 토글(트리거 chevron)은 좌측, 액션 버튼들(가져오기/복사)은 우측 그룹으로 배치

### 영향 파일
1. `src/components/SetComponentItem.tsx` — 헤더 X버튼 위치 통일, 담당자/소요시간 2-col grid
2. `src/components/SetSongItem.tsx` — 가사 영역 버튼 일관성/한줄 정리
3. `src/components/set-builder/SongProgressionSettings.tsx` — 이력 버튼 outline

### 진행
승인 시 default 모드에서 위 3개 파일 수정. 데이터 변경 없음. 모바일/데스크톱 재테스트 요청.
