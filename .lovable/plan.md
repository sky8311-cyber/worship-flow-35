

## 악보 버튼 색상을 Primary Navy Blue로 통일

### 변경 내용
`blue-500` 하드코딩 → `primary` 디자인 토큰으로 교체. 브랜드 컬러 팔레트와 일관성 유지.

### 수정 파일: `src/components/SongCard.tsx`

```tsx
// Before
className="... hover:bg-blue-500 hover:text-white hover:border-blue-500"
<FileMusic className="... text-blue-500 group-hover:text-white" />

// After
className="... hover:bg-primary hover:text-white hover:border-primary"
<FileMusic className="... text-primary group-hover:text-white" />
```

변경 파일: 1개

