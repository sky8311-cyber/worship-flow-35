import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Settings, Plus, Crown, Shield, User, ChevronRight, CreditCard, Tag, Globe, Lock } from "lucide-react";
import { CreateChurchAccountDialog } from "@/components/church/CreateChurchAccountDialog";
import { ChurchAccountMembersTab } from "@/components/church/ChurchAccountMembersTab";
import { ChurchAccountCommunitiesTab } from "@/components/church/ChurchAccountCommunitiesTab";
import { ChurchAccountSettingsTab } from "@/components/church/ChurchAccountSettingsTab";
import { ChurchCustomRolesTab } from "@/components/church/ChurchCustomRolesTab";
import { ChurchBillingTab } from "@/components/church/ChurchBillingTab";
import { ChurchCustomDomainTab } from "@/components/church/ChurchCustomDomainTab";
import { UpgradePlanDialog } from "@/components/church/UpgradePlanDialog";
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
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showPlanSelectionDialog, setShowPlanSelectionDialog] = useState(false);

  // Handler for "Create Church Account" button - show plan selection first
  const handleCreateClick = () => {
    setShowPlanSelectionDialog(true);
  };

  // Handler when user accepts trial from plan dialog
  const handleStartTrialFromPlan = () => {
    setShowPlanSelectionDialog(false);
    setShowCreateDialog(true);
  };

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

  // Check if subscription is active for selected account
  const isSubscriptionActive = (account: ChurchAccount | null) => {
    if (!account) return false;
    if (account.subscription_status === "active") return true;
    if (account.subscription_status === "trial" && account.trial_ends_at) {
      return new Date(account.trial_ends_at) > new Date();
    }
    return false;
  };

  const getStatusBadge = (status: string, trialEndsAt?: string | null) => {
    const isTrialValid = status === "trial" && trialEndsAt && new Date(trialEndsAt) > new Date();
    if (isTrialValid) {
      return <Badge variant="secondary">{t("churchAccount.statusTrial")}</Badge>;
    }
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">{t("churchAccount.statusActive")}</Badge>;
      case "trial":
        return <Badge variant="outline" className="text-destructive border-destructive">{t("churchAccount.statusExpired")}</Badge>;
      case "past_due":
        return <Badge variant="destructive">{t("churchAccount.statusPastDue")}</Badge>;
      case "canceled":
        return <Badge variant="outline">{t("churchAccount.statusCanceled")}</Badge>;
      default:
        return <Badge variant="outline">{t("churchAccount.statusNotSubscribed")}</Badge>;
    }
  };

  const getRoleBadge = (role: string | null | undefined) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-yellow-500"><Crown className="w-3 h-3 mr-1" />{t("churchAccount.owner")}</Badge>;
      case "admin":
        return <Badge className="bg-blue-500"><Shield className="w-3 h-3 mr-1" />{t("churchAccount.admin")}</Badge>;
      default:
        return <Badge variant="outline"><User className="w-3 h-3 mr-1" />{t("churchAccount.member")}</Badge>;
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
                {t("churchAccount.worshipLeaderOnly")}
              </h2>
              <p className="text-muted-foreground">
                {t("churchAccount.worshipLeaderOnlyDesc")}
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              {t("churchAccount.title")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {t("churchAccount.manageMultiple")}
            </p>
          </div>
          <Button onClick={handleCreateClick} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            <span className="sm:inline">{t("churchAccount.create")}</span>
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
                {t("churchAccount.noChurchAccounts")}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t("churchAccount.noChurchAccountsDesc")}
              </p>
              <Button onClick={handleCreateClick} className="gap-2">
                <Plus className="w-4 h-4" />
                {t("churchAccount.createFirst")}
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
                      {getStatusBadge(account.subscription_status, account.trial_ends_at)}
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
              ← {t("churchAccount.backToList")}
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
                        {getStatusBadge(selectedAccount.subscription_status, selectedAccount.trial_ends_at)}
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
                      {t("churchAccount.seatsUsed")}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="communities">
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="mb-4 w-max sm:w-auto">
                  <TabsTrigger value="communities" className="gap-1 sm:gap-2 px-2 sm:px-3">
                    <Building2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{language === "ko" ? "예배공동체" : "Communities"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="members" className="gap-1 sm:gap-2 px-2 sm:px-3">
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">{language === "ko" ? "멤버" : "Members"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="roles" className="gap-1 sm:gap-2 px-2 sm:px-3">
                    <Tag className="w-4 h-4" />
                    <span className="hidden sm:inline">{language === "ko" ? "역할" : "Roles"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="billing" className="gap-1 sm:gap-2 px-2 sm:px-3">
                    <CreditCard className="w-4 h-4" />
                    <span className="hidden sm:inline">{language === "ko" ? "구독/결제" : "Billing"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="domain" className="gap-1 sm:gap-2 px-2 sm:px-3">
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">{language === "ko" ? "도메인" : "Domain"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="gap-1 sm:gap-2 px-2 sm:px-3">
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">{language === "ko" ? "설정" : "Settings"}</span>
                  </TabsTrigger>
                </TabsList>
              </div>

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
                {isSubscriptionActive(selectedAccount) ? (
                  <ChurchCustomRolesTab 
                    churchAccountId={selectedAccount.id}
                    isAdmin={getUserRole(selectedAccount as any) === "owner" || getUserRole(selectedAccount as any) === "admin"}
                  />
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {t("churchAccount.subscriptionRequired")}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {t("churchAccount.customRolesRequired")}
                      </p>
                      <Button onClick={() => setShowUpgradeDialog(true)}>
                        {t("churchAccount.choosePlanButton")}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="billing">
                <ChurchBillingTab 
                  churchAccount={selectedAccount}
                  isOwner={getUserRole(selectedAccount as any) === "owner"}
                />
              </TabsContent>

              <TabsContent value="domain">
                {isSubscriptionActive(selectedAccount) ? (
                  <ChurchCustomDomainTab 
                    churchAccount={selectedAccount}
                    isOwner={getUserRole(selectedAccount as any) === "owner"}
                    onUpdate={() => {
                      queryClient.invalidateQueries({ queryKey: ["church-accounts"] });
                    }}
                  />
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {t("churchAccount.subscriptionRequired")}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {t("churchAccount.customDomainRequired")}
                      </p>
                      <Button onClick={() => setShowUpgradeDialog(true)}>
                        {t("churchAccount.choosePlanButton")}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="settings">
                {isSubscriptionActive(selectedAccount) ? (
                  <ChurchAccountSettingsTab 
                    churchAccount={selectedAccount}
                    isOwner={getUserRole(selectedAccount as any) === "owner"}
                    onUpdate={() => {
                      queryClient.invalidateQueries({ queryKey: ["church-accounts"] });
                    }}
                  />
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {t("churchAccount.subscriptionRequired")}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {t("churchAccount.brandingRequired")}
                      </p>
                      <Button onClick={() => setShowUpgradeDialog(true)}>
                        {t("churchAccount.choosePlanButton")}
                      </Button>
                    </CardContent>
                  </Card>
                )}
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

        {/* Upgrade dialog for existing accounts */}
        <UpgradePlanDialog 
          open={showUpgradeDialog} 
          onOpenChange={setShowUpgradeDialog}
          onStartTrial={async () => {
            if (!selectedAccount) return;
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 30);
            
            const { error } = await supabase
              .from("church_accounts")
              .update({ 
                subscription_status: "trial",
                trial_ends_at: trialEndDate.toISOString()
              })
              .eq("id", selectedAccount.id);

            if (!error) {
              queryClient.invalidateQueries({ queryKey: ["church-accounts"] });
              queryClient.invalidateQueries({ queryKey: ["church-subscription-status"] });
              setShowUpgradeDialog(false);
            }
          }}
          onSubscribe={async () => {
            if (!selectedAccount) return;
            const { data, error } = await supabase.functions.invoke("create-church-checkout", {
              body: { churchAccountId: selectedAccount.id },
            });
            if (data?.url) {
              window.open(data.url, "_blank");
            }
            setShowUpgradeDialog(false);
          }}
        />

        {/* Plan selection dialog for new account creation */}
        <UpgradePlanDialog 
          open={showPlanSelectionDialog} 
          onOpenChange={setShowPlanSelectionDialog}
          onStartTrial={handleStartTrialFromPlan}
          onSubscribe={handleStartTrialFromPlan}
        />
      </div>
    </AppLayout>
  );
}
