

## 오딧 결과 + 편집 폼 필드 재정렬 제안

### Part 1: Publish 오딧 결과

Publish 플로우(`handleSmartFlowComplete`)를 검토한 결과, **심각한 버그는 없습니다.** 주요 확인 사항:

| 항목 | 상태 | 비고 |
|---|---|---|
| Draft → Published 업데이트 | ✅ | `status: "published"`, `draft_step: null` 올바르게 설정 |
| 신규 곡 Insert | ✅ | `created_by`, `status: "published"` 정상 |
| 악보 저장 (song_scores) | ✅ | 기존 삭제 후 재삽입 |
| YouTube 링크 저장 | ✅ | 기존 삭제 후 재삽입 |
| K-Seed 리워드 | ✅ | fire-and-forget으로 정상 처리 |
| "워십세트에 추가" 프롬프트 | ✅ | publish 후 정상 표시 |
| Validation | ⚠️ 경미 | 제목/언어/주제 체크는 있지만, artist 미입력은 허용 (의도적) |
| 에러 핸들링 | ✅ | try-catch + toast.error |

**경미한 개선점 1개**: `handleSmartFlowComplete`에서 scores/youtube 저장 실패 시 개별 에러 처리가 없음 (전체 try-catch에 포함되긴 함). 실질적 문제는 아님.

**결론: Publish 플로우는 정상 작동합니다.**

---

### Part 2: 편집 폼 필드 재정렬 제안

**현재 등록(SmartSongFlow) 순서:**
1. Title, Subtitle, Privacy
2. YouTube 검색 + Artist
3. 악보(Scores) + 추가 링크
4. 가사(Lyrics) + 메모(Notes)
5. 언어(Language) + 주제(Topics)
6. 리뷰

**현재 편집(SongDialog) 순서:**
1. Title → 2. Subtitle → 3. Artist → 4. Language → 5. Topics → 6. Private → 7. Scores → 8. YouTube → 9. Notes → 10. Lyrics

**제안하는 편집 폼 순서** (등록 흐름과 일치하도록):

| 순서 | 필드 | 등록 대응 |
|---|---|---|
| 1 | Title | Step 1 |
| 2 | Subtitle | Step 1 |
| 3 | Private toggle | Step 1 |
| 4 | Artist | Step 2 |
| 5 | YouTube Links | Step 2-3 |
| 6 | Scores (Key/악보) | Step 3 |
| 7 | Lyrics | Step 4 |
| 8 | Notes | Step 4 |
| 9 | Language | Step 5 |
| 10 | Topics | Step 5 |

### 수정 파일

| 파일 | 변경 |
|---|---|
| `src/components/SongDialog.tsx` | 편집 폼의 필드 순서를 위 표대로 재정렬 (코드 블록 순서만 변경, 로직 변경 없음) |

