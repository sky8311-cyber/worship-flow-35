import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Settings, Plus, Crown, Shield, User, ChevronRight, CreditCard, Tag, RefreshCw, Globe } from "lucide-react";
import { CreateChurchAccountDialog } from "@/components/church/CreateChurchAccountDialog";
import { ChurchAccountMembersTab } from "@/components/church/ChurchAccountMembersTab";
import { ChurchAccountCommunitiesTab } from "@/components/church/ChurchAccountCommunitiesTab";
import { ChurchAccountSettingsTab } from "@/components/church/ChurchAccountSettingsTab";
import { ChurchCustomRolesTab } from "@/components/church/ChurchCustomRolesTab";
import { ChurchBillingTab } from "@/components/church/ChurchBillingTab";
import { ChurchTeamRotationTab } from "@/components/church/ChurchTeamRotationTab";
import { ChurchCustomDomainTab } from "@/components/church/ChurchCustomDomainTab";
import { useNavigate } from "react-router-dom";

interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
}

interface ChurchAccount {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  billing_email: string | null;
  owner_id: string;
  subscription_status: string;
  max_seats: number;
  used_seats: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  created_at: string;
  slogan: string | null;
  theme_config: ThemeConfig | Record<string, unknown> | null;
  custom_domain: string | null;
  domain_status: string | null;
  domain_verified_at: string | null;
}

