

# 뉴스피드 게시물 삭제/편집 후 UI 갱신 안됨 수정 계획

## 문제 분석

### 확인된 현상
- 관리자가 뉴스피드에서 게시물 삭제 → **UI에서 사라지지 않음**
- 새로고침하면 정상적으로 삭제됨 확인
- 일반 유저도 동일한 문제 발생 예상

### 근본 원인: **쿼리 키 불일치**

| 위치 | 사용하는 쿼리 키 |
|------|-----------------|
| `CommunityNewsfeed.tsx` (뉴스피드 데이터) | `["community-newsfeed", activeCommunityId]` |
| `SocialFeedPost.tsx` (삭제/편집) | `["unified-community-feed"]` ❌ |
| `ChatBubble.tsx` (삭제/편집) | `["unified-community-feed"]` ❌ |
| `PostComposer.tsx` (새 글 작성) | `["unified-community-feed"]` ❌ |

**결과**: 삭제/편집/작성 후 `["unified-community-feed"]`를 무효화하지만, 실제 뉴스피드는 `["community-newsfeed", ...]` 쿼리를 사용하므로 **캐시가 갱신되지 않아 UI가 업데이트되지 않음**

### 영향 범위
1. **게시물 삭제** - 삭제했는데 화면에 그대로 표시됨
2. **게시물 편집** - 수정했는데 이전 내용이 표시됨
3. **새 게시물 작성** - 작성했는데 바로 피드에 안 나타남 (새로고침 필요)

---

## 수정 계획

### 수정 전략

모든 mutation의 `onSuccess`에서 **두 쿼리 키 모두 무효화**:
- `["unified-community-feed"]` - 기존 호환성 유지
- `["community-newsfeed"]` - 커뮤니티별 뉴스피드 갱신

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
  queryClient.invalidateQueries({ queryKey: ["community-newsfeed"] }); // 추가
}
```

### 파일별 수정 내용

#### 1. `src/components/dashboard/SocialFeedPost.tsx`

**삭제 mutation (line 198-201):**
```typescript
// 변경 전
onSuccess: () => {
  toast.success(t("common.deleteSuccess"));
  queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
},

// 변경 후
onSuccess: () => {
  toast.success(t("common.deleteSuccess"));
  queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
  queryClient.invalidateQueries({ queryKey: ["community-newsfeed"] });
},
```

**편집 mutation (line 217-220):**
```typescript
// 변경 전
onSuccess: () => {
  toast.success(t("common.saveSuccess"));
  queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
  setEditDialogOpen(false);
},

// 변경 후
onSuccess: () => {
  toast.success(t("common.saveSuccess"));
  queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
  queryClient.invalidateQueries({ queryKey: ["community-newsfeed"] });
  setEditDialogOpen(false);
},
```

#### 2. `src/components/dashboard/ChatBubble.tsx`

**삭제 mutation (line 153-156):**
```typescript
// 변경 전
onSuccess: () => {
  toast.success(t("common.deleteSuccess"));
  queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
},

// 변경 후
onSuccess: () => {
  toast.success(t("common.deleteSuccess"));
  queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
  queryClient.invalidateQueries({ queryKey: ["community-newsfeed"] });
},
```

**편집 mutation (line 170-173):**
```typescript
// 변경 전
onSuccess: () => {
  toast.success(t("common.saveSuccess"));
  queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
  setEditDialogOpen(false);
},

// 변경 후
onSuccess: () => {
  toast.success(t("common.saveSuccess"));
  queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
  queryClient.invalidateQueries({ queryKey: ["community-newsfeed"] });
  setEditDialogOpen(false);
},
```

#### 3. `src/components/dashboard/PostComposer.tsx`

**작성 mutation (line 40-44):**
```typescript
// 변경 전
onSuccess: async (communityId) => {
  toast.success(t("socialFeed.postSuccess"));
  setContent("");
  setUploadedImages([]);
  queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
  // ...

// 변경 후
onSuccess: async (communityId) => {
  toast.success(t("socialFeed.postSuccess"));
  setContent("");
  setUploadedImages([]);
  queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
  queryClient.invalidateQueries({ queryKey: ["community-newsfeed"] });
  // ...
```

---

## 파일 변경 요약

| 파일 | 변경 라인 | 변경 내용 |
|------|----------|----------|
| `SocialFeedPost.tsx` | 200, 219 | `["community-newsfeed"]` 무효화 추가 |
| `ChatBubble.tsx` | 155, 172 | `["community-newsfeed"]` 무효화 추가 |
| `PostComposer.tsx` | 44 | `["community-newsfeed"]` 무효화 추가 |

---

## 예상 결과

수정 후:
1. **게시물 삭제 시** → 즉시 뉴스피드에서 사라짐
2. **게시물 편집 시** → 즉시 수정된 내용 표시
3. **새 게시물 작성 시** → 즉시 뉴스피드에 나타남
4. **관리자/일반 유저 동일하게 작동**

