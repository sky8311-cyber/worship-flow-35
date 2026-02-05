

# SongCard 비공개 뱃지 + 악보 미리보기 드롭다운 수정

## 문제 1: 비공개 뱃지가 제목을 가림

### 현재 상태 (스크린샷 참조)
```
┌─────────────────────────────────┐
│ [악보 이미지]                    │
├─────────────────────────────────┤
│ 주님... (N) 🔒 비공개            │  ← 뱃지가 같은 줄에 있어 제목 잘림
│ Gifted                          │
```

### 수정 후
```
┌─────────────────────────────────┐
│ [악보 이미지]                    │
├─────────────────────────────────┤
│                    🔒 비공개     │  ← 독립된 줄, 오른쪽 정렬
│ 주님의 임재 앞에서 (N)           │  ← 제목이 온전히 표시
│ Gifted                          │
```

### 코드 변경
```text
파일: src/components/SongCard.tsx (164-182번 줄)

변경 전:
<div className="mb-3">
  <div className="flex items-baseline gap-1.5 mb-1">
    <h3>...</h3>
    {isNewSong && <sup>N</sup>}
    {song.is_private && <Badge>비공개</Badge>}  ← 제목과 같은 줄
  </div>
  <p>{artist}</p>
</div>

변경 후:
<div className="mb-3">
  {/* 비공개 뱃지: 독립 행, 오른쪽 정렬 */}
  {song.is_private && (
    <div className="flex justify-end mb-1">
      <Badge>🔒 비공개</Badge>
    </div>
  )}
  <div className="flex items-baseline gap-1.5 mb-1">
    <h3>...</h3>
    {isNewSong && <sup>N</sup>}
    {/* 비공개 뱃지 제거됨 */}
  </div>
  <p>{artist}</p>
</div>
```

---

## 문제 2: 키 드롭다운 너비 부족 + 작동 안함

### 현재 상태
- 드롭다운 너비: `w-24 sm:w-32` (96px / 128px)
- 내용 예시: `A (1페이지)` → 잘려서 `A (1...` 로 표시
- 모바일에서 터치 영역이 좁아 클릭 어려움

### 수정 내용
```text
파일: src/components/ScorePreviewDialog.tsx (178번 줄)

변경 전:
<SelectTrigger className="w-24 sm:w-32">

변경 후:
<SelectTrigger className="w-36 sm:w-44">
```

- 모바일: 96px → 144px (w-36)
- 데스크톱: 128px → 176px (w-44)
- 이렇게 하면 `A (1페이지)`가 온전히 표시됨

---

## 수정 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/components/SongCard.tsx` | 비공개 뱃지를 제목 위 별도 줄로 이동, 오른쪽 정렬 |
| `src/components/ScorePreviewDialog.tsx` | SelectTrigger 너비 확대 (w-36 sm:w-44) |

---

## 예상 결과

| 항목 | 수정 전 | 수정 후 |
|-----|--------|--------|
| 제목 표시 | `주님...` (3글자만 보임) | `주님의 임재 앞에서` (전체 표시) |
| 비공개 뱃지 위치 | 제목과 같은 줄 | 독립 줄, 우측 정렬 |
| 키 드롭다운 | `A (1...` | `A (1페이지)` |
| 드롭다운 조작 | 터치 어려움 | 충분한 터치 영역 |

