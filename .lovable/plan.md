
# 팀 멤버 초대 기능 개선 계획

## 현재 상태 분석

### 문제점 발견

1. **온보딩 체크리스트에 팀 초대 단계 누락**
   - `WLOnboardingChecklist.tsx`에 3단계만 있음: ① WL 승인 ② 커뮤니티 생성 ③ 첫 세트 만들기
   - **팀원 초대** 단계가 없어서 워십리더가 커뮮니티만 만들고 멤버 초대를 안 함

2. **인센티브 정보 부족**
   - 초대 시 **30 K-Seed** 보상이 있지만, 이 정보가 초대 UI에 표시되지 않음
   - 커뮤니티 관리 페이지의 초대 섹션에 보상 안내가 없음

3. **초대 링크 접근성 문제**
   - 영구 초대 링크(`/join/:token`)가 있지만 Settings 탭 깊숙이 숨겨져 있음
   - 워십리더가 쉽게 찾거나 공유하기 어려움

4. **커뮤니티 생성 후 초대 유도 없음**
   - `CreateCommunityDialog.tsx` 성공 후 바로 닫힘
   - 생성 직후 "팀원을 초대하세요!" 가이드가 없음

5. **WLWelcomeDialog에도 초대 단계 없음**
   - 워십리더 승인 후 환영 다이얼로그에 커뮤니티 생성과 세트 만들기만 안내

---

## 개선 계획

### 1. 온보딩 체크리스트에 "팀원 초대" 단계 추가

**파일**: `src/components/dashboard/WLOnboardingChecklist.tsx`

- 4단계로 확장: ① WL 승인 ② 커뮤니티 생성 ③ **팀원 초대** ④ 첫 세트 만들기
- 체크 조건: 커뮤니티 멤버 수 > 1 (본인 외 다른 멤버 있음)
- 액션 버튼: 커뮤니티 관리 페이지로 이동 또는 초대 다이얼로그 열기

```typescript
// 새로운 쿼리 추가
const { data: hasInvitedMembers } = useQuery({
  queryKey: ["wl-onboarding-invited", user?.id],
  queryFn: async () => {
    // 본인이 owner인 커뮤니티 중 멤버가 2명 이상인지 확인
    const { data } = await supabase
      .from("community_members")
      .select("community_id, role")
      .eq("user_id", user.id)
      .eq("role", "owner");
    
    if (!data || data.length === 0) return false;
    
    // 해당 커뮤니티의 멤버 수 확인
    const { count } = await supabase
      .from("community_members")
      .select("id", { count: "exact" })
      .eq("community_id", data[0].community_id);
    
    return (count || 0) > 1;
  },
  enabled: !!user && !!hasCommunity,
});

// steps 배열에 새 단계 추가
{
  id: "invite",
  label: t("onboarding.steps.inviteTeam"),
  description: t("onboarding.steps.inviteTeamDesc"),
  completed: !!hasInvitedMembers,
  icon: UserPlus,
  action: () => navigate(`/community/${firstCommunityId}/manage`),
}
```

### 2. 초대 UI에 K-Seed 보상 안내 배너 추가

**파일**: `src/pages/CommunityManagement.tsx` (이메일 초대 섹션)

초대 폼 위에 보상 안내 배너 추가:

```tsx
{/* K-Seed Reward Banner */}
<div className="bg-primary/10 rounded-lg p-4 mb-4 flex items-center gap-3">
  <Gift className="h-5 w-5 text-primary shrink-0" />
  <div>
    <p className="font-medium text-sm">
      {language === "ko" 
        ? "팀원을 초대하면 30 K-Seed를 받아요!" 
        : "Earn 30 K-Seeds for each team member you invite!"}
    </p>
    <p className="text-xs text-muted-foreground">
      {language === "ko"
        ? "초대받은 분이 가입하면 보상이 지급됩니다"
        : "Rewards are granted when they sign up"}
    </p>
  </div>
</div>
```

### 3. 영구 초대 링크를 Members 탭에 바로 표시

**파일**: `src/pages/CommunityManagement.tsx`

현재 Settings 탭에 있는 초대 링크를 **Members 탭 상단**으로 이동하여 접근성 향상:

```tsx
{/* Quick Invite Link Card - 눈에 잘 띄는 위치 */}
{canManage && community?.invite_token && (
  <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
    <CardHeader className="pb-2">
      <CardTitle className="text-base flex items-center gap-2">
        <Link className="h-4 w-4" />
        {t("community.permanentInviteLink")}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex gap-2">
        <Input
          value={`${window.location.origin}/join/${community.invite_token}`}
          readOnly
          className="font-mono text-sm"
        />
        <Button variant="outline" size="icon" onClick={handleCopyLink}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        {navigator.share && (
          <Button variant="outline" size="icon" onClick={handleShareLink}>
            <Share2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {t("community.shareThisLink")}
      </p>
    </CardContent>
  </Card>
)}
```

