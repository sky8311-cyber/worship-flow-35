import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Music, FileText } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { useTranslation } from "@/hooks/useTranslation";

const AdminDashboard = () => {
  const { t } = useTranslation();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [users, communities, sets, songs] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("worship_communities").select("*", { count: "exact", head: true }),
        supabase.from("service_sets").select("*", { count: "exact", head: true }),
        supabase.from("songs").select("*", { count: "exact", head: true }),
      ]);
      
      return {
        users: users.count || 0,
        communities: communities.count || 0,
        sets: sets.count || 0,
        songs: songs.count || 0,
      };
    },
  });
  
  const statCards = [
    {
      title: t("admin.stats.totalUsers"),
      value: stats?.users || 0,
      icon: Users,
      description: t("admin.stats.registeredUsers"),
      color: "text-blue-500",
    },
    {
      title: t("admin.stats.communities"),
      value: stats?.communities || 0,
      icon: Building2,
      description: t("admin.stats.activeCommunities"),
      color: "text-green-500",
    },
    {
      title: t("admin.stats.serviceSets"),
      value: stats?.sets || 0,
      icon: FileText,
      description: t("admin.stats.totalSets"),
      color: "text-purple-500",
    },
    {
      title: t("admin.stats.songs"),
      value: stats?.songs || 0,
      icon: Music,
      description: t("admin.stats.totalSongs"),
      color: "text-pink-500",
    },
  ];
  
  return (
    <div className="min-h-[100dvh] bg-gradient-soft">
      <AdminNav />
      
      <main className="container mx-auto px-4 py-8 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("admin.dashboard.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("admin.dashboard.subtitle")}
          </p>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading statistics...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {card.value}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
