import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";

interface ServiceSet {
  id: string;
  date: string;
  service_name: string;
  worship_leader?: string | null;
}

interface UpcomingServicesWidgetProps {
  sets: ServiceSet[];
  maxVisible?: number;
}

export function UpcomingServicesWidget({ sets, maxVisible = 3 }: UpcomingServicesWidgetProps) {
  const { t } = useTranslation();

  const visibleSets = sets?.slice(0, maxVisible) || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          {t("dashboard.upcomingServices")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {visibleSets.length > 0 ? (
          <div className="space-y-2">
            {visibleSets.map((set) => (
              <Link
                key={set.id}
                to={`/set-builder/${set.id}`}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary shrink-0">
                  <span className="text-xs font-medium">
                    {format(new Date(set.date), "MMM")}
                  </span>
                  <span className="text-lg font-bold">
                    {format(new Date(set.date), "d")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{set.service_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {set.worship_leader || t("dashboard.noLeader")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">{t("dashboard.noUpcoming")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
