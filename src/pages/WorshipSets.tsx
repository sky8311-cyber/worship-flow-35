import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Home, Plus } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

export default function WorshipSets() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  
  const { data: sets, isLoading } = useQuery({
    queryKey: ["worship-sets", statusFilter],
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
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (setId: string) => {
      await supabase.from("set_songs").delete().eq("service_set_id", setId);
      const { error } = await supabase.from("service_sets").delete().eq("id", setId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("워십세트가 삭제되었습니다");
      queryClient.invalidateQueries({ queryKey: ["worship-sets"] });
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
      queryClient.invalidateQueries({ queryKey: ["worship-sets"] });
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
      toast.success("상태가 변경되었습니다");
    },
  });
  
  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 items-center py-4">
            <div className="flex items-center gap-2">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon">
                  <Home className="w-5 h-5" />
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground hidden md:inline">/ 워십세트</span>
            </div>
            
            <Link to="/dashboard" className="flex justify-center">
              <img src={logo} alt="K-Worship" className="h-20 cursor-pointer" />
            </Link>
            
            <div className="flex justify-end gap-2">
              <Button onClick={() => navigate("/set-builder")}>
                <Plus className="w-4 h-4 mr-1" />
                새 워십세트
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
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
                    onClick={() => navigate(`/set-builder/${set.id}`)}
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </main>
    </div>
  );
}
