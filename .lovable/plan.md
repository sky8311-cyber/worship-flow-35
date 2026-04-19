
## 문제 진단

`src/pages/SongLibrary.tsx` 110번 줄에 `searchRef`는 선언되어 있고 119~124번 줄 useEffect에서 `searchRef.current?.scrollIntoView(...)`를 호출하지만, **JSX 어디에도 `ref={searchRef}`가 부착되어 있지 않음**. 따라서 `searchRef.current`는 항상 `null`이고 자동 스크롤이 실제로는 일어나지 않음.

## 변경 계획

### `src/pages/SongLibrary.tsx`

547번 줄의 상단 액션/검색 카드에 ref 부착:

```tsx
// before
<Card className="shadow-md mb-6">

// after  
<Card ref={searchRef} className="shadow-md mb-6">
```

이렇게 하면 카트에 곡이 추가될 때 useEffect가 검색/액션 버튼을 포함한 카드 전체를 화면 상단으로 부드럽게 스크롤시킴.

### 검증 포인트
- shadcn `Card` 컴포넌트는 `forwardRef`로 만들어져 있어 ref 전달이 정상 동작함 (확인됨, 표준 shadcn 패턴).
- 기존 prevCartCountRef 비교 로직(증가 시에만 스크롤, 첫 마운트 시 스크롤 안 함)은 그대로 유지.

## 영향 파일
- `src/pages/SongLibrary.tsx` — 한 줄 변경 (Card에 `ref={searchRef}` 추가)

데이터/스키마/번역 변경 없음.
