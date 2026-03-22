

## Step 2 아티스트 선택 UX 개선

### 문제점
1. 유튜브 선택 시 채널명이 자동으로 아티스트에 들어가서, 사용자가 아티스트 확인 없이 "다음" 클릭
2. 채널명이 실제 아티스트명과 다른 경우가 많음 (예: "마커스워십" vs "Markers 워십")
3. 아티스트 필드가 화면 하단에 있어 인지하지 못하고 넘어감

### 변경 내용

**파일: `src/components/songs/SmartSongFlow.tsx`**

#### 1. 유튜브 선택 시 아티스트 자동입력 제거
- `handleSelectYoutubeResult`에서 `setArtist(result.channelTitle)` 제거
- 아티스트 필드는 항상 빈 상태로 유지 → 사용자가 직접 입력/선택

#### 2. 유튜브 선택 후 아티스트 입력 강제
- 유튜브를 선택하면 아티스트 영역으로 자동 스크롤 (`scrollIntoView`)
- 아티스트 영역에 시각적 강조 (하이라이트 애니메이션)
- 참고로 채널명은 힌트 텍스트로 표시: "YouTube 채널: {channelTitle}"

#### 3. 아티스트 필드를 항상 ArtistSelector (드롭다운) 사용
- 기존: 유튜브 선택 시 → 텍스트 표시 + "수정" 버튼 / 미선택 시 → ArtistSelector
- 변경: **항상 ArtistSelector** 사용 (기존 아티스트 목록에서 검색/선택 또는 새로 추가)
- `manualArtistMode` 상태 불필요 → 제거

#### 4. Step 2 UI 변경

```text
[YouTube 검색 결과...]

─── 아티스트 ───────────────────────
ℹ️ YouTube 채널: 마커스워십 Official
[ArtistSelector 드롭다운: 검색/선택/새로추가]
```

### 기술 상세
- `useRef`로 아티스트 영역에 ref 추가, 유튜브 선택 시 `ref.current.scrollIntoView({ behavior: 'smooth' })`
- Step2_YouTube에서 `manualArtistMode` 관련 분기 제거, 항상 `<ArtistSelector>` 렌더링
- 채널명은 `selectedResult.channelTitle`을 정보 텍스트로만 표시

