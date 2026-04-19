
## 검토 결과

iOS 상단 안전영역(노치/Dynamic Island) 관련 신규 변경 점검:

### 문제 지점
**`src/components/SongDialog.tsx` (line 543-546)** — 새 곡(SmartSongFlow) 케이스에서:
```tsx
paddingTop: !song ? '0' : 'max(1rem, env(safe-area-inset-top, 0px))'
```
새 곡일 때 `paddingTop: '0'`으로 강제 → iOS에서 다이얼로그가 `h-[90dvh]`로 큰데 상단 safe-area를 무시. 노치/Dynamic Island가 다이얼로그 헤더("새 곡", 진행바)를 가릴 수 있음.

**`src/components/songs/SmartSongFlow.tsx` 내부 헤더 (line 433)**:
```tsx
<div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
```
자체 safe-area top 처리 없음 (다이얼로그 컨테이너에 의존).

다른 최근 변경(SongLibrary 액션바 자동 스크롤, 카드 뷰 default, 썸네일 클릭 → 편집)은 모두 페이지 본문 내부에 있어 `AppHeader`의 기존 `safe-top` 처리로 보호됨 → **OK**.

푸터는 이미 `paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))'`로 올바름 → **OK**.

기존 `Sheet`, `AlertDialog`, `MusicPlayerMode` 등은 이미 `env(safe-area-inset-top)`을 적용 → 패턴 일치.

## 변경 계획

### `src/components/SongDialog.tsx` (line 543-546)
SmartSongFlow(새 곡/draft) 케이스에서도 상단 safe-area를 적용. 다이얼로그가 90dvh로 거의 풀스크린이므로 노치 회피 필수:

```tsx
style={{
  paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
  paddingBottom: !song ? '0' : 'max(1rem, env(safe-area-inset-bottom, 0px))'
}}
```
(SmartSongFlow는 자체 footer에서 bottom safe-area를 처리하므로 새 곡일 때 컨테이너 bottom은 0 유지.)

### `src/components/songs/SmartSongFlow.tsx` 내부 헤더 (line 433)
방어적으로 한 번 더: 컨테이너에서 이미 처리되지만, 다이얼로그 외 컨텍스트에서 재사용될 가능성을 고려해 헤더에도 작은 안전장치 추가:

```tsx
<div 
  className="flex items-center justify-between px-4 py-3 border-b shrink-0"
  style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
>
```
※ 부모(`DialogContent`)가 이미 safe-area paddingTop을 가지면 `max()`가 알아서 더 큰 값을 사용 — 중복 누적 안 됨.

### 회귀 점검 (변경 없음, 확인만)
- `SongLibrary.tsx` 액션바 자동 스크롤: `AppLayout` → `AppHeader`(이미 safe-top 처리)로 감싸짐 → OK.
- 카드 뷰 / 썸네일 → 편집 다이얼로그 변경: `SongDialog` 사용 → 위 수정으로 함께 해결.
- 데스크탑/Android: `env(safe-area-inset-top)`은 0이므로 영향 없음.

## 영향 파일
- `src/components/SongDialog.tsx` — 1줄 (paddingTop 식 수정)
- `src/components/songs/SmartSongFlow.tsx` — 1줄 (헤더 inline style 추가)

데이터/로직/번역 변경 없음. iOS 노치 안전영역 보강만.
