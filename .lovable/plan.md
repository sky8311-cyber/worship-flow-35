

## SongTable 악보 버튼 색상 수정

### 변경 내용
`src/components/SongTable.tsx` 라인 448-456: `blue-500` → `primary`, hover 시 흰색 아이콘 전환

```tsx
// Before
<Button variant="ghost" size="icon" className="h-8 w-8" ...>
  <FileMusic className="h-4 w-4 text-blue-500" />
</Button>

// After
<Button variant="ghost" size="icon" className="group h-8 w-8 hover:bg-primary hover:text-white" ...>
  <FileMusic className="h-4 w-4 text-primary group-hover:text-white" />
</Button>
```

변경 파일: 1개

