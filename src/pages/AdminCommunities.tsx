import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminNav } from "@/components/admin/AdminNav";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { Users } from "lucide-react";

const AdminCommunities = () => {
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;
  const queryClient = useQueryClient();
  
  const { data: communities, isLoading } = useQuery({
    queryKey: ["admin-communities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_communities")
        .select(`
          *,
          profiles!worship_communities_leader_id_fkey (
            full_name,
            email
          ),
          community_members (
            count
          ),
          service_sets (
            count
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
  
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("worship_communities")
        .update({ is_active: isActive })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-communities"] });
      toast.success(t("admin.communities.statusUpdated"));
    },
    onError: () => {
      toast.error(t("admin.communities.statusUpdateError"));
    },
  });
  
  return (
    <div className="min-h-screen bg-gradient-soft">
      <AdminNav />
      
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t("admin.communities.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading communities...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.communities.name")}</TableHead>
                    <TableHead>{t("admin.communities.leader")}</TableHead>
                    <TableHead>{t("admin.communities.members")}</TableHead>
                    <TableHead>{t("admin.communities.sets")}</TableHead>
                    <TableHead>{t("admin.communities.created")}</TableHead>
                    <TableHead>{t("admin.communities.status")}</TableHead>
                    <TableHead>{t("admin.communities.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communities?.map((community) => {
                    const leader = community.profiles as any;
                    const memberCount = community.community_members?.length || 0;
                    const setCount = community.service_sets?.length || 0;
                    
                    return (
                      <TableRow key={community.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{community.name}</div>
                            {community.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {community.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{leader?.full_name || "-"}</div>
                            <div className="text-xs text-muted-foreground">{leader?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{memberCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>{setCount}</TableCell>
                        <TableCell>
                          {format(new Date(community.created_at), "PPP", { locale: dateLocale })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={community.is_active ? "default" : "secondary"}>
                            {community.is_active ? t("admin.communities.active") : t("admin.communities.inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={community.is_active}
                              onCheckedChange={(checked) =>
                                toggleActiveMutation.mutate({ id: community.id, isActive: checked })
                              }
                            />
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

export default AdminCommunities;
