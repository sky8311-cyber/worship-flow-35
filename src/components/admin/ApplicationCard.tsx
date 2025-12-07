import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useTranslation } from "@/hooks/useTranslation";

interface ApplicationCardProps {
  application: {
    id: string;
    user_id: string;
    church_name: string;
    church_website: string;
    denomination: string;
    country: string;
    position: string;
    years_serving: number;
    introduction: string;
    status: string;
    created_at: string;
    profiles?: {
      full_name: string;
      email: string;
      avatar_url: string | null;
    };
  };
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isLoading?: boolean;
}

export function ApplicationCard({ application, onApprove, onReject, isLoading }: ApplicationCardProps) {
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">{t("admin.applications.pending")}</Badge>;
      case "approved":
        return <Badge className="bg-green-500">{t("admin.applications.approved")}</Badge>;
      case "rejected":
        return <Badge variant="destructive">{t("admin.applications.rejected")}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={application.profiles?.avatar_url || ""} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {application.profiles?.full_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium">{application.profiles?.full_name}</p>
            <p className="text-sm text-muted-foreground truncate">{application.profiles?.email}</p>
            <p className="text-xs text-muted-foreground">
              {t("admin.applications.appliedDate")}: {format(new Date(application.created_at), "PP", { locale: dateLocale })}
            </p>
          </div>
          <div>
            {getStatusBadge(application.status)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div>
            <p className="text-muted-foreground text-xs">{t("worshipLeaderRequest.communityName")}</p>
            <p className="font-medium truncate">{application.church_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t("worshipLeaderRequest.servingPosition")}</p>
            <p className="font-medium truncate">{application.position}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t("worshipLeaderRequest.country")}</p>
            <p className="font-medium truncate">{application.country || "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t("worshipLeaderRequest.yearsServing")}</p>
            <p className="font-medium">{application.years_serving}년</p>
          </div>
          {application.church_website && (
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs">{t("worshipLeaderRequest.website")}</p>
              <a 
                href={application.church_website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm truncate block"
              >
                {application.church_website}
              </a>
            </div>
          )}
        </div>

        {application.status === "pending" && (
          <TooltipProvider>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => onApprove(application.id)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">{t("admin.applications.approve")}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">
                  <p>{t("tooltips.approve")}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onReject(application.id)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">{t("admin.applications.reject")}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">
                  <p>{t("tooltips.reject")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
