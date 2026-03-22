

## 플랫폼 전체 한/영 번역 감사 및 보완

### 문제점
다수의 컴포넌트에서 한국어 문자열이 하드코딩되어 있어 영어 모드에서도 한국어가 표시됩니다. 특히 최근 추가/수정된 곡 추가(SmartSongFlow), 곡 검색(SmartSongEntry), 세트 추가(AddToSetDialog) 등이 전혀 번역되지 않았습니다.

### 작업 범위

총 **4개 파일** 수정 + **translations.ts** 키 추가

---

#### 1. `src/lib/translations.ts` — 새 번역 키 추가

**`songFlow` 섹션 (신규)** — SmartSongFlow 전용 (~60개 키)

| 카테고리 | 주요 키 |
|---------|--------|
| Step Labels | songInfo, youtube, scoresLinks, lyrics, languageTopics, review |
| Step 1 | songTitle, subtitle, subtitleHint, privateSong, privateDesc |
| Step 2 | searchingYoutube, editSearch, searchPlaceholder, searchResults, open, selected, artist, selectArtist, youtubeChannel |
| Step 3 | youtubeLinks, labelPlaceholder, addYoutubeLink, scores, keySelect, scoreUpload, uploading, imageUrlPaste, download, addScoreVariation, autoScanNote |
| Step 4 | originalComposer, composerPlaceholder, composerHint, autoSearchLyrics, searchingLyrics, lyricsFound, candidatesFound, candidatesFailed, noLyricsFound, composerTip, enterManually, lyricsLabel, lyricsPlaceholder, notesLabel, notesPlaceholder |
| Step 5 | language, languageSelect, topicsLabel, topicsHint, analyzingTopics |
| Step 6 (Review) | artistAndComposer, notEntered, noKey, pages, none, edit |
| Navigation | cancel, previous, draftSave, draftSaved, next, save, newSong |
| Errors/Toasts | enterTitle, selectLanguage, minTopics, uploadComplete, uploadError, downloadComplete, downloadFailed, saveError, draftSaveError, searchError, lyricsSearchError, searchTimeout |
| Cancel Dialog | cancelTitle, cancelDesc, continueWriting, confirmCancel |

**`addToSet` 섹션 (신규)** — AddToSetDialog 전용 (~15개 키)

| 키 | EN | KO |
|---|---|---|
| title | Add to Worship Set | 워십세트에 추가 |
| description | Add selected songs to a new or existing set | 선택한 곡을 새 워십세트에 추가하거나 기존 세트에 추가할 수 있습니다 |
| selectedSong / selectedSongs | Selected song: / Selected songs ({count}): | 선택한 곡: / 선택한 곡 ({count}곡): |
| noSongsSelected | No songs selected | 선택된 곡이 없습니다 |
| currentEditingSet | Currently editing set | 현재 편집 중인 세트 |
| createNewSet | Create new worship set | 새 워십세트 만들기 |
| addToOtherSet | Add to another set: | 다른 워십세트에 추가: |
| leaderTbd | Leader TBD | 인도자 미정 |
| adding | Adding... | 추가 중... |
| addButton | Add | 추가하기 |
| permissionError | Cannot add. Check permissions. | 워십세트에 추가할 수 없습니다. 권한을 확인해주세요. |

**`smartSongEntry` 섹션 (신규)** — SmartSongEntry 전용 (~10개 키)

---

#### 2. `src/components/songs/SmartSongFlow.tsx` — 전체 번역 적용

- `useTranslation()` 활용하여 모든 하드코딩 한국어를 `t("songFlow.xxx")` 또는 `language === "ko" ? ... : ...` 패턴으로 교체
- 대상: stepLabels, 헤더, 모든 Label/placeholder/Button 텍스트, toast 메시지, AlertDialog, Step1~6 내부 텍스트 전부
- 약 **80곳** 이상의 하드코딩 문자열 교체

#### 3. `src/components/songs/SmartSongEntry.tsx` — 전체 번역 적용

- `useTranslation()` 추가
- 모든 Label, placeholder, Button, toast, 상태 텍스트 번역 (~15곳)

#### 4. `src/components/AddToSetDialog.tsx` — 전체 번역 적용

- `useTranslation()` 추가
- DialogTitle, Description, Button, toast, RadioGroup 라벨 전부 번역 (~15곳)

### 구현 방식
- 기존 `language === "ko" ? ... : ...` 패턴이 많이 사용되고 있으므로 같은 패턴 유지 (일부는 `t()` 함수 사용)
- translations.ts에 새 섹션 추가 후 컴포넌트에서 참조

### 범위 밖 (이번에 다루지 않음)
- Admin 전용 페이지 (AdminFeatures, EmailSettings 등) — 이미 `language === "ko"` 패턴으로 번역됨
- worship-studio 내부 위젯 — 이미 번역됨

