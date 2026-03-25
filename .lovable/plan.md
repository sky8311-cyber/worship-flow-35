

## 두 가지 수정: PDF 악보 업로드 + ArtistSelector 버그

### 1. PDF → 이미지 변환 악보 업로드

**현재**: `accept="image/*,.pdf"`로 PDF 선택은 가능하지만, PDF를 그대로 저장하여 썸네일 미리보기가 안 되고 다중 페이지를 처리하지 않음.

**수정 방법**:

**A. Edge Function 생성**: `convert-pdf-to-images`
- PDF 파일을 받아서 각 페이지를 이미지(PNG)로 변환
- `pdf-lib` 또는 `pdfjs-dist`로 페이지 수 추출 후, 각 페이지를 렌더링
- 실질적으로 Deno 환경에서는 `pdf.js` (pdfjs-dist)를 사용하여 각 페이지를 canvas로 렌더링 → PNG로 변환
- 변환된 이미지들을 `scores` 버킷에 업로드
- 각 이미지의 public URL 배열을 반환

**B. `SmartSongFlow.tsx`의 `uploadScoreFile` 함수 수정**:
- 파일이 PDF인 경우 (`file.type === 'application/pdf'`):
  - Edge Function `convert-pdf-to-images` 호출
  - 반환된 이미지 URL 배열을 해당 variation의 files에 순서대로 추가 (각각 page 번호 할당)
- 이미지 파일인 경우: 기존 로직 유지 (직접 storage 업로드)

**C. `SongDialog.tsx`에도 동일 로직 적용** (레거시 곡 편집 다이얼로그에도 PDF 지원)

### 2. ArtistSelector "새 아티스트 추가" 버그 수정

**원인**: `CommandEmpty`는 `CommandGroup` 안에 매칭 항목이 **0개**일 때만 표시됨. 검색어가 기존 아티스트와 부분 일치하면 `filteredArtists`가 비어있지 않아서 `CommandEmpty`가 안 보이고, "Add new" 버튼도 사라짐.

**수정**: `CommandEmpty` 안에 넣지 말고, **항상 표시되는 별도 항목으로** "새 아티스트 추가" 옵션을 `CommandGroup` 안에 추가.

```tsx
<CommandGroup>
  {showAddNew && (
    <CommandItem value={`__add_new__${searchValue}`} onSelect={handleAddNew}>
      <Plus className="mr-2 h-4 w-4" />
      {t("artistSelector.addNew")}: "{searchValue}"
    </CommandItem>
  )}
  {filteredArtists.map((artist) => (
    <CommandItem key={artist} value={artist} onSelect={() => handleSelect(artist)}>
      ...
    </CommandItem>
  ))}
</CommandGroup>
```

`CommandEmpty`는 검색 결과도 없고 추가할 것도 없을 때만 "아티스트를 찾을 수 없습니다" 표시.

### 수정 파일 요약
1. `supabase/functions/convert-pdf-to-images/index.ts` — 새 Edge Function
2. `src/components/songs/SmartSongFlow.tsx` — `uploadScoreFile`에 PDF 분기 추가
3. `src/components/ArtistSelector.tsx` — "Add new" 버튼을 `CommandGroup` 안으로 이동

