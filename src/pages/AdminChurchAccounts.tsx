import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Building2, Users, Crown, Globe, Palette } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface ChurchAccountData {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  slogan: string | null;
  owner_id: string;
  subscription_status: string;
  trial_ends_at: string | null;
  used_seats: number;
  max_seats: number;
  logo_url: string | null;
  custom_domain: string | null;
  domain_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  theme_config: any;
  created_at: string;
  owner?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  memberCount: number;
  roleCount: number;
  communityCount: number;
}

const AdminChurchAccounts = () => {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<ChurchAccountData | null>(null);

  const { data: churchAccounts, isLoading } = useQuery({
    queryKey: ["admin-church-accounts"],
    queryFn: async () => {
      // 1. Fetch church accounts
      const { data: accounts, error: accountsError } = await supabase
        .from("church_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (accountsError) throw accountsError;

      if (!accounts || accounts.length === 0) return [];

      // 2. Fetch owner profiles
      const ownerIds = accounts.map(a => a.owner_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", ownerIds);

      // 3. Fetch member counts
      const { data: memberCounts } = await supabase
        .from("church_account_members")
        .select("church_account_id");

      // 4. Fetch role counts
      const { data: roleCounts } = await supabase
        .from("church_custom_roles")
        .select("church_account_id");

      // 5. Fetch community counts
      const { data: communityCounts } = await supabase
        .from("worship_communities")
        .select("church_account_id")
        .not("church_account_id", "is", null);

      // Merge data
      return accounts.map(account => ({
        ...account,
        owner: profiles?.find(p => p.id === account.owner_id),
        memberCount: memberCounts?.filter(m => m.church_account_id === account.id).length || 0,
        roleCount: roleCounts?.filter(r => r.church_account_id === account.id).length || 0,
        communityCount: communityCounts?.filter(c => c.church_account_id === account.id).length || 0,
      })) as ChurchAccountData[];
    },
  });

  const filteredAccounts = churchAccounts?.filter(account => {
    const matchesStatus = statusFilter === "all" || account.subscription_status === statusFilter;
    const matchesSearch = 
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.owner?.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      trial: "bg-blue-500",
      active: "bg-green-500",
      canceled: "bg-gray-500",
      past_due: "bg-red-500",
    };
    return <Badge className={colors[status] || "bg-gray-500"}>{status}</Badge>;
  };

  const getTrialDaysRemaining = (trialEndsAt: string | null) => {
    if (!trialEndsAt) return null;
    const days = differenceInDays(new Date(trialEndsAt), new Date());
    if (days < 0) return t("admin.churchAccounts.expired");
    return t("admin.churchAccounts.daysRemaining", { days: days.toString() });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("admin.churchAccounts.title")}
          </h1>
          <p className="text-muted-foreground">
            Manage all worship community accounts, subscriptions, and settings
          </p>
        </div>

        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">{t("admin.churchAccounts.filterAll")}</TabsTrigger>
                <TabsTrigger value="trial">{t("admin.churchAccounts.filterTrial")}</TabsTrigger>
                <TabsTrigger value="active">{t("admin.churchAccounts.filterActive")}</TabsTrigger>
                <TabsTrigger value="canceled">{t("admin.churchAccounts.filterCanceled")}</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t("admin.churchAccounts.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading worship community accounts...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && (!filteredAccounts || filteredAccounts.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t("admin.churchAccounts.noAccounts")}</p>
              </CardContent>
            </Card>
          )}

          {/* Church Accounts Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAccounts?.map((account) => (
              <Card 
                key={account.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedAccount(account)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {account.logo_url ? (
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={account.logo_url} />
                            <AvatarFallback>{account.name[0]}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-foreground">{account.name}</h3>
                          {getStatusBadge(account.subscription_status)}
                        </div>
                      </div>
                    </div>

                    {/* Owner */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={account.owner?.avatar_url || undefined} />
                        <AvatarFallback>{account.owner?.full_name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{account.owner?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground truncate">{account.owner?.email}</p>
                      </div>
                    </div>

                    {/* Trial Info */}
                    {account.subscription_status === "trial" && account.trial_ends_at && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">
                          {t("admin.churchAccounts.trialEnds")}: {getTrialDaysRemaining(account.trial_ends_at)}
                        </p>
                      </div>
                    )}

                    {/* Seats */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{t("admin.churchAccounts.seats")}</span>
                        <span className="font-medium">{account.used_seats} / {account.max_seats}</span>
                      </div>
                      <Progress value={(account.used_seats / account.max_seats) * 100} />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">{account.roleCount}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.churchAccounts.customRoles")}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">{account.communityCount}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.churchAccounts.communities")}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">{account.memberCount}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.churchAccounts.members")}</div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2">
                      {account.stripe_customer_id && (
                        <Badge variant="outline" className="text-xs">
                          {t("admin.churchAccounts.stripeConnected")}
                        </Badge>
                      )}
                      {account.logo_url && (
                        <Badge variant="outline" className="text-xs">
                          {t("admin.churchAccounts.logoSet")}
                        </Badge>
                      )}
                      {account.custom_domain && (
                        <Badge variant="outline" className="text-xs">
                          {account.domain_status === "verified" 
                            ? t("admin.churchAccounts.domainVerified")
                            : t("admin.churchAccounts.domainPending")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      {selectedAccount && (
        <Dialog open={!!selectedAccount} onOpenChange={() => setSelectedAccount(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedAccount.logo_url ? (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedAccount.logo_url} />
                    <AvatarFallback>{selectedAccount.name[0]}</AvatarFallback>
                  </Avatar>
                ) : (
                  <Building2 className="w-10 h-10 text-muted-foreground" />
                )}
                <div>
                  <div>{selectedAccount.name}</div>
                  <div className="text-sm font-normal text-muted-foreground">
                    {t("admin.churchAccounts.viewDetails")}
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold mb-2">Basic Information</h3>
                <div className="space-y-2 text-sm">
                  {selectedAccount.description && (
                    <p className="text-muted-foreground">{selectedAccount.description}</p>
                  )}
                  {selectedAccount.slogan && (
                    <p className="italic text-muted-foreground">"{selectedAccount.slogan}"</p>
                  )}
                  {selectedAccount.website && (
                    <p>
                      <span className="text-muted-foreground">Website: </span>
                      <a href={selectedAccount.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {selectedAccount.website}
                      </a>
                    </p>
                  )}
                  <p>
                    <span className="text-muted-foreground">Created: </span>
                    {format(new Date(selectedAccount.created_at), "PPP")}
                  </p>
                </div>
              </div>

              {/* Owner */}
              <div>
                <h3 className="font-semibold mb-2">Owner</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedAccount.owner?.avatar_url || undefined} />
                    <AvatarFallback>{selectedAccount.owner?.full_name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedAccount.owner?.full_name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{selectedAccount.owner?.email}</p>
                  </div>
                </div>
              </div>

              {/* Subscription */}
              <div>
                <h3 className="font-semibold mb-2">Subscription</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    {getStatusBadge(selectedAccount.subscription_status)}
                  </div>
                  {selectedAccount.trial_ends_at && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Trial Ends: </span>
                      {format(new Date(selectedAccount.trial_ends_at), "PPP")} 
                      {" "}({getTrialDaysRemaining(selectedAccount.trial_ends_at)})
                    </p>
                  )}
                  {selectedAccount.stripe_customer_id && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Stripe Customer: </span>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{selectedAccount.stripe_customer_id}</code>
                    </p>
                  )}
                  {selectedAccount.stripe_subscription_id && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Stripe Subscription: </span>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{selectedAccount.stripe_subscription_id}</code>
                    </p>
                  )}
                </div>
              </div>

              {/* Seats */}
              <div>
                <h3 className="font-semibold mb-2">{t("admin.churchAccounts.seats")}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Used / Max</span>
                    <span className="font-medium">{selectedAccount.used_seats} / {selectedAccount.max_seats}</span>
                  </div>
                  <Progress value={(selectedAccount.used_seats / selectedAccount.max_seats) * 100} />
                  <p className="text-xs text-muted-foreground">
                    {selectedAccount.max_seats - selectedAccount.used_seats} seats available
                  </p>
                </div>
              </div>

              {/* Branding */}
              <div>
                <h3 className="font-semibold mb-2">{t("admin.churchAccounts.branding")}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedAccount.logo_url 
                        ? t("admin.churchAccounts.logoSet")
                        : t("admin.churchAccounts.logoNotSet")}
                    </span>
                  </div>
                  {selectedAccount.theme_config && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Theme Colors: </span>
                      <div className="flex gap-2 mt-1">
                        {selectedAccount.theme_config.primaryColor && (
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-6 h-6 rounded border" 
                              style={{ backgroundColor: selectedAccount.theme_config.primaryColor }}
                            />
                            <span className="text-xs text-muted-foreground">Primary</span>
                          </div>
                        )}
                        {selectedAccount.theme_config.accentColor && (
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-6 h-6 rounded border" 
                              style={{ backgroundColor: selectedAccount.theme_config.accentColor }}
                            />
                            <span className="text-xs text-muted-foreground">Accent</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Domain */}
              {selectedAccount.custom_domain && (
                <div>
                  <h3 className="font-semibold mb-2">{t("admin.churchAccounts.domain")}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-mono">{selectedAccount.custom_domain}</span>
                      <Badge variant="outline">
                        {selectedAccount.domain_status === "verified" 
                          ? t("admin.churchAccounts.domainVerified")
                          : selectedAccount.domain_status === "pending"
                          ? t("admin.churchAccounts.domainPending")
                          : t("admin.churchAccounts.domainNone")}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Summary */}
              <div>
                <h3 className="font-semibold mb-2">Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Crown className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <div className="text-2xl font-bold text-foreground">{selectedAccount.roleCount}</div>
                      <div className="text-xs text-muted-foreground">{t("admin.churchAccounts.customRoles")}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Building2 className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <div className="text-2xl font-bold text-foreground">{selectedAccount.communityCount}</div>
                      <div className="text-xs text-muted-foreground">{t("admin.churchAccounts.communities")}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Users className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <div className="text-2xl font-bold text-foreground">{selectedAccount.memberCount}</div>
                      <div className="text-xs text-muted-foreground">{t("admin.churchAccounts.members")}</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
};

export default AdminChurchAccounts;
