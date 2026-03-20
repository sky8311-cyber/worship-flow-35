

## CSV Import 개선 — tags/topics 정렬 + 전체 덮어쓰기 + 툴팁 + 스크롤 미리보기

### 문제점
1. **컬럼 불일치**: DB는 `tags` 컬럼, 업로드 파일도 `tags` 사용, 하지만 import 코드는 `topics`로 매핑 → tags 데이터 무시됨
2. **업데이트 시 빈 값 skip**: 의도적으로 비운 필드가 반영 안 됨
3. **툴팁 없음**: Import 화면에 도움말 부재
4. **미리보기 스크롤**: `max-h-80`으로 고정, 큰 데이터셋에서 불편

### 변경 내용 (`src/components/CSVImportDialog.tsx`)

#### 1. CSVRow 인터페이스 — `tags` 필드 추가
```typescript
interface CSVRow {
  ...
  topics?: string;
  tags?: string;  // ← 추가 (Export에서 tags로 나옴)
}
```

#### 2. tags ↔ topics 통합 처리
- 모든 곳에서 `row.tags || row.topics` 사용
- DB 저장 시 `tags` 컬럼에 매핑 (현재 잘못 `topics`로 보내고 있음 → `tags`로 수정)
- Preview 테이블에서도 `row.tags || row.topics` 표시

#### 3. 전체 덮어쓰기 로직 수정
- ID 매칭 시: **모든 필드를 파일 값으로 교체** (빈 값 → `null`)
- 현재: `if (value && value !== "")` 체크로 빈 값 skip → 제거
- ID 없는 행: 새 곡으로 생성 (기존과 동일)

#### 4. 미리보기 스크롤 영역 확대
- `max-h-80` → `max-h-[50vh]` (화면 반 높이까지 스크롤 가능)
- ScrollArea 컴포넌트 적용으로 부드러운 스크롤

#### 5. 툴팁 추가 (HelpTooltip 활용)
- Upload 영역 설명 옆: "CSV/Excel 파일로 곡을 대량으로 추가하거나 업데이트합니다" + `/help#add-song`
- "타입" 컬럼 헤더: "ID가 있으면 업데이트, 없으면 신규 추가"
- "악보 상태" 컬럼: "이미지 파일을 함께 업로드하면 자동 매칭됩니다"
- 전체/신규/업데이트 통계 카드에 간단 툴팁

### 수정 파일
| 파일 | 변경 |
|---|---|
| `src/components/CSVImportDialog.tsx` | tags/topics 통합, 전체 덮어쓰기, 스크롤 확대, 툴팁 추가 |

