

# Phase K — Studio UI 종합 개선 (7가지)

## K-1. 새 공간 팝업 버그 수정
**File**: `src/components/worship-studio/spaces/SpaceTabBar.tsx` (lines 149-157)

현재 코드는 `spaces.length === 0` 조건이 있지만, spaces 로딩 타이밍 이슈로 매번 열릴 수 있음. 수정:
- `spaces.length > 0`이면 즉시 return
- localStorage 키를 roomId 없이 단순화: `kworship-studio-setup-seen`
- isLoading 상태도 체크하여 로딩 중에는 팝업 안 열기

## K-2. 아파트 패널 비주얼 개선
**File**: `src/components/worship-studio/StudioSidePanel.tsx`

- **너비**: `w-56` → `w-64` (expanded)
- **간판**: 🌿🌳🌿 rooftop garden (lines 76-82) 제거, 대신 `"K-Worship Studio"` 간판 텍스트 (`text-[9px] font-bold tracking-widest text-amber-800/70`)
- **도로 바 개선** (lines 302-309):
  - `h-6` → 인도 `h-2 bg-[#a89070]` + 도로 `h-8 bg-[#4a4a4a]` 분리
  - 인도에 🌳 2-3개 (`text-[10px]`)
  - 도로에 차량 이모지 4개: 🚗🚙🚕🚌 다양한 위치에 배치
- **창문 라이트**: `StudioUnit.tsx`의 WindowLights에서 gap 촘촘하게 (`gap-0.5` → `gap-px`), 창문 수 2→3개로 증가

## K-3. 블록 드래그 핸들 개선
**File**: `src/components/worship-studio/spaces/SpaceBlock.tsx`

현재 `borderLeftWidth: 4`로 4px 색상 탭 → 드래그하기 어려움. 수정:
- 편집 모드일 때 별도의 드래그 핸들 div 추가 (블록 왼쪽, `w-5`)
- `cursor-grab active:cursor-grabbing hover:brightness-110`
- 핸들에만 `onPointerDown` 바인딩 (기존 블록 전체 드래그 대신)
- `borderLeftWidth: 4` 유지하되, 핸들 div가 그 위에 absolute로 겹침
- 비편집 모드: 핸들 숨김

## K-4. YouTube 블록 고급 설정
**Files**: `YoutubeBlock.tsx`, `BlockSettingsPanel.tsx`

YoutubeBlock에서 content에서 설정값 읽어서 embed URL 쿼리스트링 생성:
- `autoplay`, `mute`, `controls` (반전: hideControls→controls=0), `rel`, `loop`
- embed URL: `https://www.youtube.com/embed/${videoId}?autoplay=${...}&mute=${...}&controls=${...}&rel=${...}&loop=${...}&playlist=${videoId}`

BlockSettingsPanel의 youtube case에 Switch 토글 5개 추가 (2열 그리드):
- 자동재생, 음소거, 컨트롤 숨기기, 관련영상 숨기기, 반복재생

## K-5. 이미지 블록 파일 업로드
**Files**: `PhotoBlock.tsx`, `BlockSettingsPanel.tsx`

- DB migration: `block-uploads` storage bucket 생성 (public) + RLS policies
- BlockSettingsPanel photo case에 "파일 업로드" 버튼 추가
- hidden `<input type="file" accept="image/*">` + 버튼 클릭 트리거
- 업로드: `supabase.storage.from('block-uploads').upload(path, file)`
- 업로드 완료 → `getPublicUrl` → `onChange({ image_url: publicUrl })`
- 로딩 상태 표시

## K-6. 파일 블록 파일 업로드
**File**: `BlockSettingsPanel.tsx`

BlockSettingsPanel file case에 "📎 파일 업로드" 버튼 추가:
- hidden `<input type="file">` → `block-uploads` 버킷 업로드
- 업로드 완료 → `onChange({ file_url, filename, icon: guessIcon(ext) })`
- `guessIcon`: pdf→document, jpg/png→image, mp3/wav→audio, mp4→video, else→default
- FileDownloadBlock: 파일 크기 표시 (`content.file_size`)

## K-7. 링크 블록 색상 팔레트 확대
**File**: `BlockSettingsPanel.tsx` (link case, lines 172-188)

현재 4색 → 9색으로 확대:
- `["#3a6b8a", "#b8902a", "#4a7c6a", "#cc3333", "#7c6a9e", "#e8719e", "#4a4a4a", "#ffffff", "#1a1a1a"]`
- 흰색(`#ffffff`)은 border 추가 표시
- 선택된 색상에 체크마크 또는 ring 표시

---

## Database Migration (K-5, K-6 공통)
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('block-uploads', 'block-uploads', true);

CREATE POLICY "Anyone can read block uploads" ON storage.objects FOR SELECT USING (bucket_id = 'block-uploads');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'block-uploads');
CREATE POLICY "Users can delete own uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'block-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## 수정 파일 요약
| File | Changes |
|---|---|
| `SpaceTabBar.tsx` | K-1: 팝업 조건 강화 |
| `StudioSidePanel.tsx` | K-2: 너비, 간판, 도로 바, 나무 |
| `StudioUnit.tsx` | K-2d: 창문 수 증가 |
| `SpaceBlock.tsx` | K-3: 드래그 핸들 div |
| `YoutubeBlock.tsx` | K-4: 설정 기반 embed URL |
| `BlockSettingsPanel.tsx` | K-4, K-5, K-6, K-7: 토글, 업로드, 색상 |
| `PhotoBlock.tsx` | K-5: (변경 없을 수 있음, URL만 반영) |
| `FileDownloadBlock.tsx` | K-6: 파일 크기 표시 |
| DB migration | Storage bucket + RLS |

