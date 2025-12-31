import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { UnifiedHierarchyTable } from "@/components/admin/crm/UnifiedHierarchyTable";
import { HierarchyNode, EntityType } from "@/components/admin/crm/HierarchyRow";
import { DetailPanel } from "@/components/admin/crm/DetailPanel";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Search, Building2, Crown, Users, UserCheck, ChevronDown, ChevronRight } from "lucide-react";
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
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<CRMEntity | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<EntityType | "all">("all");

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
        // Keep raw data for hierarchy building
        raw: {
          communities: enrichedCommunities,
          communityMembers,
          worshipLeaders,
          churchMembers,
        }
      };
    },
  });

  // Build hierarchical tree structure
  const hierarchyData = useMemo((): HierarchyNode[] => {
    if (!crmData) return [];
    
    const query = searchQuery.toLowerCase();
    const nodes: HierarchyNode[] = [];

    // Helper to check if entity matches search
    const matchesSearch = (text: string | undefined | null) => 
      !query || (text?.toLowerCase().includes(query) ?? false);

    // Build member nodes for a community
    const buildMemberNodes = (communityId: string): HierarchyNode[] => {
      return crmData.raw.communityMembers
        .filter(m => m.community_id === communityId)
        .map(m => {
          const profile = crmData.members.find(mem => mem.id === m.user_id)?.profile 
            || crmData.worshipLeaders.find(wl => wl.id === m.user_id)?.profile;
          return {
            id: `member-${communityId}-${m.user_id}`,
            type: "member" as EntityType,
            data: { ...m, profile, role: m.role },
            children: [],
          };
        })
        .filter(node => matchesSearch(node.data.profile?.full_name) || matchesSearch(node.data.profile?.email));
    };

    // Build community nodes for a worship leader
    const buildCommunityNodes = (leaderId: string): HierarchyNode[] => {
      return crmData.raw.communities
        .filter(c => c.leader_id === leaderId)
        .map(community => ({
          id: community.id,
          type: "community" as EntityType,
          data: community,
          children: buildMemberNodes(community.id),
        }))
        .filter(node => matchesSearch(node.data.name) || node.children.length > 0);
    };

    // Build worship leader nodes for a church account
    const buildWorshipLeaderNodes = (churchAccountId: string): HierarchyNode[] => {
      return crmData.worshipLeaders
        .filter(wl => wl.churchAccount?.id === churchAccountId)
        .map(leader => ({
          id: leader.id,
          type: "worship_leader" as EntityType,
          data: leader,
          children: buildCommunityNodes(leader.id),
        }))
        .filter(node => 
          matchesSearch(node.data.profile?.full_name) || 
          matchesSearch(node.data.profile?.email) || 
          node.children.length > 0
        );
    };

    // 1. Add Church Accounts as root nodes
    crmData.churchAccounts.forEach(account => {
      const churchNode: HierarchyNode = {
        id: account.id,
        type: "church_account",
        data: account,
        children: buildWorshipLeaderNodes(account.id),
      };
      
      if (matchesSearch(account.name) || matchesSearch(account.owner?.email) || churchNode.children.length > 0) {
        nodes.push(churchNode);
      }
    });

    // 2. Add Independent Worship Leaders (not under any church account) as root nodes
    const independentLeaders = crmData.worshipLeaders.filter(wl => !wl.churchAccount);
    independentLeaders.forEach(leader => {
      const leaderNode: HierarchyNode = {
        id: leader.id,
        type: "worship_leader",
        data: leader,
        children: buildCommunityNodes(leader.id),
      };
      
      if (matchesSearch(leader.profile?.full_name) || matchesSearch(leader.profile?.email) || leaderNode.children.length > 0) {
        nodes.push(leaderNode);
      }
    });

    return nodes;
  }, [crmData, searchQuery]);

  const toggleNodeExpand = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectEntity = useCallback((node: HierarchyNode) => {
    // Map entity type for DetailPanel compatibility
    const typeMap: Record<EntityType, CRMTab> = {
      church_account: "church_accounts",
      worship_leader: "worship_leaders",
      community: "communities",
      member: "members",
    };
    setSelectedEntity({
      id: node.id,
      type: typeMap[node.type],
      data: node.data,
    });
  }, []);

  const handleCrossReference = (type: CRMTab, id: string, filterType?: string) => {
    // When cross-referencing, expand to that entity and select it
    const typeMap: Record<CRMTab, EntityType> = {
      church_accounts: "church_account",
      worship_leaders: "worship_leader",
      communities: "community",
      members: "member",
    };
    setTypeFilter(typeMap[type]);
  };

  // Collect all expandable node IDs
  const collectAllIds = useCallback((nodes: HierarchyNode[]): string[] => {
    const ids: string[] = [];
    const collect = (nodeList: HierarchyNode[]) => {
      nodeList.forEach(node => {
        if (node.children.length > 0) {
          ids.push(node.id);
          collect(node.children);
        }
      });
    };
    collect(nodes);
    return ids;
  }, []);

  const expandAll = useCallback(() => {
    const allIds = collectAllIds(hierarchyData);
    setExpandedNodes(new Set(allIds));
  }, [hierarchyData, collectAllIds]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  const getStats = () => {
    if (!crmData) return { church: 0, leaders: 0, communities: 0, members: 0 };
    return {
      church: crmData.churchAccounts.length,
      leaders: crmData.worshipLeaders.length,
      communities: crmData.communities.length,
      members: crmData.members.length,
    };
  };

  const stats = getStats();

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
            User Management CRM
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Unified hierarchical view of all accounts, leaders, communities, and members
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card 
            className={`cursor-pointer transition-all ${typeFilter === "church_account" ? "ring-2 ring-blue-500" : "hover:shadow-md"}`}
            onClick={() => setTypeFilter(typeFilter === "church_account" ? "all" : "church_account")}
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
            className={`cursor-pointer transition-all ${typeFilter === "worship_leader" ? "ring-2 ring-purple-500" : "hover:shadow-md"}`}
            onClick={() => setTypeFilter(typeFilter === "worship_leader" ? "all" : "worship_leader")}
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
            className={`cursor-pointer transition-all ${typeFilter === "community" ? "ring-2 ring-green-500" : "hover:shadow-md"}`}
            onClick={() => setTypeFilter(typeFilter === "community" ? "all" : "community")}
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
            className={`cursor-pointer transition-all ${typeFilter === "member" ? "ring-2 ring-orange-500" : "hover:shadow-md"}`}
            onClick={() => setTypeFilter(typeFilter === "member" ? "all" : "member")}
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

        {/* Toolbar: Search + View Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search across all entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* View Controls */}
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as EntityType | "all")}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="church_account">Church Accounts</SelectItem>
                <SelectItem value="worship_leader">Worship Leaders</SelectItem>
                <SelectItem value="community">Communities</SelectItem>
                <SelectItem value="member">Members</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={expandAll} className="gap-1.5">
              <ChevronDown className="h-4 w-4" />
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll} className="gap-1.5">
              <ChevronRight className="h-4 w-4" />
              Collapse
            </Button>
          </div>
        </div>

        {/* Filter indicator */}
        {typeFilter !== "all" && (
          <div className="mb-4 px-4 py-2 bg-muted rounded-lg flex items-center justify-between">
            <span className="text-sm">
              Showing only <strong className="capitalize">{typeFilter.replace("_", " ")}s</strong>
            </span>
            <Button variant="ghost" size="sm" onClick={() => setTypeFilter("all")}>
              Clear filter
            </Button>
          </div>
        )}

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
            <Card className="overflow-hidden">
              <UnifiedHierarchyTable
                nodes={hierarchyData}
                expandedNodes={expandedNodes}
                onToggleExpand={toggleNodeExpand}
                onSelectEntity={handleSelectEntity}
                typeFilter={typeFilter}
              />
            </Card>
            <Sheet open={!!selectedEntity} onOpenChange={() => setSelectedEntity(null)}>
              <SheetContent side="bottom" className="h-[60vh] overflow-y-auto">
                {detailPanelContent}
              </SheetContent>
            </Sheet>
          </>
        ) : (
          // Desktop: Resizable panels
          <PanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
            <Panel defaultSize={selectedEntity ? 65 : 100} minSize={50}>
              <div className="h-full overflow-auto bg-card">
                <UnifiedHierarchyTable
                  nodes={hierarchyData}
                  expandedNodes={expandedNodes}
                  onToggleExpand={toggleNodeExpand}
                  onSelectEntity={handleSelectEntity}
                  typeFilter={typeFilter}
                />
              </div>
            </Panel>
            {selectedEntity && (
              <>
                <PanelResizeHandle className="w-2 bg-border hover:bg-primary/20 transition-colors" />
                <Panel defaultSize={35} minSize={25} maxSize={50}>
                  <div className="h-full overflow-auto bg-muted/30 p-4">
                    {detailPanelContent}
                  </div>
                </Panel>
              </>
            )}
          </PanelGroup>
        )}
      </main>
    </div>
  );
};

export default AdminCRM;
