import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminNav } from "@/components/admin/AdminNav";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";
import { Search, UserPlus, UserMinus } from "lucide-react";

const AdminUsers = () => {
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  
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
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-2xl">{t("admin.users.title")}</CardTitle>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t("admin.users.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.users.email")}</TableHead>
                    <TableHead>{t("admin.users.name")}</TableHead>
                    <TableHead>{t("admin.users.roles")}</TableHead>
                    <TableHead>{t("admin.users.joined")}</TableHead>
                    <TableHead>{t("admin.users.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => {
                    const userRoles = user.user_roles?.map((r: any) => r.role) || [];
                    const hasAdmin = userRoles.includes("admin");
                    const hasWorshipLeader = userRoles.includes("worship_leader");
                    
                    return (
                      <TableRow key={user.id}>
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
                        <TableCell>
                          <div className="flex gap-2">
                            {!hasAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addRoleMutation.mutate({ userId: user.id, role: "admin" })}
                              >
                                <UserPlus className="w-3 h-3 mr-1" />
                                Admin
                              </Button>
                            )}
                            {hasAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeRoleMutation.mutate({ userId: user.id, role: "admin" })}
                              >
                                <UserMinus className="w-3 h-3 mr-1" />
                                Admin
                              </Button>
                            )}
                            {!hasWorshipLeader && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addRoleMutation.mutate({ userId: user.id, role: "worship_leader" })}
                              >
                                <UserPlus className="w-3 h-3 mr-1" />
                                Leader
                              </Button>
                            )}
                            {hasWorshipLeader && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeRoleMutation.mutate({ userId: user.id, role: "worship_leader" })}
                              >
                                <UserMinus className="w-3 h-3 mr-1" />
                                Leader
                              </Button>
                            )}
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
      </main>
    </div>
  );
};

export default AdminUsers;
