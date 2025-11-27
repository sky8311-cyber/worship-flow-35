import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AdminNav } from "@/components/admin/AdminNav";
import { UserCard } from "@/components/admin/UserCard";
import { AdminUserProfileDialog } from "@/components/admin/AdminUserProfileDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, UserPlus, UserMinus, Trash2, KeyRound, LayoutGrid, List } from "lucide-react";

const AdminUsers = () => {
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
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
  
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false });
      
      if (profilesError) throw profilesError;
      if (!profiles) return [];
      
      // Then get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      
      if (rolesError) throw rolesError;
      
      // Combine the data
      return profiles.map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.id) || [],
      }));
    },
  });
  
  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as any });
      
      if (error) throw error;

      // If adding worship_leader role, set needs_worship_leader_profile flag
      if (role === "worship_leader") {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ needs_worship_leader_profile: true })
          .eq("id", userId);
        
        if (profileError) throw profileError;
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
  
  const filteredUsers = users?.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
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
    <div className="min-h-[100dvh] bg-gradient-soft">
      <AdminNav />
      
      <main className="container mx-auto px-4 py-8 pb-8">
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
                      onAddRole={(userId, role) => addRoleMutation.mutate({ userId, role })}
                      onRemoveRole={(userId, role) => removeRoleMutation.mutate({ userId, role })}
                      onResetPassword={(email, userName) => setResetDialog({ open: true, email, userName })}
                      onDelete={(userId, userName) => setDeleteDialog({ open: true, userId, userName })}
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
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === filteredUsers?.length && filteredUsers.length > 0}
                        onChange={toggleSelectAll}
                        className="cursor-pointer"
                      />
                    </TableHead>
                    <TableHead>{t("admin.users.email")}</TableHead>
                    <TableHead>{t("admin.users.name")}</TableHead>
                    <TableHead>{t("admin.users.roles")}</TableHead>
                    <TableHead>{t("admin.users.joined")}</TableHead>
                    <TableHead>{t("admin.users.roleManagement")}</TableHead>
                    <TableHead>{t("admin.users.userActions")}</TableHead>
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
                        <TableCell
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.full_name || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            {userRoles.map((role: string) => (
                              <Badge key={role} variant={getRoleBadgeVariant(role)}>
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), "PPP", { locale: dateLocale })}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2 flex-wrap">
                            {!hasAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addRoleMutation.mutate({ userId: user.id, role: "admin" });
                                }}
                              >
                                <UserPlus className="w-3 h-3 mr-1" />
                                Admin
                              </Button>
                            )}
                            {hasAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeRoleMutation.mutate({ userId: user.id, role: "admin" });
                                }}
                              >
                                <UserMinus className="w-3 h-3 mr-1" />
                                Admin
                              </Button>
                            )}
                            {!hasWorshipLeader && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addRoleMutation.mutate({ userId: user.id, role: "worship_leader" });
                                }}
                              >
                                <UserPlus className="w-3 h-3 mr-1" />
                                Leader
                              </Button>
                            )}
                            {hasWorshipLeader && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeRoleMutation.mutate({ userId: user.id, role: "worship_leader" });
                                }}
                              >
                                <UserMinus className="w-3 h-3 mr-1" />
                                Leader
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setResetDialog({ open: true, email: user.email, userName: user.full_name || user.email });
                              }}
                            >
                              <KeyRound className="w-3 h-3 mr-1" />
                              {t("admin.users.resetPassword")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteDialog({ open: true, userId: user.id, userName: user.full_name || user.email });
                              }}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              {t("admin.users.delete")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Profile Dialog */}
        <AdminUserProfileDialog
          userId={profileDialog.userId}
          open={profileDialog.open}
          onOpenChange={(open) => setProfileDialog({ open, userId: open ? profileDialog.userId : null })}
        />
      </main>

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {t("admin.users.selectedCount", { count: selectedUsers.size })}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedUsers(new Set())}
                >
                  {t("common.clearSelection")}
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const userIds = Array.from(selectedUsers);
                    bulkAddRoleMutation.mutate({ userIds, role: "worship_leader" });
                  }}
                >
                  {t("admin.users.bulkAddWorshipLeader")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const userIds = Array.from(selectedUsers);
                    bulkRemoveRoleMutation.mutate({ userIds, role: "worship_leader" });
                  }}
                >
                  {t("admin.users.bulkRemoveWorshipLeader")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const emails = filteredUsers
                      ?.filter(u => selectedUsers.has(u.id))
                      .map(u => u.email) || [];
                    bulkResetPasswordMutation.mutate(emails);
                  }}
                >
                  {t("admin.users.bulkResetPassword")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setBulkDeleteDialog({ open: true, count: selectedUsers.size })}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  {t("admin.users.bulkDelete")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
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
              {t("admin.users.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Confirmation Dialog */}
      <AlertDialog open={resetDialog.open} onOpenChange={(open) => setResetDialog({ ...resetDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.users.resetPasswordConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.users.resetPasswordConfirmDescription", { name: resetDialog.userName, email: resetDialog.email })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => resetPasswordMutation.mutate(resetDialog.email)}>
              {t("admin.users.sendResetEmail")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialog.open} onOpenChange={(open) => setBulkDeleteDialog({ ...bulkDeleteDialog, open })}>
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
              onClick={() => {
                const userIds = Array.from(selectedUsers);
                bulkDeleteUserMutation.mutate(userIds);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("admin.users.bulkDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
