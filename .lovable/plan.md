

## 악보 버튼 hover 시 흰색 아이콘 전환

### 수정 파일: `src/components/SongCard.tsx` (라인 217-224)

Button에 `group` 클래스 + hover 스타일 추가, FileMusic 아이콘에 `group-hover:text-white` 적용.

```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => setScorePreviewOpen(true)}
  className="flex-1 w-full group hover:bg-blue-500 hover:text-white hover:border-blue-500"
>
  <FileMusic className="w-4 h-4 mr-1 text-blue-500 group-hover:text-white" />
```

변경 파일: 1개

