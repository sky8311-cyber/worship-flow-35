

## Step 2에 제목 수정 기회 추가 + Step 3 악보 필수 검증

### 변경 사항

#### 1. Step 2에 제목 수정 필드 추가 (`SmartSongFlow.tsx`)

유튜브 선택 후, 아티스트 선택 바로 위에 **제목 확인/수정 영역** 추가:

```text
[YouTube 검색 결과...]

─── 제목 확인 ──────────────────────
"은혜 아니면" [수정 버튼]
  → 수정 클릭 시 Input으로 변환, 편집 가능

─── 아티스트 ───────────────────────
ℹ️ YouTube 채널: 마커스워십
[ArtistSelector 드롭다운]
```

- 유튜브 결과 선택 후 `selectedResult`가 있을 때만 표시
- 기본: 현재 `title` 값을 텍스트로 표시 + "수정" 버튼
- 수정 클릭 → Input으로 전환, 수정 완료 후 "확인" 버튼으로 저장
- `title` state를 직접 수정하므로 Step 1으로 돌아가지 않아도 됨

#### 2. Step 2 "다음" 조건 강화 (`canGoNext`)

- `case 2`: `selectedYoutubeResult`가 있고 `artist.trim()`이 있어야 다음 가능
- 누락 시 toast 에러 메시지 표시

#### 3. Step 3 악보 필수 검증 (`canGoNext`)

- `case 3`: `scoreVariations` 중 하나라도 `files.length > 0`인 것이 있어야 다음 가능
- YouTube 링크는 Step 2에서 이미 선택되므로 별도 검증 불필요
- 누락 시 toast: "악보를 최소 1개 업로드해주세요" / "Please upload at least one score"

#### 4. `translations.ts` 키 추가

| 키 | KO | EN |
|---|---|---|
| `songFlow.confirmTitle` | 제목 확인 | Confirm Title |
| `songFlow.editTitle` | 수정 | Edit |
| `songFlow.titleConfirmed` | 확인 | Confirm |
| `songFlow.selectYoutubeAndArtist` | 유튜브를 선택하고 아티스트를 입력해주세요 | Please select a YouTube video and enter the artist |
| `songFlow.uploadScoreRequired` | 악보를 최소 1개 업로드해주세요 | Please upload at least one score |

### 수정 파일
1. `src/components/songs/SmartSongFlow.tsx` — Step2에 제목 수정 UI, canGoNext 강화
2. `src/lib/translations.ts` — 새 키 추가