export default function ChurchAccount() {
  const { user, isWorshipLeader, isAdmin } = useAuth();
  const { language } = useLanguageContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ChurchAccount | null>(null);

  // Fetch church accounts user belongs to
  const { data: churchAccounts, isLoading } = useQuery({
    queryKey: ["church-accounts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("church_accounts")
        .select(`
          *,
          church_account_members!inner(user_id, role)
        `)
        .eq("church_account_members.user_id", user.id);
      
      if (error) throw error;
      return data as (ChurchAccount & { church_account_members: { user_id: string; role: string }[] })[];
    },
    enabled: !!user?.id,
  });

  // Get user's role in selected account
  const getUserRole = (account: ChurchAccount & { church_account_members?: { user_id: string; role: string }[] }) => {
    if (!account.church_account_members) return null;
    const membership = account.church_account_members.find(m => m.user_id === user?.id);
    return membership?.role;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">{language === "ko" ? "활성" : "Active"}</Badge>;
      case "trial":
        return <Badge variant="secondary">{language === "ko" ? "체험판" : "Trial"}</Badge>;
      case "past_due":
        return <Badge variant="destructive">{language === "ko" ? "결제 지연" : "Past Due"}</Badge>;
      case "canceled":
        return <Badge variant="outline">{language === "ko" ? "취소됨" : "Canceled"}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string | null | undefined) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-yellow-500"><Crown className="w-3 h-3 mr-1" />{language === "ko" ? "소유자" : "Owner"}</Badge>;
      case "admin":
        return <Badge className="bg-blue-500"><Shield className="w-3 h-3 mr-1" />{language === "ko" ? "관리자" : "Admin"}</Badge>;
      default:
        return <Badge variant="outline"><User className="w-3 h-3 mr-1" />{language === "ko" ? "멤버" : "Member"}</Badge>;
    }
  };

  if (!isWorshipLeader && !isAdmin) {
    return (
      <AppLayout>
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {language === "ko" ? "예배인도자 전용 기능" : "Worship Leader Feature"}
              </h2>
              <p className="text-muted-foreground">
                {language === "ko" 
                  ? "교회 계정 기능은 예배인도자만 사용할 수 있습니다."
                  : "Church Account feature is only available for Worship Leaders."}
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              {language === "ko" ? "교회 계정" : "Church Account"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === "ko" 
                ? "교회 단위로 여러 예배공동체와 팀원을 관리하세요"
                : "Manage multiple communities and team members at the church level"}
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {language === "ko" ? "교회 계정 만들기" : "Create Church Account"}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : !churchAccounts?.length ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {language === "ko" ? "교회 계정이 없습니다" : "No Church Accounts"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === "ko" 
                  ? "교회 계정을 만들어 여러 예배공동체와 팀원을 통합 관리하세요."
                  : "Create a church account to manage multiple communities and team members together."}
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                {language === "ko" ? "첫 교회 계정 만들기" : "Create Your First Church Account"}
              </Button>
            </CardContent>
          </Card>
        ) : !selectedAccount ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {churchAccounts.map(account => {
              const role = getUserRole(account);
              return (
                <Card 
                  key={account.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedAccount(account)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={account.logo_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Building2 className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      {getStatusBadge(account.subscription_status)}
                    </div>
                    <CardTitle className="mt-3">{account.name}</CardTitle>
                    {account.description && (
                      <CardDescription className="line-clamp-2">{account.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          {account.used_seats}/{account.max_seats}
                        </span>
                        {getRoleBadge(role)}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div>
            {/* Back button */}
            <Button 
              variant="ghost" 
              className="mb-4"
              onClick={() => setSelectedAccount(null)}
            >
              ← {language === "ko" ? "목록으로" : "Back to list"}
            </Button>

            {/* Selected account header */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedAccount.logo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        <Building2 className="w-8 h-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">{selectedAccount.name}</CardTitle>
                      {selectedAccount.description && (
                        <CardDescription className="mt-1">{selectedAccount.description}</CardDescription>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(selectedAccount.subscription_status)}
                        {getRoleBadge(getUserRole(selectedAccount as any))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-semibold">
                      <Users className="w-5 h-5" />
                      {selectedAccount.used_seats}/{selectedAccount.max_seats}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language === "ko" ? "사용 중인 시트" : "Seats used"}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="communities">
              <TabsList className="mb-4">
                <TabsTrigger value="communities" className="gap-2">
                  <Building2 className="w-4 h-4" />
                  {language === "ko" ? "예배공동체" : "Communities"}
                </TabsTrigger>
                <TabsTrigger value="members" className="gap-2">
                  <Users className="w-4 h-4" />
                  {language === "ko" ? "멤버" : "Members"}
                </TabsTrigger>
                <TabsTrigger value="roles" className="gap-2">
                  <Tag className="w-4 h-4" />
                  {language === "ko" ? "역할" : "Roles"}
                </TabsTrigger>
                <TabsTrigger value="rotation" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  {language === "ko" ? "로테이션" : "Rotation"}
                </TabsTrigger>
                <TabsTrigger value="billing" className="gap-2">
                  <CreditCard className="w-4 h-4" />
                  {language === "ko" ? "구독/결제" : "Billing"}
                </TabsTrigger>
                <TabsTrigger value="domain" className="gap-2">
                  <Globe className="w-4 h-4" />
                  {language === "ko" ? "도메인" : "Domain"}
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="w-4 h-4" />
                  {language === "ko" ? "설정" : "Settings"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="communities">
                <ChurchAccountCommunitiesTab 
                  churchAccountId={selectedAccount.id}
                  isAdmin={getUserRole(selectedAccount as any) === "owner" || getUserRole(selectedAccount as any) === "admin"}
                />
              </TabsContent>

              <TabsContent value="members">
                <ChurchAccountMembersTab 
                  churchAccountId={selectedAccount.id}
                  maxSeats={selectedAccount.max_seats}
                  usedSeats={selectedAccount.used_seats}
                  isAdmin={getUserRole(selectedAccount as any) === "owner" || getUserRole(selectedAccount as any) === "admin"}
                />
              </TabsContent>

              <TabsContent value="roles">
                <ChurchCustomRolesTab 
                  churchAccountId={selectedAccount.id}
                  isAdmin={getUserRole(selectedAccount as any) === "owner" || getUserRole(selectedAccount as any) === "admin"}
                />
              </TabsContent>

              <TabsContent value="rotation">
                <ChurchTeamRotationTab 
                  churchAccountId={selectedAccount.id}
                  isAdmin={getUserRole(selectedAccount as any) === "owner" || getUserRole(selectedAccount as any) === "admin"}
                />
              </TabsContent>

              <TabsContent value="billing">
                <ChurchBillingTab 
                  churchAccount={selectedAccount}
                  isOwner={getUserRole(selectedAccount as any) === "owner"}
                />
              </TabsContent>

              <TabsContent value="domain">
                <ChurchCustomDomainTab 
                  churchAccount={selectedAccount}
                  isOwner={getUserRole(selectedAccount as any) === "owner"}
                  onUpdate={() => {
                    queryClient.invalidateQueries({ queryKey: ["church-accounts"] });
                  }}
                />
              </TabsContent>

              <TabsContent value="settings">
                <ChurchAccountSettingsTab 
                  churchAccount={selectedAccount}
                  isOwner={getUserRole(selectedAccount as any) === "owner"}
                  onUpdate={() => {
                    queryClient.invalidateQueries({ queryKey: ["church-accounts"] });
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        <CreateChurchAccountDialog 
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["church-accounts"] });
          }}
        />
      </div>
    </AppLayout>
  );
}
