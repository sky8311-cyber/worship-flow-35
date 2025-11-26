import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useTranslation } from "@/hooks/useTranslation";

interface WaitlistCardProps {
  entry: {
    id: string;
    name: string | null;
    email: string;
    role: string | null;
    church_name: string | null;
    country: string | null;
    k_spirit_meaning: string | null;
    created_at: string;
  };
}

export function WaitlistCard({ entry }: WaitlistCardProps) {
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium">{entry.name || "-"}</p>
              <p className="text-sm text-muted-foreground">{entry.email}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(entry.created_at), "PP", { locale: dateLocale })}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
            <div>
              <p className="text-muted-foreground text-xs">{t("admin.waitlist.role")}</p>
              <p className="font-medium">{entry.role || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t("admin.waitlist.country")}</p>
              <p className="font-medium">{entry.country || "-"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs">{t("admin.waitlist.church")}</p>
              <p className="font-medium">{entry.church_name || "-"}</p>
            </div>
            {entry.k_spirit_meaning && (
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs">{t("admin.waitlist.kSpirit")}</p>
                <p className="text-sm line-clamp-2">{entry.k_spirit_meaning}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
