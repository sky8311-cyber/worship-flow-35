import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Award, ArrowLeft, Check, BookOpen, Circle, PartyPopper } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const InstituteCertification = () => {
  const { certId } = useParams<{ certId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { language } = useTranslation();
  const [showBadgeDialog, setShowBadgeDialog] = useState(false);
  const [awardedBadge, setAwardedBadge] = useState<any>(null);

  const { data: cert } = useQuery({
    queryKey: ["institute-certification", certId],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_certifications").select("*").eq("id", certId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!certId,
  });

  const { data: certCourses = [] } = useQuery({
    queryKey: ["institute-cert-courses", certId],
    queryFn: async () => {
      const { data: links, error } = await supabase
        .from("institute_certification_courses")
        .select("course_id, sort_order")
        .eq("certification_id", certId!)
        .order("sort_order");
      if (error) throw error;
      if (!links || links.length === 0) return [];

      const courseIds = links.map((l) => l.course_id).filter(Boolean) as string[];
      const { data: courses } = await supabase
        .from("institute_courses")
        .select("id, title_ko, title, instructor_user_id")
        .in("id", courseIds);

      const courseMap = new Map((courses || []).map((c) => [c.id, c]));
      return links
        .map((l) => ({ ...courseMap.get(l.course_id!), sort_order: l.sort_order }))
        .filter((c): c is any => !!c.id);
    },
    enabled: !!certId,
  });

  const { data: instructors = [] } = useQuery({
    queryKey: ["institute-instructors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institute_instructors").select("user_id, display_name");
      if (error) throw error;
      return data || [];
    },
  });

  const courseIds = certCourses.map((c: any) => c.id).filter(Boolean);
  const { data: enrollments = [] } = useQuery({
    queryKey: ["institute-cert-enrollments", user?.id, courseIds.join(",")],
    queryFn: async () => {
      if (!user?.id || courseIds.length === 0) return [];
      const { data, error } = await supabase
        .from("institute_enrollments")
        .select("course_id, completed_at, completed_modules")
        .eq("user_id", user.id)
        .in("course_id", courseIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && courseIds.length > 0,
  });
  const enrollmentMap = new Map(enrollments.map((e) => [e.course_id, e]));

  const completedCount = enrollments.filter((e) => e.completed_at).length;
  const allCompleted = completedCount === certCourses.length && certCourses.length > 0;
  const remaining = certCourses.length - completedCount;

  const getInstructorName = (userId: string | null) => {
    if (!userId) return null;
    return instructors.find((i) => i.user_id === userId)?.display_name || null;
  };

  const awardBadge = useMutation({
    mutationFn: async () => {
      await supabase.auth.refreshSession();
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-institute-badge`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ user_id: user!.id, certification_id: certId }),
        }
      );
      if (!resp.ok) throw new Error("Failed to award badge");
      return resp.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setAwardedBadge(data.badge);
        setShowBadgeDialog(true);
        queryClient.invalidateQueries({ queryKey: ["institute-cert-enrollments"] });
        queryClient.invalidateQueries({ queryKey: ["institute-badges"] });
      } else if (data.reason === "courses_incomplete") {
        toast({ title: language === "ko" ? "아직 완료하지 않은 과정이 있습니다" : "Some courses are not yet completed" });
      }
    },
    onError: () => {
      toast({ title: language === "ko" ? "배지 발급에 실패했습니다" : "Failed to award badge", variant: "destructive" });
    },
  });

  if (!cert) return <AppLayout><div className="p-8 text-center text-muted-foreground">Loading...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/institute")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {language === "ko" ? "목록으로" : "Back"}
        </Button>

        <div className="flex items-start gap-4 mb-6">
          {cert.badge_image_url ? (
            <img src={cert.badge_image_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Award className="w-8 h-8 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{cert.title_ko}</h1>
            {cert.description_ko && (
              <p className="text-sm text-muted-foreground mt-1">{cert.description_ko}</p>
            )}
            <Badge variant="outline" className="mt-2 text-primary border-primary/30">
              K-Worship Certified
            </Badge>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-3">
          {language === "ko" ? "포함 과목" : "Included Courses"} ({certCourses.length})
        </h2>
        <div className="space-y-2 mb-6">
          {certCourses.map((course: any) => {
            const enrollment = enrollmentMap.get(course.id);
            const isCompleted = !!enrollment?.completed_at;
            const isInProgress = !!enrollment && !enrollment.completed_at;
            const instructorName = getInstructorName(course.instructor_user_id);

            return (
              <Link key={course.id} to={`/institute/${course.id}`}>
                <Card className="p-4 hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    ) : isInProgress ? (
                      <div className="w-6 h-6 rounded-full bg-accent/50 flex items-center justify-center">
                        <BookOpen className="w-3.5 h-3.5 text-accent-foreground" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-muted-foreground/30 flex items-center justify-center">
                        <Circle className="w-3 h-3 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{course.title_ko}</p>
                      {instructorName && (
                        <p className="text-xs text-muted-foreground">{instructorName}</p>
                      )}
                    </div>
                    {isCompleted && (
                      <Badge variant="secondary" className="text-xs">
                        {language === "ko" ? "완료" : "Done"}
                      </Badge>
                    )}
                    {isInProgress && (
                      <Badge variant="outline" className="text-xs">
                        {language === "ko" ? "수강 중" : "In progress"}
                      </Badge>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card className="p-5 text-center">
          {allCompleted ? (
            <div className="space-y-3">
              <Award className="w-10 h-10 text-primary mx-auto" />
              <p className="font-semibold">
                {language === "ko" ? "모든 과정을 완료했습니다!" : "All courses completed!"}
              </p>
              <Button onClick={() => awardBadge.mutate()} disabled={awardBadge.isPending}>
                <Award className="w-4 h-4 mr-2" />
                {language === "ko" ? "K-Worship Certified 배지 신청" : "Request K-Worship Certified Badge"}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {language === "ko"
                  ? `${remaining}개 과정을 완료하면 배지를 신청할 수 있습니다.`
                  : `Complete ${remaining} more course${remaining > 1 ? "s" : ""} to request the badge.`}
              </p>
              <Button disabled variant="secondary">
                <Award className="w-4 h-4 mr-2" />
                {language === "ko" ? "K-Worship Certified 배지 신청" : "Request Badge"}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Badge awarded dialog */}
      <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-primary" />
              K-Worship Certified
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              {cert.badge_image_url && (
                <img src={cert.badge_image_url} alt="" className="w-20 h-20 rounded-xl object-cover mx-auto" />
              )}
              <p className="text-center font-medium">{cert.title_ko}</p>
              <p className="text-center text-sm">
                {language === "ko"
                  ? "K-Worship Certified 자격을 취득하셨습니다. 프로필에서 배지를 확인하세요."
                  : "You have earned your K-Worship Certified credential. Check your profile for the badge."}
              </p>
              {awardedBadge?.awarded_at && (
                <p className="text-center text-xs text-muted-foreground">
                  {new Date(awardedBadge.awarded_at).toLocaleDateString(language === "ko" ? "ko-KR" : "en-US")}
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowBadgeDialog(false)}>
              {language === "ko" ? "확인" : "OK"}
            </Button>
            <Button onClick={() => { setShowBadgeDialog(false); navigate("/dashboard"); }}>
              {language === "ko" ? "프로필 보기" : "View Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default InstituteCertification;
