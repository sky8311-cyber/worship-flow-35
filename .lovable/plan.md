

# 기본멤버 워십세트 수 표시

## 목표
CRM 테이블에서 각 기본멤버(worship_leader)가 만든 워십세트 수를 "Published (Draft)" 형식으로 Stats 컬럼에 표시.

## 변경 사항

### 파일 1: `src/pages/AdminCRM.tsx`

데이터 fetch 시 `service_sets` 테이블도 함께 조회하여 각 worship leader의 세트 수를 계산:

1. `Promise.all`에 `service_sets` 쿼리 추가:
   ```
   supabase.from("service_sets").select("id, created_by, status")
   ```

2. worship leader 처리 시 해당 유저의 published/draft 세트 수를 계산하여 데이터에 포함:
   ```
   publishedSetCount: serviceSets.filter(s => s.created_by === role.user_id && s.status === 'published').length
   draftSetCount: serviceSets.filter(s => s.created_by === role.user_id && s.status === 'draft').length
   ```

### 파일 2: `src/components/admin/crm/HierarchyRow.tsx`

`worship_leader` 케이스의 `stats` 값을 변경:

현재:
```
stats: `${data.communityCount || 0} communities`
```

변경 후:
```
stats: `${data.publishedSetCount || 0} Published (${data.draftSetCount || 0} Draft) · ${data.communityCount || 0} communities`
```

예시 표시: **3 Published (2 Draft) · 1 communities**

## 변경 범위
- 파일 2개 수정
- 새로운 DB 쿼리 1개 추가 (`service_sets`의 `id, created_by, status`만 조회)
- 기존 기능에 영향 없음

