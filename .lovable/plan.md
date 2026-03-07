

## 모바일 URL 입력 필드 포커스 문제 수정

### 원인 분석
`ScoreVariationItem` 컴포넌트가 `useSortable` (dnd-kit)로 감싸져 있고, 컨테이너 div에 `{...attributes}`가 spread되어 있음. 이 attributes에는 터치 이벤트 핸들러가 포함되어 있어, 모바일에서 URL Input을 탭할 때 sortable 컨테이너가 터치 이벤트를 가로채면서 키보드가 열렸다가 포커스를 잃고 닫히는 현상 발생.

### 변경 사항

**파일: `src/components/SongDialog.tsx`**

URL Input (line 840-846)에 `onPointerDown` 및 `onTouchStart` 이벤트 전파 차단 추가:

```tsx
<Input
  type="url"
  placeholder={...}
  value={urlInput}
  onChange={(e) => setUrlInput(e.target.value)}
  className="flex-1"
  onPointerDown={(e) => e.stopPropagation()}
  onTouchStart={(e) => e.stopPropagation()}
/>
```

이렇게 하면 dnd-kit의 PointerSensor가 Input 터치를 드래그로 인식하지 않아 모바일에서 정상적으로 포커스 유지 및 붙여넣기가 가능해짐.

