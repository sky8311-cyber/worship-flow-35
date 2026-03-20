

## 플랜 수정: draft_step 컬럼 추가

기존 승인된 SmartSongFlow 플랜의 DB 변경사항에 `draft_step` 컬럼을 추가합니다.

---

### DB 변경 (기존 2개 → 3개 컬럼)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `original_composer` | TEXT, nullable, default null | 가사 검색 보조용 |
| `status` | TEXT, default 'published' | draft / published |
| **`draft_step`** | INTEGER, nullable, default null | 임시저장 시 현재 step (1-6) |

**Migration SQL 추가분:**
```sql
ALTER TABLE songs ADD COLUMN draft_step integer DEFAULT NULL;
```

---

### 동작 변경

1. **임시저장 시**: 현재 step 번호를 `draft_step`에 저장
   - 예: Step 3에서 임시저장 → `draft_step = 3`

2. **Draft 재개 시**: `draft_step` 값이 있으면 해당 step부터 시작, 없으면 Step 1부터

3. **최종 저장 시**: `draft_step = null`로 초기화 (published 상태에선 불필요)

---

### 영향 파일

| 파일 | 변경 |
|---|---|
| Migration SQL | `draft_step` 컬럼 추가 |
| `SmartSongFlow.tsx` | 임시저장 시 `draft_step` 저장, 재개 시 초기 step으로 사용 |
| `SongLibrary.tsx` | Draft 재개 시 `draft_step` 값을 SmartSongFlow에 전달 |

나머지 플랜은 기존 승인 내용 그대로 유지.

