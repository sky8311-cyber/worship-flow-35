
translations.ts KO만 변경:
- `setSongItem.progression.title`: "진행 설정 (선택사항)" → "진행설정"
- `setSongItem.progression.history`: "이전 진행 불러오기" 유지
- `setSongItem.progression.save`: "오늘 진행 저장" → "진행 저장"

모바일 오버플로우 방지 (SongProgressionSettings.tsx):
- 헤더 컨테이너: `flex items-center justify-between` → `flex items-center justify-between gap-2`
- 제목 `<h5>`: `flex-shrink-0` 추가, 또는 `truncate min-w-0`
- 버튼 그룹 `<div className="flex gap-1">`: `flex-shrink-0` 추가
- 버튼 텍스트가 길어 좁은 화면에서 줄바꿈/오버플로우 발생 시 → 버튼 자체에 `whitespace-nowrap` 추가
- 추가 안전장치: 모바일에서 텍스트 숨기고 아이콘만 표시하는 옵션 (`hidden xs:inline`) 대신, `whitespace-nowrap` + `flex-shrink-0`로 충분

영문(EN)도 함께 짧게 정렬:
- title: "Progression"
- history: "Load Previous"  
- save: "Save Progression"

영향 파일:
1. `src/lib/translations.ts` — 3개 키 KO/EN 단축
2. `src/components/set-builder/SongProgressionSettings.tsx` — 헤더 flex 안전장치 (gap, flex-shrink-0, whitespace-nowrap)
