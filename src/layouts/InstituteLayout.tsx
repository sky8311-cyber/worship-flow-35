import { GraduationCap } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAuth } from "@/contexts/AuthContext";
import { FeatureComingSoon } from "@/components/common/FeatureComingSoon";
import { InstituteHeader } from "@/components/institute/InstituteHeader";
import { InstituteBottomNav } from "@/components/institute/InstituteBottomNav";

interface InstituteLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  showBackButton?: boolean;
  breadcrumb?: React.ReactNode;
  fullHeight?: boolean;
}

export function InstituteLayout({ children, pageTitle, showBackButton, breadcrumb, fullHeight }: InstituteLayoutProps) {
  const { isInstituteEnabled, isLoading } = useAppSettings();

  if (!isLoading && !isInstituteEnabled) {
    return (
      <FeatureComingSoon
        featureName="K-Worship Institute"
        featureNameKo="K-Worship 인스티튜트"
        description="Online certification courses for worship leaders are coming soon."
        descriptionKo="예배인도자와 예배팀 멤버들을 위한 온라인스쿨이 곧 시작됩니다!"
        icon={GraduationCap}
      />
    );
  }

  if (fullHeight) {
    return (
      <div className="h-[100dvh] flex flex-col bg-gradient-soft">
        <InstituteHeader breadcrumb={breadcrumb} />
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
        <InstituteBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-soft">
      <InstituteHeader breadcrumb={breadcrumb} />
      <main
        className="pb-36 lg:pb-8"
        style={{ paddingBottom: "max(9rem, calc(6rem + env(safe-area-inset-bottom, 0px)))" }}
      >
        {children}
      </main>
      <InstituteBottomNav />
    </div>
  );
}
