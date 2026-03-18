import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { UserCard } from "@/components/admin/UserCard";
import { AdminUserProfileDialog } from "@/components/admin/AdminUserProfileDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { format, formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Search, UserPlus, UserMinus, Trash2, KeyRound, LayoutGrid, List, CheckCircle, XCircle, Mail, Music, MoreHorizontal, Users, Crown } from "lucide-react";

const AdminUsers = () => {
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [verificationFilter, setVerificationFilter] = useState<"all" | "verified" | "unverified">("all");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string; userName: string }>({
    open: false,
    userId: "",
    userName: "",
  });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<{ open: boolean; count: number }>({
    open: false,
    count: 0,
  });
  const [resetDialog, setResetDialog] = useState<{ open: boolean; email: string; userName: string }>({
    open: false,
    email: "",
    userName: "",
  });
  const [profileDialog, setProfileDialog] = useState<{ open: boolean; userId: string | null }>({
    open: false,
    userId: null,
  });
  
  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode("card");
    }
  }, []);
  
  // Optimized parallel query fetching
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Get session first
      const { data: { session } } = await supabase.auth.getSession();
      
      // Fetch all data in parallel
      const [profilesResult, rolesResult, authResult, seedsResult, levelsResult, songsResult, communityMembersResult, communitiesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, full_name, created_at, last_active_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("user_roles")
          .select("user_id, role"),
        supabase.functions.invoke("admin-list-users", {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }),
        supabase
          .from("user_seeds")
          .select("user_id, total_seeds, current_level"),
        supabase
          .from("seed_levels")
          .select("level, emoji, badge_color, name_ko, name_en"),
        supabase
          .from("songs")
          .select("created_by"),
        supabase
          .from("community_members")
          .select("user_id, community_id"),
        supabase
          .from("worship_communities")
          .select("id, name, leader_id")
      ]);
      
      if (profilesResult.error) throw profilesResult.error;
      if (!profilesResult.data) return [];
      
      const profiles = profilesResult.data;
      const roles = rolesResult.data || [];
      const authUsers = authResult.data?.users || [];
      const seeds = seedsResult.data || [];
      const levels = levelsResult.data || [];
      const songs = songsResult.data || [];
      const communityMembers = communityMembersResult.data || [];
      const communities = communitiesResult.data || [];
      
      // Create lookup maps for O(1) access
      const seedsMap = new Map(seeds.map(s => [s.user_id, s]));
      const levelsMap = new Map(levels.map(l => [l.level, l]));
      const communitiesMap = new Map(communities.map(c => [c.id, c]));
      
      // Count songs per user
      const songCountMap = new Map<string, number>();
      songs.forEach(s => {
        if (s.created_by) {
          songCountMap.set(s.created_by, (songCountMap.get(s.created_by) || 0) + 1);
        }
      });
      
      // Build communities per user (including owned)
      const userCommunitiesMap = new Map<string, Array<{ id: string; name: string }>>();
      
      // Add communities where user is a member
      communityMembers.forEach(cm => {
        if (cm.user_id && cm.community_id) {
          const community = communitiesMap.get(cm.community_id);
          if (community) {
            const existing = userCommunitiesMap.get(cm.user_id) || [];
            if (!existing.find(c => c.id === community.id)) {
              existing.push({ id: community.id, name: community.name });
            }
            userCommunitiesMap.set(cm.user_id, existing);
          }
        }
      });
      
      // Add communities where user is leader
      communities.forEach(c => {
        if (c.leader_id) {
          const existing = userCommunitiesMap.get(c.leader_id) || [];
          if (!existing.find(comm => comm.id === c.id)) {
            existing.push({ id: c.id, name: c.name });
          }
          userCommunitiesMap.set(c.leader_id, existing);
        }
      });
      
      // Combine the data
      return profiles.map(profile => {
        const authUser = authUsers.find((u: any) => u.id === profile.id);
        const seedData = seedsMap.get(profile.id);
        const levelInfo = seedData ? levelsMap.get(seedData.current_level) : null;
        
        // Use last_active_at from profiles (more accurate), fallback to last_sign_in_at from auth
        const lastActivity = profile.last_active_at || authUser?.last_sign_in_at || null;
        
        return {
          ...profile,
          user_roles: roles?.filter(r => r.user_id === profile.id) || [],
          email_confirmed_at: authUser?.email_confirmed_at || null,
          last_sign_in_at: authUser?.last_sign_in_at || null,
          last_active_at: lastActivity,
          songCount: songCountMap.get(profile.id) || 0,
          communities: userCommunitiesMap.get(profile.id) || [],
          seedData: seedData ? {
            totalSeeds: seedData.total_seeds,
            level: seedData.current_level,
            emoji: levelInfo?.emoji || "🌱",
            badgeColor: levelInfo?.badge_color || "#22c55e",
            levelName: language === "ko" ? levelInfo?.name_ko : levelInfo?.name_en
          } : null
        };
      });
    },
  });
  
  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as any });
      
      if (error) throw error;

      // If adding worship_leader role, check for existing application data and update profiles table
      if (role === "worship_leader") {
        // Get admin profile for actor info
        const { data: { user: adminUser } } = await supabase.auth.getUser();
        const { data: adminProfile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", adminUser?.id)
          .single();

        // Send notification to the user
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "promoted_to_worship_leader",
          title: "워십리더로 승급되었습니다! / You're now a Worship Leader!",
          message: "이제 커뮤니티를 생성하고 예배팀을 이끌 수 있습니다. / You can now create communities and lead worship teams.",
          related_id: null,
          related_type: "role",
          metadata: { 
            new_role: "worship_leader",
            actor_id: adminUser?.id,
            actor_name: adminProfile?.full_name,
            actor_avatar: adminProfile?.avatar_url
          }
        });

        // Check if profile already has worship leader info
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("church_name, serving_position")
          .eq("id", userId)
          .single();

        if (!existingProfile?.church_name || !existingProfile?.serving_position) {
          // Check for approved or any application with data
          const { data: application } = await supabase
            .from("worship_leader_applications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (application) {
            // Update profiles table with application data
            const { error: profileUpdateError } = await supabase
              .from("profiles")
              .update({
                church_name: application.church_name,
                church_website: application.church_website,
                country: application.country,
                serving_position: application.position,
                years_serving: application.years_serving,
                worship_leader_intro: application.introduction,
                needs_worship_leader_profile: false
              })
              .eq("id", userId);

            if (!profileUpdateError) {
              // Mark application as approved if it was pending
              if (application.status === "pending") {
                const { data: { user } } = await supabase.auth.getUser();
                await supabase
                  .from("worship_leader_applications")
                  .update({ 
                    status: "approved",
                    reviewed_by: user?.id,
                    reviewed_at: new Date().toISOString()
                  })
                  .eq("id", application.id);
              }
              return;
            }
          }
          
          // No application found, set flag to prompt for profile completion
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ needs_worship_leader_profile: true })
            .eq("id", userId);
          
          if (profileError) throw profileError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("admin.users.roleAdded"));
    },
    onError: () => {
      toast.error(t("admin.users.roleAddError"));
    },
  });
  
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("admin.users.roleRemoved"));
    },
    onError: () => {
      toast.error(t("admin.users.roleRemoveError"));
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("admin.users.deleteSuccess"));
      setDeleteDialog({ open: false, userId: "", userName: "" });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("admin.users.deleteError"));
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send reset email");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(t("admin.users.resetPasswordSuccess"));
      setResetDialog({ open: false, email: "", userName: "" });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("admin.users.resetPasswordError"));
    },
  });

  // Confirm user mutation
  const confirmUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { data, error } = await supabase.functions.invoke("admin-confirm-user", {
        body: { userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("admin.users.confirmSuccess"));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Resend verification mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async ({ email, name }: { email: string; name: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { data, error } = await supabase.functions.invoke("admin-resend-verification", {
        body: { email, name },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(t("admin.users.resendSuccess"));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const bulkAddRoleMutation = useMutation({
    mutationFn: async ({ userIds, role }: { userIds: string[]; role: string }) => {
      const promises = userIds.map(userId =>
        supabase.from("user_roles").insert({ user_id: userId, role: role as any })
      );
      const results = await Promise.allSettled(promises);
      const failures = results.filter(r => r.status === "rejected");
      if (failures.length > 0) throw new Error(`${failures.length} operations failed`);
    },
    onSuccess: (_, { userIds }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("admin.users.bulkRoleAdded", { count: userIds.length }));
      setSelectedUsers(new Set());
    },
    onError: () => {
      toast.error(t("admin.users.bulkRoleAddError"));
    },
  });

  const bulkRemoveRoleMutation = useMutation({
    mutationFn: async ({ userIds, role }: { userIds: string[]; role: string }) => {
      const promises = userIds.map(userId =>
        supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any)
      );
      const results = await Promise.allSettled(promises);
      const failures = results.filter(r => r.status === "rejected");
      if (failures.length > 0) throw new Error(`${failures.length} operations failed`);
    },
    onSuccess: (_, { userIds }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("admin.users.bulkRoleRemoved", { count: userIds.length }));
      setSelectedUsers(new Set());
    },
    onError: () => {
      toast.error(t("admin.users.bulkRoleRemoveError"));
    },
  });

  const bulkResetPasswordMutation = useMutation({
    mutationFn: async (emails: string[]) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const promises = emails.map(email =>
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-password`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }).then(r => r.ok ? r.json() : Promise.reject(r))
      );
      
      const results = await Promise.allSettled(promises);
      const failures = results.filter(r => r.status === "rejected");
      if (failures.length > 0) throw new Error(`${failures.length} operations failed`);
    },
    onSuccess: (_, emails) => {
      toast.success(t("admin.users.bulkResetPasswordSuccess", { count: emails.length }));
      setSelectedUsers(new Set());
    },
    onError: () => {
      toast.error(t("admin.users.bulkResetPasswordError"));
    },
  });

  const bulkDeleteUserMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const results = await Promise.allSettled(
        userIds.map(userId =>
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
          }).then(r => r.ok ? r.json() : Promise.reject(r))
        )
      );
      
      const failures = results.filter(r => r.status === "rejected");
      if (failures.length > 0) throw new Error(`${failures.length} deletions failed`);
    },
    onSuccess: (_, userIds) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("admin.users.bulkDeleteSuccess", { count: userIds.length }));
      setSelectedUsers(new Set());
      setBulkDeleteDialog({ open: false, count: 0 });
    },
    onError: () => {
      toast.error(t("admin.users.bulkDeleteError"));
    },
  });

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers?.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers?.map(u => u.id) || []));
    }
  };
  
  const filteredUsers = users?.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower);
    
    // Apply verification filter
    let matchesVerification = true;
    if (verificationFilter === "verified") {
      matchesVerification = !!user.email_confirmed_at;
    } else if (verificationFilter === "unverified") {
      matchesVerification = !user.email_confirmed_at;
    }
    
    return matchesSearch && matchesVerification;
  }) || [];
  
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "worship_leader":
        return "default";
      default:
        return "secondary";
    }
  };
  
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 pb-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <CardTitle className="text-2xl">{t("admin.users.title")}</CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={t("admin.users.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === "card" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("card")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Tabs value={verificationFilter} onValueChange={(v) => setVerificationFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="all">{t("admin.users.filterAll")}</TabsTrigger>
                <TabsTrigger value="verified">{t("admin.users.filterVerified")}</TabsTrigger>
                <TabsTrigger value="unverified">{t("admin.users.filterUnverified")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers?.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setProfileDialog({ open: true, userId: user.id })}
                    className="cursor-pointer"
                  >
                    <UserCard
                      user={user}
                      seedData={user.seedData}
                      onAddRole={(userId, role) => addRoleMutation.mutate({ userId, role })}
                      onRemoveRole={(userId, role) => removeRoleMutation.mutate({ userId, role })}
                      onResetPassword={(email, userName) => setResetDialog({ open: true, email, userName })}
                      onDelete={(userId, userName) => setDeleteDialog({ open: true, userId, userName })}
                      onConfirmUser={(userId) => confirmUserMutation.mutate(userId)}
                      onResendVerification={(email, name) => resendVerificationMutation.mutate({ email, name })}
                      onToggleSelection={toggleUserSelection}
                      isSelected={selectedUsers.has(user.id)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === filteredUsers?.length && filteredUsers.length > 0}
                        onChange={toggleSelectAll}
                        className="cursor-pointer"
                      />
                    </TableHead>
                    <TableHead>{t("admin.users.name")}</TableHead>
                    <TableHead>{t("admin.users.verification")}</TableHead>
                    <TableHead>{t("admin.users.roles")}</TableHead>
                    <TableHead className="text-center">{language === "ko" ? "레벨/씨앗" : "Level/Seeds"}</TableHead>
                    <TableHead className="text-center">{language === "ko" ? "곡" : "Songs"}</TableHead>
                    <TableHead>{language === "ko" ? "커뮤니티" : "Community"}</TableHead>
                    <TableHead>{language === "ko" ? "마지막 활동" : "Last Active"}</TableHead>
                    <TableHead>{t("admin.users.joined")}</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => {
                    const userRoles = user.user_roles?.map((r: any) => r.role) || [];
                    const hasAdmin = userRoles.includes("admin");
                    const hasWorshipLeader = userRoles.includes("worship_leader");
                    
                    return (
                      <TableRow
                        key={user.id}
                        onClick={() => setProfileDialog({ open: true, userId: user.id })}
                        className="cursor-pointer"
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="cursor-pointer"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.full_name || "-"}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.email_confirmed_at ? (
                            <Badge variant="default" className="gap-1 text-xs">
                              <CheckCircle className="w-3 h-3" />
                              {t("admin.users.verified")}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <XCircle className="w-3 h-3" />
                              {t("admin.users.unverified")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {userRoles.map((role: string) => (
                              <Badge key={role} variant={getRoleBadgeVariant(role)} className="text-xs">
                                {role === "admin" ? "A" : role === "worship_leader" ? "WL" : "M"}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {user.seedData ? (
                            <span className="text-xs">
                              {user.seedData.emoji}Lv{user.seedData.level} ({user.seedData.totalSeeds}🌱)
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {user.songCount > 0 ? (
                            <div className="flex items-center justify-center gap-1">
                              <Music className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm font-medium">{user.songCount}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.communities.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs">{user.communities.length}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {user.last_active_at ? (
                            formatDistanceToNow(new Date(user.last_active_at), { 
                              addSuffix: true, 
                              locale: dateLocale 
                            })
                          ) : (
                            <span className="text-muted-foreground">{language === "ko" ? "없음" : "Never"}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(user.created_at), "yy.MM.dd", { locale: dateLocale })}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!hasAdmin ? (
                                <DropdownMenuItem onClick={() => addRoleMutation.mutate({ userId: user.id, role: "admin" })}>
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  {language === "ko" ? "Admin 추가" : "Add Admin"}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => removeRoleMutation.mutate({ userId: user.id, role: "admin" })}>
                                  <UserMinus className="w-4 h-4 mr-2" />
                                  {language === "ko" ? "Admin 제거" : "Remove Admin"}
                                </DropdownMenuItem>
                              )}
                              {!hasWorshipLeader ? (
                                <DropdownMenuItem onClick={() => addRoleMutation.mutate({ userId: user.id, role: "worship_leader" })}>
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  {language === "ko" ? "Leader 추가" : "Add Leader"}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => removeRoleMutation.mutate({ userId: user.id, role: "worship_leader" })}>
                                  <UserMinus className="w-4 h-4 mr-2" />
                                  {language === "ko" ? "Leader 제거" : "Remove Leader"}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {!user.email_confirmed_at && (
                                <>
                                  <DropdownMenuItem onClick={() => confirmUserMutation.mutate(user.id)}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {t("admin.users.confirmUser")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => resendVerificationMutation.mutate({ email: user.email, name: user.full_name || "" })}>
                                    <Mail className="w-4 h-4 mr-2" />
                                    {t("admin.users.resendVerification")}
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem onClick={() => setResetDialog({ open: true, email: user.email, userName: user.full_name || user.email })}>
                                <KeyRound className="w-4 h-4 mr-2" />
                                {t("admin.users.resetPassword")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => grantMembershipMutation.mutate({ userId: user.id, userName: user.full_name || user.email })}>
                                <Crown className="w-4 h-4 mr-2" />
                                {language === "ko" ? "정식멤버 부여" : "Grant Full Membership"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteDialog({ open: true, userId: user.id, userName: user.full_name || user.email })}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t("admin.users.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {selectedUsers.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 shadow-lg z-50">
            <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {t("admin.users.selectedCount", { count: selectedUsers.size })}
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkAddRoleMutation.mutate({ userIds: Array.from(selectedUsers), role: "worship_leader" })}
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  {t("admin.users.bulkAddWorshipLeader")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkRemoveRoleMutation.mutate({ userIds: Array.from(selectedUsers), role: "worship_leader" })}
                >
                  <UserMinus className="w-4 h-4 mr-1" />
                  {t("admin.users.bulkRemoveWorshipLeader")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const emails = filteredUsers?.filter(u => selectedUsers.has(u.id)).map(u => u.email) || [];
                    bulkResetPasswordMutation.mutate(emails);
                  }}
                >
                  <KeyRound className="w-4 h-4 mr-1" />
                  {t("admin.users.bulkResetPassword")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setBulkDeleteDialog({ open: true, count: selectedUsers.size })}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {t("admin.users.bulkDelete")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, userId: "", userName: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.users.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.users.deleteConfirmDescription", { name: deleteDialog.userName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserMutation.mutate(deleteDialog.userId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialog.open} onOpenChange={(open) => !open && setBulkDeleteDialog({ open: false, count: 0 })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.users.bulkDeleteConfirmTitle", { count: bulkDeleteDialog.count })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.users.bulkDeleteConfirmDescription", { count: bulkDeleteDialog.count })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteUserMutation.mutate(Array.from(selectedUsers))}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Confirmation Dialog */}
      <AlertDialog open={resetDialog.open} onOpenChange={(open) => !open && setResetDialog({ open: false, email: "", userName: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.users.resetPasswordConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.users.resetPasswordConfirmDescription", { name: resetDialog.userName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => resetPasswordMutation.mutate(resetDialog.email)}>
              {t("admin.users.resetPassword")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Profile Dialog */}
      <AdminUserProfileDialog
        open={profileDialog.open}
        onOpenChange={(open) => setProfileDialog({ open, userId: open ? profileDialog.userId : null })}
        userId={profileDialog.userId}
      />
    </AdminLayout>
  );
};

export default AdminUsers;
