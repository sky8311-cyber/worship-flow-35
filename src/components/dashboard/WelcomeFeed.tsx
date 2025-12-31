import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Crown, Users, Music, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { WelcomePostComposer } from "./WelcomePostComposer";
import { WelcomePostCard } from "./WelcomePostCard";

interface WelcomeFeedProps {
  userName?: string;
}

export function WelcomeFeed({ userName }: WelcomeFeedProps) {
  const { language } = useTranslation();
  const { isAdmin } = useAuth();

  // Fetch welcome posts
  const { data: welcomePosts, isLoading } = useQuery({
    queryKey: ["welcome-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("welcome_posts")
        .select(`
          *,
          author:profiles!welcome_posts_author_id_fkey(id, full_name, avatar_url)
        `)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4 p-4">
      {/* Welcome Message Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-primary" />
            {language === "ko"
              ? `${userName || "회원"}님, 환영합니다! 🎉`
              : `Welcome, ${userName || "User"}! 🎉`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {language === "ko"
              ? "KWorship에 오신 것을 환영합니다! 예배를 사랑하는 사람들을 위한 공간입니다."
              : "Welcome to KWorship! A place for those who love worship."}
          </p>

          {/* Worship Leader Approval CTA */}
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Crown className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {language === "ko"
                  ? "예배인도자로 승인 신청하세요!"
                  : "Apply for Worship Leader!"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {language === "ko"
                  ? "승인되면 공동체 및 워십세트 생성이 가능해집니다. 대부분 즉시 승인됩니다."
                  : "Upon approval, you can create communities and worship sets. Usually approved instantly."}
              </p>
              <Button size="sm" className="mt-3" asChild>
                <Link to="/request-worship-leader">
                  <Crown className="w-4 h-4 mr-1" />
                  {language === "ko" ? "승인 신청하기" : "Apply Now"}
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Feature Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4 text-primary" />
              <span>{language === "ko" ? "공동체 참여" : "Join Communities"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Music className="w-4 h-4 text-primary" />
              <span>{language === "ko" ? "찬양 라이브러리" : "Song Library"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>{language === "ko" ? "악보 관리" : "Score Management"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Post Composer */}
      {isAdmin && <WelcomePostComposer />}

      {/* Welcome Posts */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {language === "ko" ? "로딩 중..." : "Loading..."}
        </div>
      ) : welcomePosts && welcomePosts.length > 0 ? (
        <div className="space-y-4">
          {welcomePosts.map((post) => (
            <WelcomePostCard key={post.id} post={post} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
