
# 인도자 선택 악보 키가 저장/표시되지 않는 문제 완전 수정

## 문제 분석

### 핵심 원인: 게시된 세트에서 auto-save가 작동하지 않음

```text
현재 흐름:
┌─────────────────────────────────────────────────────────────────────┐
│ SetSongItem.tsx                                                     │
│ 인도자가 악보 키 F 선택 → handleKeyVariationChange()                │
│ → items 상태에 score_key: "F" 저장 ✅                               │
└───────────────────────────────┬─────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ useAutoSaveDraft.ts (라인 366)                                      │
│ enabled: status === "draft" && ...                                  │
│                                                                     │
│ 게시된(published) 세트 → enabled = false ❌                         │
│ → score_key가 DB에 저장되지 않음!                                   │
└───────────────────────────────┬─────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 데이터베이스 (set_songs 테이블)                                      │
│ score_key = NULL                                                    │
│ key = E (연주키만 저장됨)                                            │
└───────────────────────────────┬─────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ BandView.tsx / PrintOptionsDialog.tsx                               │
│ leaderScoreKey = score_key || key                                   │
│                = NULL || "E" = "E"                                  │
│ → E키 악보 표시 ❌                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 추가 문제: Band View에서 키 변경 시 인쇄/전체화면에 반영 안 됨

현재 Band View에서 화살표로 키를 바꿔도:
- `browsingKeyIndex` 상태만 변경됨 (로컬 상태)
- 인쇄/전체화면은 `score_key || key` 기준으로 별도 계산
- 둘이 연동되지 않음

---

## 해결 방안

### 방안 1: 게시된 세트에서도 score_key 변경 시 저장 (권장)

**수정 1: SetBuilder에서 score_key 변경 시 즉시 DB 업데이트**

세트가 published 상태여도 `score_key` 변경 시 직접 DB 업데이트:

```typescript
// SetSongItem.tsx 또는 SetBuilder.tsx
const handleKeyVariationChange = async (index: number, selectedKey: string, dbId?: string) => {
  // 1. 로컬 상태 업데이트 (기존)
  onUpdate(index, { 
    score_key: selectedKey,
    override_score_file_url: variation?.scoreUrl || null 
  });
  
  // 2. 게시된 세트라면 즉시 DB 업데이트
  if (dbId && status === "published") {
    await supabase
      .from("set_songs")
      .update({ score_key: selectedKey })
      .eq("id", dbId);
  }
};
```

**수정 2: saveSetMutation에서 score_key 포함 확인**

SetBuilder.tsx의 `saveSetMutation`에서도 `upsertSongsAndComponents` 호출 시 `score_key`가 저장되는지 확인 (이미 포함되어 있음 ✅).

---

### 방안 2: Band View 키 브라우징과 인쇄/전체화면 연동

**문제**: Band View에서 화살표로 키를 바꿔도 인쇄/전체화면에 반영 안 됨

**해결**: `browsingKeyIndex` 상태를 인쇄/전체화면 로직에도 적용

```typescript
// BandView.tsx - 기존 allScores 계산 로직 수정

// Before (라인 421-425):
setSongs?.forEach((setSong: any) => {
  const leaderScoreKey = setSong.score_key || setSong.key;
  ...
});

// After:
setSongs?.forEach((setSong: any) => {
  // 브라우징 키 인덱스가 있으면 그 키 사용, 없으면 리더 선택 키 사용
  const availableKeys = getAvailableKeysForSong(setSong.song_id);
  const currentKeyIdx = browsingKeyIndex[setSong.id];
  const leaderScoreKey = 
    (currentKeyIdx !== undefined && availableKeys[currentKeyIdx]) 
    || setSong.score_key 
    || setSong.key;
  ...
});
```

**PrintOptionsDialog에도 동일하게 browsingKeyIndex 전달:**

```typescript
<PrintOptionsDialog
  ...
  browsingKeyIndex={browsingKeyIndex}  // 추가
/>
```

---

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/SetBuilder.tsx` | 게시된 세트에서 score_key 변경 시 즉시 DB 업데이트 |
| `src/components/SetSongItem.tsx` | handleKeyVariationChange에 dbId 전달, 즉시 저장 로직 추가 |
| `src/pages/BandView.tsx` | allScores/인쇄/전체화면에 browsingKeyIndex 적용 |
| `src/components/band-view/PrintOptionsDialog.tsx` | browsingKeyIndex prop 추가 및 적용 |

---

## 상세 구현 계획

### 1. SetSongItem.tsx 수정

**Props 추가:**
```typescript
interface SetSongItemProps {
  // ... 기존 props
  dbId?: string;  // 게시된 세트에서 즉시 저장용
  status?: "draft" | "published";  // 세트 상태
}
```

