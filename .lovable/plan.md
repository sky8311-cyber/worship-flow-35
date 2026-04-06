

# Blueprint 전체 업데이트 계획

## 변경사항 요약

현재 blueprint(2026-04-05 생성)와 실제 코드베이스 사이의 차이를 반영하여 전체 문서를 업데이트합니다.

### 1. 브랜딩 수정
- 제목에서 `(예배공작소)` 제거 — K-Worship이 유일한 플랫폼명
- Section 11 i18n에서 `"예배공작소" (Korean)` 참조 제거
- Platform Identity 설명에서 `예배공작소 / "Living Atelier"` 제거, Worship Atelier은 하위 섹션으로만 언급

### 2. 누락된 테이블 추가 (5개)
DB에 존재하지만 blueprint에 미기재된 테이블:
- `liturgical_calendar_items` — 교회력 데이터 (새 테이블)
- `seed_daily_caps` — Seeds 일일 한도
- `seed_levels` — Seeds 레벨 정의
- `seed_transactions` — Seeds 거래 내역
- `service_sets_audit` — 콘티 변경 이력

### 3. Edge Function 수 정정
- 55 → 54 (실제 count)

### 4. OG 이미지 업데이트 반영
- `og-image.jpg` → `og-image.png`
- Section 12 SEO에서 OG 이미지 설명 업데이트

### 5. 라우팅 변경 반영
- `/index` → `/` redirect 추가됨
- 고아 `Index.tsx` 페이지 삭제됨

### 6. 날짜 업데이트
- `2026-04-05` → `2026-04-06`

## 작업

`/mnt/documents/K-Worship_Platform_Blueprint.md` 파일을 위 변경사항 전부 반영하여 재생성합니다. 기존 구조와 내용은 유지하되, 정확성을 높입니다.

