import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { CRMTabs } from "@/components/admin/crm/CRMTabs";
import { CRMTable } from "@/components/admin/crm/CRMTable";
import { DetailPanel } from "@/components/admin/crm/DetailPanel";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Search, Building2, Crown, Users, UserCheck } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export type CRMTab = "church_accounts" | "worship_leaders" | "communities" | "members";

export interface CRMEntity {
  id: string;
  type: CRMTab;
  data: any;
}

const AdminCRM = () => {
  const { t, language } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  
  const activeTab = (searchParams.get("tab") as CRMTab) || "church_accounts";
  const filterId = searchParams.get("filter");
  const filterType = searchParams.get("filterType");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<CRMEntity | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const setActiveTab = (tab: CRMTab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    // Clear filters when switching tabs unless navigating with cross-reference
    if (!filterId) {
      params.delete("filter");
      params.delete("filterType");
    }
    setSearchParams(params);
    setExpandedRows(new Set());
  };

  // Fetch all CRM data in parallel
  const { data: crmData, isLoading } = useQuery({
    queryKey: ["admin-crm-data"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const [
        churchAccountsResult,
        profilesResult,
        rolesResult,
        communitiesResult,
        communityMembersResult,
        premiumSubsResult,
        churchMembersResult,
        authResult
      ] = await Promise.all([
        supabase.from("church_accounts").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.from("worship_communities").select("*").order("created_at", { ascending: false }),
        supabase.from("community_members").select("*"),
        supabase.from("premium_subscriptions").select("*"),
        supabase.from("church_account_members").select("*"),
        supabase.functions.invoke("admin-list-users", {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }),
      ]);

      const churchAccounts = churchAccountsResult.data || [];
      const profiles = profilesResult.data || [];
      const userRoles = rolesResult.data || [];
      const communities = communitiesResult.data || [];
      const communityMembers = communityMembersResult.data || [];
      const premiumSubs = premiumSubsResult.data || [];
      const churchMembers = churchMembersResult.data || [];
      const authUsers = authResult.data?.users || [];

      // Create lookup maps
      const profilesMap = new Map(profiles.map(p => [p.id, p]));
      const premiumSubsMap = new Map(premiumSubs.map(s => [s.user_id, s]));
      
      // Process church accounts with enriched data
      const enrichedChurchAccounts = churchAccounts.map(account => {
        const owner = profilesMap.get(account.owner_id);
        const accountCommunities = communities.filter(c => c.church_account_id === account.id);
        const accountMembers = churchMembers.filter(m => m.church_account_id === account.id);
        
        return {
          ...account,
          owner,
          communities: accountCommunities,
          members: accountMembers.map(m => ({
            ...m,
            profile: profilesMap.get(m.user_id)
          })),
          communityCount: accountCommunities.length,
          memberCount: accountMembers.length,
        };
      });

      // Process worship leaders (users with worship_leader role)
      const worshipLeaderRoles = userRoles.filter(r => r.role === "worship_leader");
      const worshipLeaders = worshipLeaderRoles.map(role => {
        const profile = profilesMap.get(role.user_id);
        const authUser = authUsers.find((u: any) => u.id === role.user_id);
        const subscription = premiumSubsMap.get(role.user_id);
        const leaderCommunities = communities.filter(c => c.leader_id === role.user_id);
        
        // Check if part of a church account
        const churchMembership = churchMembers.find(m => m.user_id === role.user_id);
        const churchAccount = churchMembership 
          ? churchAccounts.find(ca => ca.id === churchMembership.church_account_id)
          : null;
        
        return {
          id: role.user_id,
          profile,
          authUser,
          subscription,
          isPremium: subscription?.subscription_status === "active" || !!churchAccount,
          communities: leaderCommunities,
          communityCount: leaderCommunities.length,
          churchAccount,
          createdAt: role.created_at,
        };
      });

      // Process communities with enriched data
      const enrichedCommunities = communities.map(community => {
        const leader = profilesMap.get(community.leader_id);
        const members = communityMembers
          .filter(m => m.community_id === community.id)
          .map(m => ({
            ...m,
            profile: profilesMap.get(m.user_id)
          }));
        const churchAccount = community.church_account_id 
          ? churchAccounts.find(ca => ca.id === community.church_account_id)
          : null;
        
        return {
          ...community,
          leader,
          members,
          memberCount: members.length,
          churchAccount,
        };
      });

      // Process all members (non worship leaders)
      const allMemberIds = new Set(communityMembers.map(m => m.user_id));
      const worshipLeaderIds = new Set(worshipLeaderRoles.map(r => r.user_id));
      
      const regularMembers = profiles
        .filter(p => allMemberIds.has(p.id) && !worshipLeaderIds.has(p.id))
        .map(profile => {
          const authUser = authUsers.find((u: any) => u.id === profile.id);
          const memberCommunities = communityMembers
            .filter(m => m.user_id === profile.id)
            .map(m => {
              const community = communities.find(c => c.id === m.community_id);
              return { ...m, community };
            });
          const roles = userRoles.filter(r => r.user_id === profile.id);
          
          return {
            id: profile.id,
            profile,
            authUser,
            communities: memberCommunities,
            communityCount: memberCommunities.length,
            roles,
          };
        });

      return {
        churchAccounts: enrichedChurchAccounts,
        worshipLeaders,
        communities: enrichedCommunities,
        members: regularMembers,
      };
    },
  });

  // Filter data based on search and cross-reference filters
  const filteredData = useMemo(() => {
    if (!crmData) return null;
    
    const query = searchQuery.toLowerCase();
    
    let result = { ...crmData };
    
    // Apply search filter
    if (query) {
      result.churchAccounts = result.churchAccounts.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.owner?.email?.toLowerCase().includes(query) ||
        a.owner?.full_name?.toLowerCase().includes(query)
      );
      result.worshipLeaders = result.worshipLeaders.filter(w =>
        w.profile?.email?.toLowerCase().includes(query) ||
        w.profile?.full_name?.toLowerCase().includes(query)
      );
      result.communities = result.communities.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.leader?.full_name?.toLowerCase().includes(query)
      );
      result.members = result.members.filter(m =>
        m.profile?.email?.toLowerCase().includes(query) ||
        m.profile?.full_name?.toLowerCase().includes(query)
      );
    }
    
    // Apply cross-reference filter
    if (filterId && filterType) {
      if (filterType === "church_account") {
        result.communities = result.communities.filter(c => c.church_account_id === filterId);
        result.worshipLeaders = result.worshipLeaders.filter(w => w.churchAccount?.id === filterId);
      } else if (filterType === "community") {
        result.members = result.members.filter(m => 
          m.communities.some((c: any) => c.community_id === filterId)
        );
      }
    }
    
    return result;
  }, [crmData, searchQuery, filterId, filterType]);

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleEntitySelect = (entity: CRMEntity) => {
    setSelectedEntity(entity);
  };

  const handleCrossReference = (type: CRMTab, id: string, filterType?: string) => {
    const params = new URLSearchParams();
    params.set("tab", type);
    if (filterType) {
      params.set("filter", id);
      params.set("filterType", filterType);
    }
    setSearchParams(params);
    setExpandedRows(new Set());
  };

  const clearFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("filter");
    params.delete("filterType");
    setSearchParams(params);
  };

  const getCurrentData = () => {
    if (!filteredData) return [];
    switch (activeTab) {
      case "church_accounts": return filteredData.churchAccounts;
      case "worship_leaders": return filteredData.worshipLeaders;
      case "communities": return filteredData.communities;
      case "members": return filteredData.members;
      default: return [];
    }
  };

  const getTabStats = () => {
    if (!crmData) return { church: 0, leaders: 0, communities: 0, members: 0 };
    return {
      church: crmData.churchAccounts.length,
      leaders: crmData.worshipLeaders.length,
      communities: crmData.communities.length,
      members: crmData.members.length,
    };
  };

  const stats = getTabStats();

  const detailPanelContent = selectedEntity && (
    <DetailPanel
      entity={selectedEntity}
      onClose={() => setSelectedEntity(null)}
      onCrossReference={handleCrossReference}
      language={language}
    />
  );

  return (
    <div className="min-h-[100dvh] bg-gradient-soft">
      <AdminNav />
      
      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {t("admin.crm.title") || "User Management CRM"}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {t("admin.crm.description") || "Unified view of all accounts, leaders, communities, and members"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card 
            className={`cursor-pointer transition-all ${activeTab === "church_accounts" ? "ring-2 ring-blue-500" : "hover:shadow-md"}`}
            onClick={() => setActiveTab("church_accounts")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.church}</div>
                <div className="text-xs text-muted-foreground">Church Accounts</div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all ${activeTab === "worship_leaders" ? "ring-2 ring-purple-500" : "hover:shadow-md"}`}
            onClick={() => setActiveTab("worship_leaders")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.leaders}</div>
                <div className="text-xs text-muted-foreground">Worship Leaders</div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all ${activeTab === "communities" ? "ring-2 ring-green-500" : "hover:shadow-md"}`}
            onClick={() => setActiveTab("communities")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.communities}</div>
                <div className="text-xs text-muted-foreground">Communities</div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all ${activeTab === "members" ? "ring-2 ring-orange-500" : "hover:shadow-md"}`}
            onClick={() => setActiveTab("members")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <UserCheck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.members}</div>
                <div className="text-xs text-muted-foreground">Team Members</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Tabs */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={t("admin.crm.searchPlaceholder") || "Search across all entities..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <CRMTabs 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            filterId={filterId}
            filterType={filterType}
            onClearFilter={clearFilter}
          />
        </div>

        {/* Main Content */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading CRM data...</p>
            </CardContent>
          </Card>
        ) : isMobile ? (
          // Mobile: Use full-width table with sheet for details
          <>
            <CRMTable
              activeTab={activeTab}
              data={getCurrentData()}
              expandedRows={expandedRows}
              onToggleExpand={toggleRowExpansion}
              onSelectEntity={handleEntitySelect}
              onCrossReference={handleCrossReference}
              language={language}
            />
            <Sheet open={!!selectedEntity} onOpenChange={() => setSelectedEntity(null)}>
              <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
                {detailPanelContent}
              </SheetContent>
            </Sheet>
          </>
        ) : (
          // Desktop: Resizable panels
          <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
            <ResizablePanel defaultSize={selectedEntity ? 65 : 100} minSize={50}>
              <div className="h-full overflow-auto bg-card">
                <CRMTable
                  activeTab={activeTab}
                  data={getCurrentData()}
                  expandedRows={expandedRows}
                  onToggleExpand={toggleRowExpansion}
                  onSelectEntity={handleEntitySelect}
                  onCrossReference={handleCrossReference}
                  language={language}
                />
              </div>
            </ResizablePanel>
            {selectedEntity && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                  <div className="h-full overflow-auto bg-muted/30 p-4">
                    {detailPanelContent}
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        )}
      </main>
    </div>
  );
};

export default AdminCRM;