**handleKeyVariationChange 수정:**
```typescript
const handleKeyVariationChange = async (selectedKey: string) => {
  const variation = keyVariations.find(v => v.key === selectedKey);
  
  // 로컬 상태 업데이트
  onUpdate(index, { 
    override_score_file_url: variation?.scoreUrl || null,
    score_key: selectedKey
  });
  
  // 게시된 세트라면 즉시 DB 업데이트
  if (dbId && status === "published") {
    const { error } = await supabase
      .from("set_songs")
      .update({ score_key: selectedKey })
      .eq("id", dbId);
    
    if (!error) {
      toast.success("악보 키가 저장되었습니다");
    }
  }
};
```

### 2. SetBuilder.tsx 수정

**SetSongItem에 dbId와 status 전달:**
```typescript
<SetSongItem
  key={item.id}
  setSong={item.data}
  index={index}
  totalCount={items.length}
  onRemove={handleRemoveItem}
  onUpdate={handleUpdateItem}
  onMoveUp={handleMoveUp}
  onMoveDown={handleMoveDown}
  dbId={item.dbId}        // 추가
  status={status}         // 추가
/>
```

### 3. BandView.tsx 수정

**allScores useMemo에 browsingKeyIndex 적용:**
```typescript
const allScores = useMemo(() => {
  const scores: Array<{...}> = [];

  setSongs?.forEach((setSong: any) => {
    const song = setSong.songs;
    
    // 브라우징 키 우선, 없으면 리더 선택 키
    const availableKeys = getAvailableKeysForSong(setSong.song_id);
    const currentKeyIdx = browsingKeyIndex[setSong.id];
    const leaderScoreKey = 
      (currentKeyIdx !== undefined && availableKeys[currentKeyIdx]) 
      || setSong.score_key 
      || setSong.key;
    
    const { scoreFiles, scoreKeyUsed } = getScoreFilesWithFallback(setSong.song_id, leaderScoreKey);
    // ... 기존 로직
  });

  return scores;
}, [setSongs, allSongScores, browsingKeyIndex]);  // browsingKeyIndex 의존성 추가
```

**PrintOptionsDialog에 browsingKeyIndex 전달:**
```typescript
<PrintOptionsDialog
  open={printDialogOpen}
  onOpenChange={setPrintDialogOpen}
  serviceSet={serviceSet}
  setSongs={setSongs || []}
  setComponents={setComponents || []}
  allSongScores={allSongScores || []}
  browsingKeyIndex={browsingKeyIndex}  // 추가
/>
```

### 4. PrintOptionsDialog.tsx 수정

**Props에 browsingKeyIndex 추가:**
```typescript
interface PrintOptionsDialogProps {
  // ... 기존 props
  browsingKeyIndex?: Record<string, number>;
}
```

**generatePrintHtml에서 browsingKeyIndex 적용:**
```typescript
// 라인 185-220 수정
setSongs.forEach((setSong) => {
  const song = setSong.songs;
  
  // 브라우징 키 우선, 없으면 리더 선택 키
  const songScores = allSongScores.filter((s) => s.song_id === setSong.song_id);
  const availableKeys = [...new Set(songScores.map(s => s.key))];
  const currentKeyIdx = browsingKeyIndex?.[setSong.id];
  const selectedKey = 
    (currentKeyIdx !== undefined && availableKeys[currentKeyIdx])
    || setSong.score_key 
    || setSong.key 
    || song?.default_key 
    || "";
  
  // ... 기존 로직
});
```

---

## 결과 비교

| 시나리오 | Before | After |
|---------|--------|-------|
| Set Builder에서 F키 선택 (게시된 세트) | score_key 저장 안됨 | score_key=F 즉시 저장 ✅ |
| Band View 기본 화면 | E키 악보 (fallback) | F키 악보 (저장된 score_key) ✅ |
| Band View에서 G키로 변경 | 화면만 변경, 인쇄는 E키 | 화면, 인쇄, 전체화면 모두 G키 ✅ |
| 악보 인쇄 | score_key NULL → E키 | 저장된 F키 또는 브라우징 키 ✅ |
| 전체화면 보기 | score_key NULL → E키 | 저장된 F키 또는 브라우징 키 ✅ |

---

## 기술적 고려사항

### 실시간 동기화 (realtime sync)
게시된 세트에서 score_key 변경 시:
- 직접 DB 업데이트 후 queryClient.invalidateQueries 호출
- 다른 Band View 세션에서도 변경 반영

### 히스토리 추적
score_key 변경은 set_audit_log에 기록되지 않음 (세트 메타데이터가 아닌 곡별 설정이므로)

### 성능
browsingKeyIndex를 useMemo 의존성에 추가하면 키 변경 시 allScores 재계산
→ 곡 수가 많아도 성능 영향 미미 (이미지 URL만 계산)
