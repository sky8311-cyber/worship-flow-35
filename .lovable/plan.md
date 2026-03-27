

## Fix: 패스웨이 편집 폼에 배지 이름/설명 필드 추가

### 문제
배지 이름(`badge_name`)과 배지 설명(`badge_description`) 필드가 `AdminInstituteCertifications.tsx`에만 존재하고, 실제 사용하는 `AdminInstituteContentTree.tsx`의 패스웨이 편집 폼(lines 346-373)에는 없음.

### 수정 — `src/components/institute/AdminInstituteContentTree.tsx`

패스웨이 편집 폼의 "설명 (KO)" 필드 아래, Published 스위치 위(line 358~359 사이)에 두 필드 추가:

```jsx
<div>
  <label className="text-xs font-medium text-muted-foreground mb-1 block">배지 이름</label>
  <Input defaultValue={p.badge_name || ""} key={p.id + "-badge_name"} placeholder="예: K-Worship Essential" onBlur={(e) => updatePathway.mutate({ id: p.id, field: "badge_name", value: e.target.value || null })} />
</div>
<div>
  <label className="text-xs font-medium text-muted-foreground mb-1 block">배지 설명</label>
  <Textarea defaultValue={p.badge_description || ""} key={p.id + "-badge_desc"} placeholder="배지에 대한 설명" onBlur={(e) => updatePathway.mutate({ id: p.id, field: "badge_description", value: e.target.value || null })} />
</div>
```

단일 파일 수정: `src/components/institute/AdminInstituteContentTree.tsx` (2개 필드 삽입)

