import { useParams, useNavigate, Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { InstituteLayout } from "@/layouts/InstituteLayout";
import { Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
      const { data: courses } = await supabase.from("institute_courses").select("id, title_ko, title, instructor_user_id").in("id", courseIds);
      const courseMap = new Map((courses || []).map((c) => [c.id, c]));
      return links.map((l) => ({ ...courseMap.get(l.course_id!), sort_order: l.sort_order })).filter((c): c is any => !!c.id);
    },
    enabled: !!certId,
  });

  const courseIds = certCourses.map((c: any) => c.id).filter(Boolean);
  const { data: enrollments = [] } = useQuery({
    queryKey: ["institute-cert-enrollments", user?.id, courseIds.join(",")],
    queryFn: async () => {
      if (!user?.id || courseIds.length === 0) return [];
      const { data, error } = await supabase
        .from("institute_enrollments")
        .select("course_id, completed_at")
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

  const awardBadge = useMutation({
    mutationFn: async () => {
      await supabase.auth.refreshSession();
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-institute-badge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ user_id: user!.id, certification_id: certId }),
      });
      if (!resp.ok) throw new Error("Failed");
      return resp.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setAwardedBadge(data.badge);
        setShowBadgeDialog(true);
        queryClient.invalidateQueries({ queryKey: ["institute-cert-enrollments"] });
      } else if (data.reason === "courses_incomplete") {
        toast({ title: language === "ko" ? "아직 완료하지 않은 과정이 있습니다" : "Some courses are not yet completed" });
      }
    },
    onError: () => {
      toast({ title: language === "ko" ? "배지 발급에 실패했습니다" : "Failed to award badge", variant: "destructive" });
    },
  });

  if (!cert) {
    return (
      <InstituteLayout pageTitle={language === "ko" ? "자격증" : "Certification"} showBackButton>
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      </InstituteLayout>
    );
  }

  return (
  const certBreadcrumb = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild><Link to="/institute">Institute</Link></BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{cert.title_ko}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <InstituteLayout pageTitle={cert.title_ko} showBackButton breadcrumb={certBreadcrumb}>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Hero */}
        <Card className="mb-6">
          <CardContent className="p-5">
            <Badge variant="secondary" className="mb-3 text-[10px]">🎓 K-WORSHIP CERTIFIED</Badge>
            <div className="flex items-start gap-4 mt-2">
              {cert.badge_image_url ? (
                <img src={cert.badge_image_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="text-4xl flex-shrink-0">🎓</div>
              )}
              <div>
                <h1 className="text-xl font-bold text-foreground">{cert.title_ko}</h1>
                {cert.description_ko && (
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{cert.description_ko}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses */}
        <div className="flex items-center gap-2.5 mb-3">
          <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            포함 과목 ({certCourses.length})
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="flex flex-col gap-1.5 mb-6">
          {certCourses.map((course: any) => {
            const isCompleted = !!enrollmentMap.get(course.id)?.completed_at;
            return (
              <Link key={course.id} to={`/institute/${course.id}`} className="no-underline">
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {isCompleted && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-sm font-medium text-foreground">{course.title_ko}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Badge CTA */}
        <Card>
          <CardContent className="p-6 text-center">
            {allCompleted ? (
              <>
                <div className="text-4xl mb-3">🏆</div>
                <p className="text-sm font-bold text-foreground mb-4">
                  {language === "ko" ? "모든 과정을 완료했습니다!" : "All courses completed!"}
                </p>
                <Button onClick={() => awardBadge.mutate()} disabled={awardBadge.isPending}>
                  {language === "ko" ? "K-Worship Certified 배지 신청" : "Request K-Worship Certified Badge"}
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  {language === "ko"
                    ? `${remaining}개 과정을 완료하면 배지를 신청할 수 있습니다.`
                    : `Complete ${remaining} more course${remaining > 1 ? "s" : ""} to request the badge.`}
                </p>
                <Button disabled className="opacity-40">
                  {language === "ko" ? "K-Worship Certified 배지 신청" : "Request Badge"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Badge dialog */}
      <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
        <DialogContent className="max-w-xs text-center">
          {cert.badge_image_url ? (
            <img src={cert.badge_image_url} alt="" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3" />
          ) : (
            <div className="text-5xl mb-3">🎓</div>
          )}
          <h2 className="text-lg font-bold text-foreground">K-Worship Certified</h2>
          <div className="text-sm font-semibold text-primary mb-1">{cert.title_ko}</div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {language === "ko" ? "축하합니다! 자격을 취득하셨습니다." : "Congratulations! You've earned your certification."}
          </p>
          {awardedBadge?.awarded_at && (
            <p className="text-[11px] text-muted-foreground mt-1">
              {new Date(awardedBadge.awarded_at).toLocaleDateString(language === "ko" ? "ko-KR" : "en-US")}
            </p>
          )}
          <div className="flex gap-2 justify-center mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowBadgeDialog(false)}>
              {language === "ko" ? "확인" : "OK"}
            </Button>
            <Button size="sm" onClick={() => { setShowBadgeDialog(false); navigate("/dashboard"); }}>
              {language === "ko" ? "프로필 보기" : "View Profile"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </InstituteLayout>
  );
};

export default InstituteCertification;
