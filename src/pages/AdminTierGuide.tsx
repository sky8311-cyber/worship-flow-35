import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { TIER_CONFIG } from "@/hooks/useTierFeature";
import { AlertTriangle, Database, Code, FileText, ArrowUp, ArrowRight, Users, Crown, Shield, Building2, Check, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminTierGuide = () => {
  const { t, language } = useTranslation();

  // Fetch real-time tier stats
  const { data: tierStats } = useQuery({
    queryKey: ["tier-stats"],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: worshipLeaders },
        { count: premiumUsers },
        { count: churchAccountMembers },
        { count: inCommunity },
        { count: notInCommunity },
        { count: communityOwners },
        { count: communityLeaders },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "worship_leader"),
        supabase.from("premium_subscriptions").select("*", { count: "exact", head: true }).eq("subscription_status", "active"),
        supabase.from("church_account_members").select("*", { count: "exact", head: true }),
        supabase.from("community_members").select("user_id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true })
          .not("id", "in", supabase.from("community_members").select("user_id")),
        supabase.from("community_members").select("*", { count: "exact", head: true }).eq("role", "owner"),
        supabase.from("community_members").select("*", { count: "exact", head: true }).eq("role", "community_leader"),
      ]);

      const teamMembers = (totalUsers || 0) - (worshipLeaders || 0);

      return {
        totalUsers: totalUsers || 0,
        teamMembers,
        worshipLeaders: worshipLeaders || 0,
        premiumUsers: premiumUsers || 0,
        churchAccountMembers: churchAccountMembers || 0,
        inCommunity: inCommunity || 0,
        notInCommunity: notInCommunity || 0,
        communityOwners: communityOwners || 0,
        communityLeaders: communityLeaders || 0,
      };
    },
  });

  const tierMappings = [
    {
      hierarchy: 1,
      dbValue: "member / user",
      tables: "user_roles.role = 'user'",
      uiEn: "Team Member",
      uiKo: "팀 멤버",
      count: tierStats?.teamMembers || 0,
      description: language === "ko" 
        ? "모든 사용자의 기본 역할" 
        : "Default role for all users",
      badgeColor: TIER_CONFIG.member.color,
    },
    {
      hierarchy: 2,
      dbValue: "worship_leader",
      tables: "user_roles.role = 'worship_leader'",
      uiEn: "Basic Member",
      uiKo: "일반멤버 (예배인도자)",
      count: tierStats?.worshipLeaders || 0,
      description: language === "ko" 
        ? "승인된 예배인도자" 
        : "Approved worship leaders",
      badgeColor: TIER_CONFIG.worship_leader.color,
    },
    {
      hierarchy: 3,
      dbValue: "premium",
      tables: "premium_subscriptions.subscription_status = 'active'",
      uiEn: "Full Member",
      uiKo: "정회원",
      count: tierStats?.premiumUsers || 0,
      description: language === "ko" 
        ? "프리미엄 구독자" 
        : "Premium subscribers",
      badgeColor: TIER_CONFIG.premium.color,
    },
    {
      hierarchy: 4,
      dbValue: "church",
      tables: "church_accounts + church_account_members",
      uiEn: "Worship Community Account",
      uiKo: "공동체 어카운트",
      count: tierStats?.churchAccountMembers || 0,
      description: language === "ko" 
        ? "팀 기능이 있는 조직" 
        : "Organizations with team features",
      badgeColor: TIER_CONFIG.church.color,
    },
  ];

  const featureMatrix = [
    { feature: language === "ko" ? "예배 세트 열람" : "View Worship Sets", team: true, basic: true, full: true, church: true },
    { feature: language === "ko" ? "커뮤니티 가입" : "Join Communities", team: true, basic: true, full: true, church: true },
    { feature: language === "ko" ? "커뮤니티 생성" : "Create Communities", team: false, basic: true, full: true, church: true },
    { feature: language === "ko" ? "곡 추가/편집" : "Add/Edit Songs", team: false, basic: true, full: true, church: true },
    { feature: language === "ko" ? "예배 세트 생성" : "Create Worship Sets", team: false, basic: true, full: true, church: true },
    { feature: language === "ko" ? "팀원 초대" : "Invite Team Members", team: false, basic: true, full: true, church: true },
    { feature: language === "ko" ? "프리미엄 기능" : "Premium Features", team: false, basic: false, full: true, church: true },
    { feature: language === "ko" ? "고급 팀 관리" : "Advanced Team Management", team: false, basic: false, full: false, church: true },
  ];

  const deprecatedTerms = [
    {
      old: "Church Account",
      new: "Worship Community Account",
      newKo: "공동체 어카운트",
    },
    {
      old: "Premium",
      new: "Full Member",
      newKo: "정회원",
    },
    {
      old: "Free",
      new: "Basic Member / Team Member",
      newKo: "일반멤버 / 팀멤버",
    },
    {
      old: "Worship Leader (as tier name)",
      new: "Basic Member",
      newKo: "일반멤버",
    },
  ];

  const codeReferences = [
    {
      file: "src/hooks/useTierFeature.ts",
      description: language === "ko" 
        ? "TIER_HIERARCHY 및 TIER_CONFIG 정의" 
        : "TIER_HIERARCHY and TIER_CONFIG definitions",
    },
    {
      file: "src/lib/translations.ts",
      description: language === "ko" 
        ? "역할 및 티어 번역" 
        : "Role and tier translations",
    },
    {
      file: "src/components/admin/TierBadge.tsx",
      description: language === "ko" 
        ? "티어 뱃지 컴포넌트" 
        : "Tier badge component",
    },
  ];

  const dbSchemaRefs = [
    {
      table: "user_roles",
      column: "role",
      values: "admin, worship_leader, user",
      description: language === "ko" 
        ? "사용자 역할 저장 (app_role enum)" 
        : "Stores user roles (app_role enum)",
    },
    {
      table: "church_accounts",
      column: "-",
      values: "-",
      description: language === "ko" 
        ? "공동체 어카운트 정보" 
        : "Worship Community Account data",
    },
    {
      table: "church_account_members",
      column: "role",
      values: "owner, admin, member",
      description: language === "ko" 
        ? "공동체 계정 내 멤버 역할" 
        : "Member roles within community accounts",
    },
    {
      table: "premium_subscriptions",
      column: "subscription_status",
      values: "active, canceled, trialing",
      description: language === "ko" 
        ? "정회원 구독 상태" 
        : "Full Member subscription status",
    },
    {
      table: "tier_features",
      column: "-",
      values: "-",
      description: language === "ko" 
        ? "티어별 기능 정의" 
        : "Feature definitions per tier",
    },
    {
      table: "community_members",
      column: "role",
      values: "owner, community_leader, member",
      description: language === "ko" 
        ? "커뮤니티 내 역할 (2차 권한)" 
        : "Community roles (secondary auth)",
    },
  ];

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">
            {language === "ko" ? "티어 시스템 가이드" : "Tier System Guide"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "ko" 
              ? "티어 명명 규칙 및 DB 매핑에 대한 참조 문서" 
              : "Reference documentation for tier naming conventions and DB mappings"}
          </p>
        </div>

        {/* Real-time Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{tierStats?.teamMembers || 0}</div>
                <div className="text-xs text-muted-foreground">{language === "ko" ? "팀멤버" : "Team Members"}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Crown className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{tierStats?.worshipLeaders || 0}</div>
                <div className="text-xs text-muted-foreground">{language === "ko" ? "일반멤버" : "Basic Members"}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Shield className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{tierStats?.premiumUsers || 0}</div>
                <div className="text-xs text-muted-foreground">{language === "ko" ? "정회원" : "Full Members"}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{tierStats?.churchAccountMembers || 0}</div>
                <div className="text-xs text-muted-foreground">{language === "ko" ? "공동체계정" : "Community Accounts"}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Diagram */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              {language === "ko" ? "승급 워크플로우" : "Upgrade Workflow"}
            </CardTitle>
            <CardDescription>
              {language === "ko" 
                ? "사용자가 티어를 승급하는 과정" 
                : "How users progress through tiers"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 p-6 bg-muted/30 rounded-xl overflow-x-auto">
              {/* Step 1: Sign Up */}
              <div className="flex flex-col items-center gap-2 min-w-[120px]">
                <div className="p-4 bg-muted rounded-xl">
                  <Users className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">{language === "ko" ? "회원가입" : "Sign Up"}</p>
                  <p className="text-xs text-muted-foreground">{language === "ko" ? "모든 사용자" : "All users"}</p>
                </div>
              </div>

              <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
              <div className="h-6 w-px bg-muted-foreground md:hidden" />

              {/* Step 2: Team Member */}
              <div className="flex flex-col items-center gap-2 min-w-[120px]">
                <div className={`p-4 rounded-xl ${TIER_CONFIG.member.color}`}>
                  <Users className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <Badge className={TIER_CONFIG.member.color}>{language === "ko" ? "팀멤버" : "Team Member"}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{tierStats?.teamMembers || 0}{language === "ko" ? "명" : " users"}</p>
                </div>
              </div>

              <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
              <div className="h-6 w-px bg-muted-foreground md:hidden" />

              {/* Step 3: Basic Member */}
              <div className="flex flex-col items-center gap-2 min-w-[120px]">
                <div className={`p-4 rounded-xl ${TIER_CONFIG.worship_leader.color}`}>
                  <Crown className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <Badge className={TIER_CONFIG.worship_leader.color}>{language === "ko" ? "일반멤버" : "Basic Member"}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{language === "ko" ? "승급 신청" : "Apply"}</p>
                </div>
              </div>

              <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
              <div className="h-6 w-px bg-muted-foreground md:hidden" />

              {/* Step 4: Full Member or Church */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex flex-col items-center gap-2 min-w-[120px]">
                  <div className={`p-4 rounded-xl ${TIER_CONFIG.premium.color}`}>
                    <Shield className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <Badge className={TIER_CONFIG.premium.color}>{language === "ko" ? "정회원" : "Full Member"}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{language === "ko" ? "결제" : "Subscribe"}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 min-w-[120px]">
                  <div className={`p-4 rounded-xl ${TIER_CONFIG.church.color}`}>
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <Badge className={TIER_CONFIG.church.color}>{language === "ko" ? "공동체계정" : "Community Account"}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{language === "ko" ? "팀 구독" : "Team Plan"}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "ko" ? "📊 기능 권한 매트릭스" : "📊 Feature Permission Matrix"}</CardTitle>
            <CardDescription>
              {language === "ko" 
                ? "각 티어별 사용 가능한 기능" 
                : "Available features per tier"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ko" ? "기능" : "Feature"}</TableHead>
                  <TableHead className="text-center">{language === "ko" ? "팀멤버" : "Team"}</TableHead>
                  <TableHead className="text-center">{language === "ko" ? "일반멤버" : "Basic"}</TableHead>
                  <TableHead className="text-center">{language === "ko" ? "정회원" : "Full"}</TableHead>
                  <TableHead className="text-center">{language === "ko" ? "공동체" : "Church"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureMatrix.map((row) => (
                  <TableRow key={row.feature}>
                    <TableCell className="font-medium">{row.feature}</TableCell>
                    <TableCell className="text-center">
                      {row.team ? <Check className="w-4 h-4 text-green-600 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.basic ? <Check className="w-4 h-4 text-green-600 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.full ? <Check className="w-4 h-4 text-green-600 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.church ? <Check className="w-4 h-4 text-green-600 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground mx-auto" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tier Mapping Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUp className="h-5 w-5" />
              {language === "ko" ? "티어 매핑 참조표" : "Tier Mapping Reference"}
            </CardTitle>
            <CardDescription>
              {language === "ko" 
                ? "DB 값과 UI 표시 이름 간의 매핑" 
                : "Mapping between DB values and UI display names"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">
                    {language === "ko" ? "계층" : "Hierarchy"}
                  </TableHead>
                  <TableHead>
                    {language === "ko" ? "DB / 내부 값" : "DB / Internal Value"}
                  </TableHead>
                  <TableHead>
                    {language === "ko" ? "UI 표시 (영어)" : "UI Display (EN)"}
                  </TableHead>
                  <TableHead>
                    {language === "ko" ? "UI 표시 (한국어)" : "UI Display (KO)"}
                  </TableHead>
                  <TableHead className="text-right">
                    {language === "ko" ? "현재 수" : "Count"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tierMappings.map((tier) => (
                  <TableRow key={tier.dbValue}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">{tier.hierarchy}</Badge>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded text-sm">
                        {tier.dbValue}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge className={tier.badgeColor}>
                        {tier.uiEn}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={tier.badgeColor}>
                        {tier.uiKo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {tier.count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* DB Schema Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {language === "ko" ? "데이터베이스 스키마 참조" : "Database Schema Reference"}
            </CardTitle>
            <CardDescription>
              {language === "ko" 
                ? "역할 정보가 저장되는 테이블 및 컬럼" 
                : "Tables and columns storing role information"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ko" ? "테이블" : "Table"}</TableHead>
                  <TableHead>{language === "ko" ? "컬럼" : "Column"}</TableHead>
                  <TableHead>{language === "ko" ? "값" : "Values"}</TableHead>
                  <TableHead>{language === "ko" ? "설명" : "Description"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dbSchemaRefs.map((ref) => (
                  <TableRow key={ref.table}>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded text-sm">
                        {ref.table}
                      </code>
                    </TableCell>
                    <TableCell>
                      {ref.column !== "-" ? (
                        <code className="px-2 py-1 bg-muted rounded text-sm">
                          {ref.column}
                        </code>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {ref.values}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ref.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Code Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              {language === "ko" ? "코드 참조" : "Code Reference"}
            </CardTitle>
            <CardDescription>
              {language === "ko" 
                ? "티어 로직을 정의하는 주요 파일들" 
                : "Key files that define tier logic"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {codeReferences.map((ref) => (
                <div key={ref.file} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <FileText className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <code className="text-sm font-medium">{ref.file}</code>
                    <p className="text-sm text-muted-foreground mt-1">
                      {ref.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Deprecated Terms Warning */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {language === "ko" ? "사용 중단된 용어" : "Deprecated Terms"}
          </AlertTitle>
          <AlertDescription>
            <p className="mb-4">
              {language === "ko" 
                ? "다음 용어들은 더 이상 사용하지 않습니다. 새로운 통합 용어를 사용하세요." 
                : "The following terms are deprecated. Use the new unified terminology instead."}
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-destructive-foreground">
                    {language === "ko" ? "기존 용어" : "Old Term"}
                  </TableHead>
                  <TableHead className="text-destructive-foreground">
                    {language === "ko" ? "새 용어 (영어)" : "New Term (EN)"}
                  </TableHead>
                  <TableHead className="text-destructive-foreground">
                    {language === "ko" ? "새 용어 (한국어)" : "New Term (KO)"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deprecatedTerms.map((term) => (
                  <TableRow key={term.old}>
                    <TableCell className="line-through text-muted-foreground">
                      {term.old}
                    </TableCell>
                    <TableCell className="font-medium">
                      {term.new}
                    </TableCell>
                    <TableCell className="font-medium">
                      {term.newKo}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AlertDescription>
        </Alert>
      </div>
    </AdminLayout>
  );
};

export default AdminTierGuide;
