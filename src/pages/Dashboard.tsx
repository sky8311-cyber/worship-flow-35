import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Music, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: upcomingSets, isLoading } = useQuery({
    queryKey: ["upcoming-sets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_sets")
        .select("*")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const { data: songsCount } = useQuery({
    queryKey: ["songs-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("songs")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count;
    },
  });

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">예배 세트리스트</h1>
                <p className="text-sm text-muted-foreground">찬양 관리 시스템</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">전체 곡</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {songsCount || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">곡이 등록되어 있습니다</p>
              <Link to="/songs">
                <Button variant="outline" className="w-full mt-4">
                  곡 라이브러리 보기
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">다가오는 예배</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {upcomingSets?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">예배가 예정되어 있습니다</p>
              <Button 
                onClick={() => navigate("/set-builder")}
                className="w-full mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                새 예배 세트 만들기
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>다가오는 예배 세트</CardTitle>
                <CardDescription>예정된 예배 일정</CardDescription>
              </div>
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
            ) : upcomingSets && upcomingSets.length > 0 ? (
              <div className="space-y-3">
                {upcomingSets.map((set) => (
                  <Link key={set.id} to={`/set-builder/${set.id}`}>
                    <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">
                              {set.service_name}
                            </h3>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(set.date), "yyyy년 M월 d일 (EEE)", { locale: ko })}
                            </span>
                          </div>
                          {set.worship_leader && (
                            <p className="text-sm text-muted-foreground mt-1">
                              인도자: {set.worship_leader}
                            </p>
                          )}
                          {set.theme && (
                            <p className="text-sm text-muted-foreground mt-1">
                              주제: {set.theme}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">아직 예정된 예배 세트가 없습니다</p>
                <Button onClick={() => navigate("/set-builder")}>
                  <Plus className="w-4 h-4 mr-2" />
                  첫 번째 예배 세트 만들기
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg md:hidden">
        <div className="flex justify-around py-3">
          <Link to="/" className="flex flex-col items-center gap-1 px-4 py-2 text-primary">
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-medium">홈</span>
          </Link>
          <Link to="/songs" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">
            <Music className="w-5 h-5" />
            <span className="text-xs font-medium">곡 라이브러리</span>
          </Link>
          <button
            onClick={() => navigate("/set-builder")}
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-medium">새 세트</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
