import { AdminNav } from "@/components/admin/AdminNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { TIER_CONFIG } from "@/hooks/useTierFeature";
import { AlertTriangle, Database, Code, FileText, ArrowUp } from "lucide-react";

const AdminTierGuide = () => {
  const { t, language } = useTranslation();

  const tierMappings = [
    {
      hierarchy: 1,
      dbValue: "member / user",
      tables: "user_roles.role = 'user'",
      uiEn: "Team Member",
      uiKo: "팀 멤버",
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
      uiKo: "기본 멤버",
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
      uiKo: "정식 멤버",
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
      uiKo: "예배 공동체 계정",
      description: language === "ko" 
        ? "팀 기능이 있는 조직" 
        : "Organizations with team features",
      badgeColor: TIER_CONFIG.church.color,
    },
  ];

  const deprecatedTerms = [
    {
      old: "Church Account",
      new: "Worship Community Account",
      newKo: "예배 공동체 계정",
    },
    {
      old: "Premium",
      new: "Full Member",
      newKo: "정식 멤버",
    },
    {
      old: "Free",
      new: "Basic Member / Team Member",
      newKo: "기본 멤버 / 팀 멤버",
    },
    {
      old: "Worship Leader (as tier name)",
      new: "Basic Member",
      newKo: "기본 멤버",
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
        ? "예배 공동체 계정 정보" 
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
        ? "정식 멤버 구독 상태" 
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
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      
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
                  <TableHead>
                    {language === "ko" ? "설명" : "Description"}
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
                    <TableCell className="text-muted-foreground">
                      {tier.description}
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
    </div>
  );
};

export default AdminTierGuide;
