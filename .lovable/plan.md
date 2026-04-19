

## 속도 개선 계획

현재 앱이 매우 느림. 원인 진단 후 단계별 개선안을 제시.

## 진단 (탐색 필요)

먼저 어디가 느린지 정확히 파악해야 함. 가능한 병목:

1. **초기 로딩 (FCP/LCP)** — 번들 크기, lazy loading 미적용
2. **데이터 페칭** — N+1 쿼리, 불필요한 재요청, staleTime 부족
3. **리렌더링** — Context 값 변동, 무거운 컴포넌트, memoization 부재
4. **이미지/자산** — 큰 이미지, lazy loading 없음
5. **백엔드 부하** — DB 쿼리 느림, 인덱스 부족, RLS 비효율
6. **실시간 구독** — 과다한 채널, 무한 리스너

## 1차 조사 항목 (계획 승인 후 실행)

| 영역 | 방법 |
|------|------|
| **번들/네트워크** | `browser--performance_profile`로 LCP/FCP/TTI/Long Tasks 측정. 가장 큰 청크 파악. |
| **DB 슬로우 쿼리** | `supabase--analytics_query` postgres_logs에서 느린 쿼리 + RLS recursion 확인. |
| **컴포넌트 재렌더** | React Profiler 시뮬레이션 — `routes`, `AuthContext`, `LanguageContext` 의존도 확인. |
| **이미지 자산** | Storage 버킷의 unoptimized 이미지 + `<img>`에 `loading="lazy"` 적용 여부. |
| **Lazy Routes** | `App.tsx` 라우트가 `React.lazy`로 분할돼 있는지. |

## 예상 개선 작업 (조사 후 우선순위 결정)

### A. 즉시 효과 (Low effort, High impact)
1. **라우트 코드 스플리팅** — 모든 페이지 `React.lazy()` + `<Suspense>` 적용. (현재 수십 개 라우트 동시 번들 가능성)
2. **React Query 기본 옵션 강화** — `staleTime: 60_000`, `refetchOnWindowFocus: false` 글로벌 적용으로 불필요한 재요청 제거.
3. **이미지 lazy loading + `decoding="async"`** — Song Library, Studio, Discovery 카드의 썸네일/커버 이미지에 일괄 적용.
4. **SongLibrary 검색 디바운스 검증** — 이미 v2 패턴 있다고 메모리에 기록됨, 실제 적용 확인.

### B. 중간 효과 (Medium effort)
5. **무거운 페이지 가상화** — Song Library, Communities, Set 목록이 100+ 행이면 `react-window` 적용.
6. **AuthContext / LanguageContext value 메모이제이션** — `useMemo`로 reference 안정화 → 전체 트리 리렌더 방지.
7. **Realtime 구독 정리** — Set Builder, Studio에서 cleanup 누락된 채널 점검.
8. **Edge Function refreshSession 호출 줄이기** — 메모리에 기록된 패턴이지만 모든 호출에 강제하면 오히려 느림. 401 발생 케이스에만 retry.

### C. 백엔드 (조사 결과에 따라)
9. **DB 인덱스 추가** — 슬로우 쿼리 결과 보고 `service_sets(community_id, updated_at)`, `set_songs(set_id)`, `songs(created_by, archived)` 등 인덱스 마이그레이션.
10. **RLS 헬퍼 함수 SECURITY DEFINER** — 재귀 발생 정책 발견 시 helper 함수로 단순화.
11. **N+1 제거** — Song Library 등에서 별도 쿼리 → join 또는 batch RPC 1회 호출로 변환.

### D. 최후 수단
12. **Lovable Cloud 인스턴스 업그레이드** — 위 코드/스키마 개선 후에도 느리면 백엔드 컴퓨트 사이즈 증설 안내.

## 진행 방식 제안

**Phase 1 (이 승인 직후)**: 진단 — `browser--performance_profile`, DB 로그, 번들 분석 → 실제 병목 1~3개 식별 → 결과 보고.

**Phase 2 (사용자 확인 후)**: 식별된 병목에 대해 위 A/B/C 항목 중 해당하는 것만 우선 구현. 한 번에 너무 많이 바꾸면 회귀 위험.

**Phase 3**: 측정 → 추가 최적화 또는 인스턴스 업그레이드 결정.

## 영향 파일 (Phase 2 예상)

- `src/App.tsx` — 라우트 lazy 변환
- `src/main.tsx` 또는 QueryClient 설정 파일 — staleTime 글로벌
- `src/contexts/AuthContext.tsx`, `LanguageContext.tsx` — useMemo
- `src/pages/SongLibrary.tsx`, `Communities.tsx` 등 — 이미지 lazy + 가상화
- DB migration — 인덱스 추가 (필요 시)

데이터 손실 없음. 모든 변경은 점진적 + 측정 기반.

