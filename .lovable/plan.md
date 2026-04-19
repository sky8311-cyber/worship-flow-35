
## 작업 이해

이미지의 곡 카드는 모바일에서 [숫자 배지 `2 ↕`] 옆에 [제목/아티스트/태그/키 입력 등]이 옆으로 붙어 있어서 좌측 큰 배지가 공간을 잡아먹음. → 모바일에서는 숫자 배지를 **첫 줄 단독**(자체 행)으로 배치하고, 그 아래부터 곡 제목/메타/입력 영역이 **풀 너비**로 흐르게 변경.

데스크탑에서는 기존 좌-우 레이아웃 유지.

## 변경 계획

**파일:** `src/components/set-builder/SetSongItem.tsx` (그리고 필요시 컴포넌트 항목용 `SetComponentItem.tsx` 동일 패턴)

1. 카드 최상위 컨테이너를 `flex flex-row`(가로) → `flex flex-col md:flex-row`(모바일 세로, 데스크탑 가로)로 변경
2. 숫자 배지(`2 ↕`)와 우측 액션 버튼들(연필/X)이 같은 행에 보이도록, 모바일에서는 **첫 줄 = `flex justify-between` 헤더**:
   - 좌: 숫자 배지
   - 우: 편집/삭제 아이콘 버튼
3. 두 번째 줄부터는 곡 제목/아티스트/태그/키 입력/진행설정 등 모든 콘텐츠가 풀 너비
4. 데스크탑(`md:`)에서는 기존 레이아웃 복원: 숫자 좌측 고정, 콘텐츠 가운데, 액션 우측

## 탐색 필요

- `SetSongItem.tsx` 현재 최상위 컨테이너 구조 확인
- 액션 버튼(연필/X) 위치 확인 — 현재 우측 상단에 절대배치인지, flex item인지
- `SetComponentItem.tsx`도 같은 패턴 적용 여부 (이미지엔 곡만 보이지만 일관성 위해)

## 구현 패턴 (예상)

```tsx
// 모바일: 헤더 행(숫자 + 액션) → 본문 / 데스크탑: 가로 정렬
<div className="border rounded-lg p-3 md:p-4">
  <div className="flex flex-col md:flex-row md:items-start md:gap-3">
    {/* Row 1 모바일 = 숫자 + 액션, 데스크탑 = 좌측 숫자만 */}
    <div className="flex items-center justify-between md:justify-start md:flex-col md:gap-2 mb-2 md:mb-0">
      <Badge>{index + 1} ↕</Badge>
      <div className="flex gap-1 md:hidden">
        <EditButton /><DeleteButton />
      </div>
    </div>

    {/* 본문: 풀 너비 */}
    <div className="flex-1 min-w-0">
      <h4>{title}</h4>
      <p>{artist}</p>
      {/* 태그, 키 입력, 진행설정 ... */}
    </div>

    {/* 데스크탑 전용 우측 액션 */}
    <div className="hidden md:flex gap-1">
      <EditButton /><DeleteButton />
    </div>
  </div>
</div>
```

## 영향 파일
1. `src/components/set-builder/SetSongItem.tsx` — 레이아웃 재구성 (모바일 세로 / 데스크탑 가로)
2. (선택) `src/components/set-builder/SetComponentItem.tsx` — 동일 패턴 적용해 일관성 유지

데이터/로직 변경 없음. 순수 레이아웃 CSS 변경. 승인 시 구현하면서 정확한 현재 구조 확인 후 적용.
