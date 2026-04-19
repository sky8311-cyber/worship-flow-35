
사용자가 이전 요청 중 미완료 항목을 지적. 직전 turn에서 4가지(탭이름, 빈상태, 토스트, 툴팁)는 했지만, 그 **이전** 승인된 plan 3가지가 누락됐는지 검토 필요.

승인된 plan 3가지:
1. SetSongScoreDialog 이중 스크롤 제거
2. 진행 설정 라벨 변경 (title/history/save)
3. "게시하기" → "공동체에 게시하기"

확인할 것:
- SetSongScoreDialog.tsx의 현재 스크롤 구조
- translations.ts의 progression 라벨 + publish 라벨
- Dashboard.tsx, UpcomingEventsWidget.tsx, SetBuilder.tsx 하드코딩 "게시하기"
