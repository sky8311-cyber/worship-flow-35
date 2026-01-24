
# 워십세트 빌더 UX 개선

## 문제점 요약

사용자가 보고한 3가지 이슈:

```text
1. 순서 추가 후 자동 스크롤 없음
   ┌─────────────────────────────────┐
   │ 곡 1                            │
   │ 곡 2                            │  ← 화면에 보이는 영역
   │ 곡 3                            │
   ├─────────────────────────────────┤
   │ ...                             │
   │ 새로 추가된 곡 ← 보이지 않음!    │  ← 스크롤 필요
   └─────────────────────────────────┘
   → 사용자가 추가됐는지 모르고 버튼 여러 번 클릭

2. 악보 프리뷰가 새 창에서 열림
   SongDialog에서 악보 썸네일 클릭 시:
   현재: window.open(file.url, "_blank") → 새 탭/창
   개선: ScorePreviewDialog 사용 → 앱 내 다이얼로그

3. 유튜브 썸네일 동작 (모바일)
   → 현재 YouTube 앱 연결됨 (정상 동작)
```

---

## 수정 파일

### 1. src/pages/SetBuilder.tsx

**변경 1: 스크롤 타겟 ref 추가**

아이템 리스트 끝에 빈 div를 추가하고 ref 연결:

```tsx
// 새 ref 추가 (기존 refs 근처, line ~74)
const itemsEndRef = useRef<HTMLDivElement>(null);
```

**변경 2: 아이템 추가 후 자동 스크롤**

`handleAddComponent`와 `handleAddSong` 함수에서 아이템 추가 후 스크롤:

```tsx
// handleAddSong (line ~1152)
setItems(prev => [...prev, newSetItem]);
// 추가: 다음 렌더 사이클에 스크롤
setTimeout(() => {
  itemsEndRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
}, 100);

// handleAddComponent (line ~1190)
setItems(prev => [...prev, newComponent]);
// 추가: 다음 렌더 사이클에 스크롤
setTimeout(() => {
  itemsEndRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
}, 100);
```

**변경 3: 스크롤 타겟 div 추가**

아이템 리스트 컨테이너 끝에 (line ~2074 근처):

```tsx
{items.map((item, index) => 
  // ... 기존 렌더링 로직
)}
{/* 스크롤 타겟 */}
<div ref={itemsEndRef} />
```

---

### 2. src/components/SongDialog.tsx

**변경 1: ScorePreviewDialog import 추가**

```tsx
import { ScorePreviewDialog } from "@/components/ScorePreviewDialog";
```

**변경 2: 프리뷰 상태 추가**

```tsx
// 기존 state 근처에 추가
const [scorePreviewOpen, setScorePreviewOpen] = useState(false);
const [previewVariationIndex, setPreviewVariationIndex] = useState(0);
const [previewFileIndex, setPreviewFileIndex] = useState(0);
```

**변경 3: 썸네일 클릭 핸들러 변경**

기존 (line ~864):
```tsx
onClick={() => window.open(file.url, "_blank")}
```

변경 후:
```tsx
onClick={() => {
  setPreviewVariationIndex(index);
  setPreviewFileIndex(fileIndex);
  setScorePreviewOpen(true);
}}
```

**변경 4: ScorePreviewDialog 컴포넌트 추가**

Dialog 닫는 부분 근처에 추가:

```tsx
{/* Score Preview Dialog - 앱 내 프리뷰 */}
<Dialog open={scorePreviewOpen} onOpenChange={setScorePreviewOpen}>
  <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
    <DialogHeader>
      <DialogTitle>악보 미리보기</DialogTitle>
    </DialogHeader>
    <div className="flex-1 overflow-auto flex items-center justify-center p-4">
      {scoreVariations[previewVariationIndex]?.files[previewFileIndex] && (
        <img 
          src={scoreVariations[previewVariationIndex].files[previewFileIndex].url}
          alt="Score preview"
          className="max-w-full max-h-full object-contain"
        />
      )}
    </div>
    {/* 페이지 네비게이션 (여러 페이지일 경우) */}
    {scoreVariations[previewVariationIndex]?.files.length > 1 && (
      <div className="flex items-center justify-center gap-4 py-2 border-t">
        <Button 
          variant="outline" 
          size="sm"
          disabled={previewFileIndex === 0}
          onClick={() => setPreviewFileIndex(prev => prev - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm">
          {previewFileIndex + 1} / {scoreVariations[previewVariationIndex].files.length}
        </span>
        <Button 
          variant="outline" 
          size="sm"
          disabled={previewFileIndex >= scoreVariations[previewVariationIndex].files.length - 1}
          onClick={() => setPreviewFileIndex(prev => prev + 1)}
        </Button>
      </div>
    )}
  </DialogContent>
</Dialog>
```

---

## Import 추가

**SongDialog.tsx:**
```tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
// Dialog는 이미 import 되어 있음
```

---

## 개선 효과

| 기능 | 기존 | 개선 |
|------|------|------|
| 순서 추가 | 스크롤 변화 없음 | 새 아이템으로 자동 스크롤 |
| 악보 프리뷰 | 새 창/탭에서 열림 | 앱 내 다이얼로그에서 표시 |
| 유튜브 클릭 | YouTube 앱 열림 (모바일) | 유지 (정상 동작) |

---

## 스크롤 동작 시각화

```text
순서 추가 버튼 클릭:

Before:                        After:
┌──────────────────┐           ┌──────────────────┐
│ 곡 1             │           │ ...              │
│ 곡 2             │  scroll   │ 곡 4             │
│ 곡 3             │  ────→    │ 새 순서 ← 포커스 │
│ [보이지 않음]     │           │                  │
└──────────────────┘           └──────────────────┘
```

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/SetBuilder.tsx` | itemsEndRef 추가, 아이템 추가 후 자동 스크롤 |
| `src/components/SongDialog.tsx` | 악보 프리뷰를 앱 내 다이얼로그로 변경 |
