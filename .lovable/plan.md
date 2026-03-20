

## 주제 필터 불일치 버그 수정

### 원인 분석

DB `songs` 테이블에 **두 개의 컬럼**이 존재:
- `tags` — Import가 여기에 데이터 저장 (예: `"경배, 찬양, 예배"`)
- `topics` — 비어 있음 (legacy 컬럼)

**필터 코드 (line 265):**
```typescript
const songTopics = song.topics?.split(',')...  // ← topics 컬럼 읽음 (비어있음!)
```

**검색 코드 (line 200):**
```typescript
topics.ilike.%${query}%  // ← topics 컬럼 검색 (비어있음!)
```

→ "경배"를 눌러도 `song.topics`가 `null`이므로 매칭 결과 0건.

### 수정 (`src/pages/SongLibrary.tsx`)

| 위치 | 현재 | 수정 |
|---|---|---|
| Line 200 (검색) | `topics.ilike.%...%` | `tags.ilike.%...%` |
| Line 265 (필터) | `song.topics?.split(',')` | `song.tags?.split(',')` |

두 곳 모두 `topics` → `tags`로 변경하면 Import된 데이터와 필터/검색이 정확히 매칭됩니다.

### 수정 파일
| 파일 | 변경 |
|---|---|
| `src/pages/SongLibrary.tsx` | 검색 쿼리 + 주제 필터에서 `topics` → `tags` 참조로 수정 (2곳) |

