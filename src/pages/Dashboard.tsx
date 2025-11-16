import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Music, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageToggle } from "@/components/LanguageToggle";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;

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
                <h1 className="text-2xl font-bold text-foreground">{t("dashboard.title")}</h1>
                <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
              </div>
            </div>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("dashboard.totalSongs")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {songsCount || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{t("dashboard.songsRegistered")}</p>
              <Link to="/songs">
                <Button variant="outline" className="w-full mt-4">
                  {t("dashboard.viewLibrary")}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("dashboard.upcomingServices")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {upcomingSets?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{t("dashboard.servicesScheduled")}</p>
              <Button 
                onClick={() => navigate("/set-builder")}
                className="w-full mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("dashboard.createNewSet")}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("dashboard.upcomingSets")}</CardTitle>
                <CardDescription>{t("dashboard.scheduledServices")}</CardDescription>
              </div>
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">{t("common.loading")}</div>
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
                              {format(new Date(set.date), language === "ko" ? "yyyy년 M월 d일 (EEE)" : "MMM d, yyyy (EEE)", { locale: dateLocale })}
                            </span>
                          </div>
                          {set.worship_leader && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {t("dashboard.leader")}: {set.worship_leader}
                            </p>
                          )}
                          {set.theme && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {t("dashboard.theme")}: {set.theme}
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
                <p className="text-muted-foreground mb-4">{t("dashboard.noUpcoming")}</p>
                <Button onClick={() => navigate("/set-builder")}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("dashboard.createFirst")}
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
            <span className="text-xs font-medium">{t("common.home")}</span>
          </Link>
          <Link to="/songs" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">
            <Music className="w-5 h-5" />
            <span className="text-xs font-medium">{t("common.songLibrary")}</span>
          </Link>
          <button
            onClick={() => navigate("/set-builder")}
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-medium">{t("dashboard.createNewSet")}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
