import { Lock, LogIn, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { AppLayout } from "@/components/layout/AppLayout";

interface BandViewAccessGateProps {
  variant: "team" | "link" | "login";
  setId?: string;
}

export const BandViewAccessGate = ({ variant, setId }: BandViewAccessGateProps) => {
  const navigate = useNavigate();
  const { language } = useTranslation();

  const config = {
    team: {
      icon: Lock,
      title: language === "ko" ? "이 워십세트는 팀원 전용입니다" : "This worship set is for team members only",
      desc:
        language === "ko"
          ? "이 세트는 비공개 악보를 포함하고 있어 해당 커뮤니티 팀원만 볼 수 있어요."
          : "This set contains private scores and is visible only to community team members.",
      action: null as null | { label: string; onClick: () => void },
    },
    link: {
      icon: LinkIcon,
      title: language === "ko" ? "유효하지 않은 공유 링크입니다" : "Invalid share link",
      desc:
        language === "ko"
          ? "공유 링크가 만료되었거나 잘못되었습니다. 워십리더에게 새 링크를 요청해 주세요."
          : "This share link is invalid or expired. Please request a new link from the worship leader.",
      action: null,
    },
    login: {
      icon: LogIn,
      title: language === "ko" ? "로그인이 필요합니다" : "Login required",
      desc:
        language === "ko"
          ? "팀 전용 워십세트를 보려면 로그인해 주세요."
          : "Please log in to view this team-only worship set.",
      action: {
        label: language === "ko" ? "로그인" : "Log in",
        onClick: () => {
          const redirect = setId ? `/band-view/${setId}` : "/";
          navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
        },
      },
    },
  }[variant];

  const Icon = config.icon;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Icon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-semibold">{config.title}</h1>
            <p className="text-sm text-muted-foreground">{config.desc}</p>
            {config.action && (
              <Button onClick={config.action.onClick} className="mt-2">
                {config.action.label}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};
