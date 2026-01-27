import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/useTranslation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { RefreshCw, Eye, Users, Clock, TrendingDown } from "lucide-react";

const AdminAnalytics = () => {
  const { language } = useTranslation();
  const [dateRange, setDateRange] = useState("7");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(dateRange));

  // Fetch page views summary
  const { data: pageViews, isLoading: loadingViews, refetch: refetchViews } = useQuery({
    queryKey: ["admin-analytics-views", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_analytics")
        .select("page_path, duration_seconds, session_id, user_id")
        .gte("entered_at", startDate.toISOString());

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate metrics
  const totalViews = pageViews?.length || 0;
  const uniqueSessions = new Set(pageViews?.map(p => p.session_id)).size;
  const uniqueUsers = new Set(pageViews?.filter(p => p.user_id).map(p => p.user_id)).size;

  // Group by page path
  const pageStats = pageViews?.reduce((acc, view) => {
    if (!acc[view.page_path]) {
      acc[view.page_path] = { views: 0, totalDuration: 0, sessions: new Set() };
    }
    acc[view.page_path].views += 1;
    acc[view.page_path].totalDuration += view.duration_seconds || 0;
    acc[view.page_path].sessions.add(view.session_id);
    return acc;
  }, {} as Record<string, { views: number; totalDuration: number; sessions: Set<string> }>);

  // Top pages by views
  const topPages = Object.entries(pageStats || {})
    .map(([path, stats]) => ({
      path,
      views: stats.views,
      avgDuration: stats.views > 0 ? Math.round(stats.totalDuration / stats.views) : 0,
      sessions: stats.sessions.size,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Pages by average duration
  const pagesByDuration = [...topPages]
    .filter(p => p.avgDuration > 0)
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 10);

  // Bounce rate calculation (sessions with only 1 page view)
  const sessionPageCounts = pageViews?.reduce((acc, view) => {
    acc[view.session_id] = (acc[view.session_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const bouncedSessions = Object.values(sessionPageCounts || {}).filter(count => count === 1).length;
  const bounceRate = uniqueSessions > 0 ? Math.round((bouncedSessions / uniqueSessions) * 100) : 0;

  // Format duration for display
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleRefresh = () => {
    refetchViews();
  };

  const chartColors = [
    "hsl(var(--primary))",
    "hsl(var(--primary) / 0.9)",
    "hsl(var(--primary) / 0.8)",
    "hsl(var(--primary) / 0.7)",
    "hsl(var(--primary) / 0.6)",
    "hsl(var(--primary) / 0.5)",
    "hsl(var(--primary) / 0.4)",
    "hsl(var(--primary) / 0.35)",
    "hsl(var(--primary) / 0.3)",
    "hsl(var(--primary) / 0.25)",
  ];

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {language === "ko" ? "페이지 분석" : "Page Analytics"}
            </h1>
            <p className="text-muted-foreground">
              {language === "ko" ? "사용자 행동 및 페이지 성과 분석" : "User behavior and page performance analysis"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{language === "ko" ? "오늘" : "Today"}</SelectItem>
                <SelectItem value="7">{language === "ko" ? "7일" : "7 Days"}</SelectItem>
                <SelectItem value="30">{language === "ko" ? "30일" : "30 Days"}</SelectItem>
                <SelectItem value="90">{language === "ko" ? "90일" : "90 Days"}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Eye className="h-4 w-4" />
                <span className="text-sm">{language === "ko" ? "총 페이지뷰" : "Total Views"}</span>
              </div>
              {loadingViews ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">{language === "ko" ? "세션 수" : "Sessions"}</span>
              </div>
              {loadingViews ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold">{uniqueSessions.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">{language === "ko" ? "로그인 사용자" : "Logged Users"}</span>
              </div>
              {loadingViews ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold">{uniqueUsers.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm">{language === "ko" ? "이탈률" : "Bounce Rate"}</span>
              </div>
              {loadingViews ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold">{bounceRate}%</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Pages by Views */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {language === "ko" ? "인기 페이지" : "Top Pages by Views"}
              </CardTitle>
              <CardDescription>
                {language === "ko" ? "가장 많이 방문한 페이지" : "Most visited pages"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingViews ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : topPages.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topPages} layout="vertical" margin={{ left: 80, right: 20 }}>
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="path" 
                      width={80}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [value, language === "ko" ? "조회수" : "Views"]}
                      labelFormatter={(label) => `Path: ${label}`}
                    />
                    <Bar dataKey="views" radius={[0, 4, 4, 0]}>
                      {topPages.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {language === "ko" ? "데이터가 없습니다" : "No data available"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Average Duration by Page */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {language === "ko" ? "평균 체류 시간" : "Avg. Duration by Page"}
              </CardTitle>
              <CardDescription>
                {language === "ko" ? "페이지별 평균 머문 시간" : "Average time spent per page"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingViews ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : pagesByDuration.length > 0 ? (
                <div className="space-y-3">
                  {pagesByDuration.map((page, index) => (
                    <div key={page.path} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                        <span className="text-sm truncate" title={page.path}>
                          {page.path}
                        </span>
                      </div>
                      <span className="text-sm font-medium whitespace-nowrap ml-2">
                        {formatDuration(page.avgDuration)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {language === "ko" ? "데이터가 없습니다" : "No data available"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Page Stats Table */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "ko" ? "상세 페이지 통계" : "Detailed Page Stats"}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingViews ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">{language === "ko" ? "페이지" : "Page"}</th>
                      <th className="text-right py-2 px-2">{language === "ko" ? "조회수" : "Views"}</th>
                      <th className="text-right py-2 px-2">{language === "ko" ? "세션" : "Sessions"}</th>
                      <th className="text-right py-2 px-2">{language === "ko" ? "평균 시간" : "Avg. Time"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.map((page) => (
                      <tr key={page.path} className="border-b last:border-0">
                        <td className="py-2 px-2 font-mono text-xs">{page.path}</td>
                        <td className="text-right py-2 px-2">{page.views}</td>
                        <td className="text-right py-2 px-2">{page.sessions}</td>
                        <td className="text-right py-2 px-2">{formatDuration(page.avgDuration)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