### 4. 커뮤니티 생성 성공 후 초대 안내 다이얼로그

**파일**: `src/components/CreateCommunityDialog.tsx`

생성 성공 시 바로 닫지 않고, 초대 유도 화면 표시:

```tsx
const [showInvitePrompt, setShowInvitePrompt] = useState(false);
const [newCommunityId, setNewCommunityId] = useState<string | null>(null);

// onSuccess 수정
onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: ["my-communities"] });
  setFormData({ name: "", description: "" });
  
  // 바로 닫지 않고 초대 프롬프트 표시
  if (data?.id) {
    setNewCommunityId(data.id);
    setShowInvitePrompt(true);
  }
},

// 다이얼로그 내용 수정 (성공 후)
{showInvitePrompt ? (
  <div className="space-y-4">
    <div className="text-center">
      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
      <h3 className="font-semibold text-lg">{t("community.createDialog.success")}</h3>
    </div>
    
    {/* 초대 유도 */}
    <div className="bg-primary/10 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-primary" />
        <span className="font-medium">
          {language === "ko" ? "팀원을 초대해보세요!" : "Invite your team!"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {language === "ko" 
          ? "팀원을 초대하면 30 K-Seed 보상을 받습니다"
          : "Earn 30 K-Seeds for each team member"}
      </p>
    </div>
    
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        className="flex-1"
        onClick={() => {
          setShowInvitePrompt(false);
          onOpenChange(false);
        }}
      >
        {language === "ko" ? "나중에" : "Later"}
      </Button>
      <Button 
        className="flex-1"
        onClick={() => {
          onOpenChange(false);
          navigate(`/community/${newCommunityId}/manage`);
        }}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        {language === "ko" ? "팀원 초대하기" : "Invite Team"}
      </Button>
    </div>
  </div>
) : (
  // 기존 폼...
)}
```

### 5. WLWelcomeDialog에 팀 초대 단계 추가

**파일**: `src/components/dashboard/WLWelcomeDialog.tsx`

"Next Steps"에 팀 초대 추가 (3단계로 확장):

```tsx
{/* Step 2: Invite Team (NEW) */}
<button
  onClick={handleInviteTeam}
  className="w-full p-4 border rounded-lg text-left hover:bg-muted/50 transition-colors group"
>
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <UserPlus className="w-4 h-4 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium">
        {language === "ko" ? "2. 팀원 초대하기" : "2. Invite Your Team"}
      </p>
      <p className="text-sm text-muted-foreground mt-0.5">
        {language === "ko" 
          ? "초대 시 30 K-Seed 보상!" 
          : "Earn 30 K-Seeds per invite!"}
      </p>
    </div>
    <Badge variant="secondary" className="shrink-0">
      <Gift className="w-3 h-3 mr-1" />
      +30
    </Badge>
  </div>
</button>
```

### 6. 번역 키 추가

**파일**: `src/lib/translations.ts`

```typescript
// English
onboarding: {
  steps: {
    // ...existing
    inviteTeam: "Invite Team Members",
    inviteTeamDesc: "Earn 30 K-Seeds for each member",
  }
},
community: {
  inviteRewardBanner: "Earn 30 K-Seeds for each team member you invite!",
  inviteRewardHint: "Rewards are granted when they sign up",
  inviteNow: "Invite Now",
}

// Korean
onboarding: {
  steps: {
    inviteTeam: "팀원 초대하기",
    inviteTeamDesc: "멤버당 30 K-Seed 보상",
  }
},
community: {
  inviteRewardBanner: "팀원을 초대하면 30 K-Seed를 받아요!",
  inviteRewardHint: "초대받은 분이 가입하면 보상이 지급됩니다",
  inviteNow: "지금 초대하기",
}
```

---

## 파일 수정 요약

| 파일 | 변경 내용 |
|------|----------|
| `WLOnboardingChecklist.tsx` | 4단계로 확장, "팀원 초대" 단계 추가 |
| `CommunityManagement.tsx` | K-Seed 보상 배너, 초대 링크 위치 이동 |
| `CreateCommunityDialog.tsx` | 생성 후 초대 유도 프롬프트 추가 |
| `WLWelcomeDialog.tsx` | "팀원 초대" 단계 추가 |
| `translations.ts` | 관련 번역 키 추가 |

---

## 예상 효과

- **발견성 향상**: 온보딩 체크리스트에서 초대가 필수 단계로 보임
- **인센티브 인지**: K-Seed 보상이 눈에 띄게 표시됨
- **접근성 개선**: 초대 링크가 쉽게 접근 가능한 위치에 배치
- **자연스러운 유도**: 커뮤니티 생성 직후 초대로 자연스럽게 이어짐
