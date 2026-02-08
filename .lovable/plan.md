
# 인도자 선택 악보 키(`score_key`)가 DB에 저장되지 않는 문제 수정

## 발견된 문제

### 핵심 버그: `score_key`가 DB에 저장되지 않음

**현재 상황:**
- "내 영혼은 안전합니다" 곡에 A, E, F, G 키 악보가 모두 있음
- 인도자가 SetBuilder에서 악보 키를 선택함
- 하지만 DB 레코드: `score_key = NULL`

**원인 분석:**

```text
┌─────────────────────────────────────────────────────────────────────┐
│ SetSongItem.tsx                                                     │
│ handleKeyVariationChange() → { score_key: selectedKey }             │
│                              ✅ 로컬 상태에 저장                     │
└───────────────────────────────┬─────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ SetBuilder.tsx                                                      │
│ handleUpdateItem() → items 상태 업데이트                             │
│                      ✅ score_key 포함                               │
└───────────────────────────────┬─────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ useAutoSaveDraft.ts                                                 │
│ upsertSongsAndComponents()                                          │
│                                                                     │
│ const songData = {                                                  │
│   key: item.data.key,                                               │
│   override_score_file_url: item.data.override_score_file_url,       │
│   // score_key: ❌ 누락됨!                                           │
│ };                                                                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ set_songs 테이블                                                     │
│ score_key = NULL  ❌                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

**데이터베이스 증거:**
```sql
-- "내 영혼은 안전합니다" 세트 곡 레코드
score_key: NULL       ❌ (저장 안됨)
performance_key: E    ✅ (저장됨)
override_score_file_url: NULL
```

---

## 수정 계획

### 1. `upsertSongsAndComponents`에 `score_key` 추가

**파일**: `src/hooks/useAutoSaveDraft.ts`

**라인 393-406 수정:**

```typescript
const songData = {
  service_set_id: setId,
  song_id: item.data.song_id || item.data.song?.id,
  position,
  key: item.data.key || item.data.song?.default_key,
  key_change_to: item.data.key_change_to || null,
  custom_notes: item.data.custom_notes || "",
  override_score_file_url: item.data.override_score_file_url || null,
  override_youtube_url: item.data.override_youtube_url || null,
  lyrics: item.data.lyrics || null,
  bpm: item.data.bpm || null,
  time_signature: item.data.time_signature || null,
  energy_level: item.data.energy_level || null,
  score_key: item.data.score_key || null,  // ✅ 추가!
};
```

### 2. `getItemsSignature`에 `score_key` 추가 (변경 감지용)

**파일**: `src/hooks/useAutoSaveDraft.ts`

**라인 69-85 수정:**

`score_key`가 변경되었을 때 자동 저장이 트리거되도록 시그니처에 포함:

```typescript
return {
  type: "song" as const,
  localId: item.id,
  position,
  song_id: songId,
  key: item.data.key ?? item.data.song?.default_key ?? null,
  key_change_to: item.data.key_change_to ?? null,
  custom_notes: item.data.custom_notes ?? "",
  override_score_file_url: item.data.override_score_file_url ?? null,
  override_youtube_url: item.data.override_youtube_url ?? null,
  lyrics: item.data.lyrics ?? null,
  bpm: item.data.bpm ?? null,
  time_signature: item.data.time_signature ?? null,
  energy_level: item.data.energy_level ?? null,
  score_key: item.data.score_key ?? null,  // ✅ 추가!
};
```

---

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/hooks/useAutoSaveDraft.ts` | `score_key` 저장 및 변경 감지 로직 추가 |

---

## 결과 비교

| 시나리오 | Before | After |
|---------|--------|-------|
| 인도자가 G키 악보 선택 | `score_key=NULL`, DB 저장 안됨 | `score_key=G`, DB에 저장됨 ✅ |
| 악보만 인쇄 | E키 악보 출력 (key fallback) | G키 악보 출력 ✅ |
| 전체화면 보기 | E키 악보 표시 (key fallback) | G키 악보 표시 ✅ |
| 기존 레코드 수정 | `score_key` 유지 안됨 | `score_key` 정상 업데이트 ✅ |

---

## 참고: 이미 올바르게 구현된 부분

다음 파일들은 이미 `score_key`를 올바르게 사용하도록 구현됨:

- **SetSongItem.tsx**: `handleKeyVariationChange`에서 `score_key` 저장 ✅
- **BandView.tsx**: `score_key || key` 우선순위 사용 ✅
- **PrintOptionsDialog.tsx**: `score_key || key || default_key` 우선순위 사용 ✅

**유일한 문제**: 저장 함수에서 `score_key`가 누락되어 DB에 저장되지 않음

---

## 기술적 세부 사항

### 변경 1: getItemsSignature (라인 69-86)

```typescript
// Before
return {
  type: "song" as const,
  // ... 기존 필드들
  energy_level: item.data.energy_level ?? null,
};

// After  
return {
  type: "song" as const,
  // ... 기존 필드들
  energy_level: item.data.energy_level ?? null,
  score_key: item.data.score_key ?? null,  // 추가
};
```

### 변경 2: upsertSongsAndComponents songData (라인 393-406)

```typescript
// Before
const songData = {
  // ... 기존 필드들
  energy_level: item.data.energy_level || null,
};

// After
const songData = {
  // ... 기존 필드들
  energy_level: item.data.energy_level || null,
  score_key: item.data.score_key || null,  // 추가
};
```
