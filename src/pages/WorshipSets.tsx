import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Plus, Upload } from "lucide-react";
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
      toast.success("워십세트가 삭제되었습니다");
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
      toast.success("상태가 변경되었습니다");
    },
  });
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{t("worshipSets.history")}</h1>
          
          {canCreateSets && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/set-import")}>
                <Upload className="w-4 h-4 mr-1" />
                {t("worshipSets.import")}
              </Button>
              <Button onClick={() => navigate("/set-builder")}>
                <Plus className="w-4 h-4 mr-1" />
                {t("worshipSets.createNew")}
              </Button>
            </div>
          )}
        </div>
        
        <Card className="p-6">
          <div className="flex gap-2 mb-6">
            <Button 
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
            >
              전체
            </Button>
            <Button 
              variant={statusFilter === "draft" ? "default" : "outline"}
              onClick={() => setStatusFilter("draft")}
            >
              📝 임시저장
            </Button>
            <Button 
              variant={statusFilter === "published" ? "default" : "outline"}
              onClick={() => setStatusFilter("published")}
            >
              ✅ 게시됨
            </Button>
          </div>
          
          {isLoading ? (
            <p>로딩 중...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>예배명</TableHead>
                  <TableHead>예배인도자</TableHead>
                  <TableHead>곡 수</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>액션</TableHead>
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
                    <TableCell>{set.set_songs?.[0]?.count || 0}곡</TableCell>
                    <TableCell>
                      <Badge variant={set.status === "published" ? "default" : "secondary"}>
                        {set.status === "draft" ? "📝 임시저장" : "✅ 게시됨"}
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
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => {
                              if (confirm("정말 삭제하시겠습니까?")) {
                                deleteMutation.mutate(set.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="icon" variant="ghost" onClick={() => navigate(`/band-view/${set.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
