import { useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppSettings } from "@/hooks/useAppSettings";
import { FeatureComingSoon } from "@/components/common/FeatureComingSoon";

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

  return (
    <AppLayout showBackButton={showBackButton} breadcrumb={breadcrumb} fullHeight={fullHeight}>
      {children}
    </AppLayout>
  );
}
