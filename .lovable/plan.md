
# 인도자 선택 악보가 인쇄/전체화면에 반영되도록 수정

## 발견된 문제

### 문제: 악보 키 선택 UI와 저장 로직 불일치

**SetSongItem.tsx (인도자 악보 선택 화면):**

```typescript
// 현재 코드 - 문제
value={keyVariations.find(v => v.scoreUrl === setSong.override_score_file_url)?.key || keyVariations[0]?.key || ""}
```

- `override_score_file_url`을 기준으로 현재 선택된 키를 표시
- 하지만 저장할 때는 `score_key`를 저장함
- 결과: UI 표시와 저장 값이 불일치할 수 있음

**BandView/PrintOptionsDialog:**
- `score_key || key`를 우선 사용하도록 되어 있어서 이 부분은 정상
- 하지만 `score_key`가 null인 레코드가 많아서 `key` (실제 연주키)가 사용됨

---

## 수정 계획

### 1. SetSongItem.tsx - Select value 수정

**파일**: `src/components/SetSongItem.tsx`

현재 선택된 악보 키를 `score_key`를 우선 사용하여 표시:

```typescript
// Before (라인 196)
value={keyVariations.find(v => v.scoreUrl === setSong.override_score_file_url)?.key || keyVariations[0]?.key || ""}

// After
value={setSong.score_key || keyVariations.find(v => v.scoreUrl === setSong.override_score_file_url)?.key || keyVariations[0]?.key || ""}
```

### 2. 악보가 없는 키도 악보 선택에서 제외

현재 `keyVariations`에 악보가 없는 키(`scoreUrl: null`)도 포함될 수 있음.
실제로 악보가 있는 키만 선택 가능하도록 필터링:

```typescript
// keyVariations 생성 로직 수정
const keyVariations = useMemo(() => {
  const variations: { key: string; scoreUrl: string | null }[] = [];
  
  // song_scores에서 키별 악보 추가
  if (song?.song_scores && song.song_scores.length > 0) {
    const uniqueKeys = new Map<string, string>();
    song.song_scores.forEach((score: any) => {
      if (score.key && !uniqueKeys.has(score.key)) {
        uniqueKeys.set(score.key, score.file_url);
      }
    });
    uniqueKeys.forEach((url, key) => {
      variations.push({ key, scoreUrl: url });
    });
  }
  
  // 레거시 score_file_url이 있는 default_key 추가
  if (song?.default_key && song?.score_file_url && !variations.find(v => v.key === song.default_key)) {
    variations.unshift({ key: song.default_key, scoreUrl: song.score_file_url });
  }
  
  return variations;
}, [song]);
```

---

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/SetSongItem.tsx` | Select value에 `score_key` 우선 사용 + 악보 없는 키 필터링 |

---

## 상세 코드 변경

### SetSongItem.tsx

**라인 55-74: keyVariations useMemo 수정**

```typescript
const keyVariations = useMemo(() => {
  const variations: { key: string; scoreUrl: string }[] = [];
  
  // song_scores에서 악보가 있는 키만 추가
  if (song?.song_scores && song.song_scores.length > 0) {
    const uniqueKeys = new Map<string, string>();
    song.song_scores.forEach((score: any) => {
      if (score.key && score.file_url && !uniqueKeys.has(score.key)) {
        uniqueKeys.set(score.key, score.file_url);
      }
    });
    uniqueKeys.forEach((url, key) => {
      variations.push({ key, scoreUrl: url });
    });
  }
  
  // 레거시 score_file_url이 있는 경우에만 default_key 추가
  if (song?.default_key && song?.score_file_url && !variations.find(v => v.key === song.default_key)) {
    variations.unshift({ key: song.default_key, scoreUrl: song.score_file_url });
  }
  
  return variations;
}, [song]);
```

**라인 196: Select value 수정**

```typescript
// score_key 우선 사용
value={setSong.score_key || keyVariations.find(v => v.scoreUrl === setSong.override_score_file_url)?.key || keyVariations[0]?.key || ""}
```

---

## 결과 비교

| 시나리오 | Before | After |
|---------|--------|-------|
| 인도자가 G키 악보 선택 | score_key=G 저장, UI는 URL 기준 표시 | score_key=G 저장, UI도 G 표시 ✅ |
| 인쇄 시 | score_key가 null이면 key 사용 | score_key 우선 사용 ✅ |
| 전체화면 시 | score_key가 null이면 key 사용 | score_key 우선 사용 ✅ |
| 악보 없는 키 | 선택 가능 (문제) | 선택 불가 ✅ |

---

## 참고: 이미 올바르게 구현된 부분

**BandView.tsx (라인 423-425):**
```typescript
// Priority: score_key (leader's chosen score key) > key (performance key)
const leaderScoreKey = setSong.score_key || setSong.key;
const { scoreFiles, scoreKeyUsed } = getScoreFilesWithFallback(setSong.song_id, leaderScoreKey);
```

**PrintOptionsDialog.tsx (라인 188, 297):**
```typescript
// Priority: score_key (leader's chosen score key) > key (performance key)
const selectedKey = setSong.score_key || setSong.key || song?.default_key || "";
```

이 부분은 이미 `score_key`를 우선 사용하도록 구현되어 있어서 수정 불필요.
