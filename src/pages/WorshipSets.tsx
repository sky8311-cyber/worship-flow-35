import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Upload, Music, Save, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";

export default function WorshipSets() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { user, isAdmin, isWorshipLeader, isCommunityLeaderInAnyCommunity } = useAuth();
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  
  // Check if user can manage a specific set
  const canManage = (set: any) => {
    if (isAdmin) return true;
    if (isWorshipLeader && set.created_by === user?.id) return true;
    if (isCommunityLeaderInAnyCommunity && set.created_by === user?.id) return true;
    return false;
  };
  
  // Check if user can create new sets
  const canCreateSets = isAdmin || isWorshipLeader || isCommunityLeaderInAnyCommunity;
  
  // History page shows ALL worship sets (no date filtering)
  const { data: sets, isLoading } = useQuery({
    queryKey: ["worship-sets-history", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("service_sets")
        .select(`
          *,
          set_songs(count)
        `)
        .order("date", { ascending: false });
      
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (setId: string) => {
      await supabase.from("set_songs").delete().eq("service_set_id", setId);
      const { error } = await supabase.from("service_sets").delete().eq("id", setId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("worshipSets.deleted"));
      queryClient.invalidateQueries({ queryKey: ["worship-sets-history"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
    },
  });
  
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "draft" ? "published" : "draft";
      const { error } = await supabase
        .from("service_sets")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worship-sets-history"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
      toast.success(t("worshipSets.statusChanged"));
    },
  });
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {canCreateSets && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate("/set-import")}
              >
                <Upload className="w-4 h-4" />
                {t("worshipSets.import")}
              </Button>
              <Button onClick={() => navigate("/set-builder")}>
                <Plus className="w-4 h-4" />
                {t("worshipSets.createNew")}
              </Button>
            </div>
          )}
        </div>
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Music className="w-4 h-4 sm:w-5 sm:h-5" />
              {t("worshipSets.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 sm:gap-3 mb-6">
              <Button 
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
              >
                {t("worshipSets.filterAll")}
              </Button>
              <Button 
                variant={statusFilter === "draft" ? "default" : "outline"}
                onClick={() => setStatusFilter("draft")}
              >
                {t("worshipSets.filterDraft")}
              </Button>
              <Button 
                variant={statusFilter === "published" ? "default" : "outline"}
                onClick={() => setStatusFilter("published")}
              >
                {t("worshipSets.filterPublished")}
              </Button>
            </div>
          
          {isLoading ? (
            <p>{t("common.loading")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("worshipSets.tableHeaders.date")}</TableHead>
                  <TableHead>{t("worshipSets.tableHeaders.serviceName")}</TableHead>
                  <TableHead>{t("worshipSets.tableHeaders.worshipLeader")}</TableHead>
                  <TableHead>{t("worshipSets.tableHeaders.songCount")}</TableHead>
                  <TableHead>{t("worshipSets.tableHeaders.status")}</TableHead>
                  <TableHead>{t("worshipSets.tableHeaders.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sets?.map((set) => (
                  <TableRow 
                    key={set.id} 
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => navigate(canManage(set) ? `/set-builder/${set.id}` : `/band-view/${set.id}`)}
                  >
                    <TableCell>{format(new Date(set.date), "yyyy-MM-dd")}</TableCell>
                    <TableCell className="font-medium">{set.service_name}</TableCell>
                    <TableCell>{set.worship_leader || "-"}</TableCell>
                    <TableCell>{set.set_songs?.[0]?.count || 0}{t("common.songs")}</TableCell>
                    <TableCell>
                      <Badge variant={set.status === "published" ? "default" : "secondary"}>
                        {set.status === "draft" ? t("worshipSets.filterDraft") : t("worshipSets.filterPublished")}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {canManage(set) ? (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => navigate(`/set-builder/${set.id}`)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => togglePublishMutation.mutate({ id: set.id, currentStatus: set.status })}
                          >
                            {set.status === "draft" ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => {
                              if (confirm(t("worshipSets.confirmDelete"))) {
                                deleteMutation.mutate(set.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="icon" variant="ghost" onClick={() => navigate(`/band-view/${set.id}`)}>
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
