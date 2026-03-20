

## 주제 필터 태그 버튼 가나다 순 정렬

### 원인
`SongLibrary.tsx` line 183에서 `.order("name_ko")`로 DB 정렬하고 있지만, PostgreSQL 기본 collation이 한글 가나다 순을 정확히 보장하지 않을 수 있음.

### 수정 (`src/pages/SongLibrary.tsx`)
`allTopics` 데이터를 렌더링 전에 클라이언트에서 Korean locale 정렬 추가:

```typescript
const sortedTopics = [...(allTopics || [])].sort((a, b) => 
  a.name_ko.localeCompare(b.name_ko, 'ko')
);
```

Topic Filter Chips 섹션(line 935)에서 `allTopics.map` → `sortedTopics.map`으로 변경.

### 수정 파일
| 파일 | 변경 |
|---|---|
| `src/pages/SongLibrary.tsx` | `allTopics`를 `localeCompare('ko')`로 정렬 후 렌더링 |

