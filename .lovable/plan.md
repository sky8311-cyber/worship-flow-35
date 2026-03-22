

## Step 3 유효성 검사 개선 + 유튜브 라벨 확인

### 1. Step 3 "다음" 버튼 — 키 미선택 시 에러 메시지 추가

**파일:** `src/components/songs/SmartSongFlow.tsx`

**현재 (line 315):**
```tsx
case 3: return scoreVariations.some(v => v.files.length > 0);
```
- 악보 파일만 체크, 키 선택 여부는 미검증

**변경:**
```tsx
case 3: return scoreVariations.some(v => v.files.length > 0 && v.key);
```

**handleNext 에러 메시지 (line 325):**
현재 하나의 메시지만 표시. 조건 분기 추가:
```tsx
if (currentStep === 3) {
  const hasFiles = scoreVariations.some(v => v.files.length > 0);
  const hasKey = scoreVariations.some(v => v.key);
  if (!hasKey) toast.error("키를 선택하세요");
  if (!hasFiles) toast.error("악보를 업로드하세요");
}
```
→ 두 가지 모두 누락이면 두 메시지 순차 표시

### 2. 유튜브 링크 라벨 — 현재 동작 설명

**라벨을 안 넣으면:**
- BandView (line 968): `youtubeLinks[0].label && (...)` → 빈 문자열이면 라벨 텍스트 자체가 표시되지 않음
- iframe title은 `youtubeLinks[0].label || song?.title` → 곡 제목이 fallback으로 사용됨
- **결론: 라벨 없으면 밴드뷰에서 유튜브 영상 위에 아무 텍스트도 안 뜸** (영상은 정상 재생)

라벨이 없을 때 기본값을 자동으로 넣을지는 사용자 판단에 맡김 (현재는 선택사항).

### 수정 파일
1. `src/components/songs/SmartSongFlow.tsx` — `canGoNext` 키 검증 추가 + 구체적 에러 메시지

