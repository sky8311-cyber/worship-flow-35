import { Calendar, Music, Cake } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useTranslation } from "@/hooks/useTranslation";
import { Badge } from "@/components/ui/badge";

interface SystemMessageProps {
  type: "worship_set" | "calendar_event" | "birthday";
  data: any;
  community: { name: string };
  createdAt: string;
}

export function SystemMessage({ type, data, community, createdAt }: SystemMessageProps) {
  const { t, language } = useTranslation();

  // Parse date string as local date to avoid timezone issues
  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  if (type === "worship_set") {
    const dateText = parseLocalDate(data.date).toLocaleDateString(
      language === "ko" ? "ko-KR" : "en-US"
    );

    return (
      <div className="flex justify-center my-4">
        <div 
          className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 cursor-pointer hover:bg-primary/20 transition-colors"
          onClick={() => window.location.assign(`/band-view/${data.id}`)}
        >
          <Music className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs text-foreground">
            <span className="font-medium">{community.name}</span>
            {" · "}
            <span className="font-semibold">{data.service_name}</span>
            {" "}
            <span className="text-muted-foreground">({dateText})</span>
          </span>
          <Badge variant="secondary" className="text-xs h-5">
            {language === "ko" ? "더보기" : "View"}
          </Badge>
        </div>
      </div>
    );
  }

  if (type === "calendar_event") {
    const dateText = parseLocalDate(data.event_date).toLocaleDateString(
      language === "ko" ? "ko-KR" : "en-US"
    );
    const timeText = data.start_time ? ` ${data.start_time}` : "";

    const eventTypeLabels: Record<string, { ko: string; en: string }> = {
      rehearsal: { ko: "연습", en: "Rehearsal" },
      meeting: { ko: "모임", en: "Meeting" },
      worship_service: { ko: "예배", en: "Worship Service" },
      other: { ko: "기타", en: "Other" },
    };
    const eventTypeLabel = eventTypeLabels[data.event_type] || eventTypeLabels.other;

    return (
      <div className="flex justify-center my-4">
        <div className="inline-flex items-center gap-2 bg-accent/10 rounded-full px-4 py-2">
          <Calendar className="w-4 h-4 text-accent shrink-0" />
          <span className="text-xs text-foreground">
            <span className="font-medium">{community.name}</span>
            {" · "}
            <span className="font-semibold">{data.title}</span>
            {" "}
            <span className="text-muted-foreground">
              ({dateText}{timeText})
            </span>
          </span>
          <Badge variant="outline" className="text-xs h-5">
            {language === "ko" ? eventTypeLabel.ko : eventTypeLabel.en}
          </Badge>
        </div>
      </div>
    );
  }

  if (type === "birthday") {
    const birthDateText = data.birth_date
      ? parseLocalDate(data.birth_date).toLocaleDateString(
          language === "ko" ? "ko-KR" : "en-US",
          { month: "long", day: "numeric" }
        )
      : null;

    return (
      <div className="flex justify-center my-4">
        <div className="inline-flex items-center gap-2 bg-pink-500/10 rounded-full px-4 py-2">
          <Cake className="w-4 h-4 text-pink-500 shrink-0" />
          <span className="text-xs text-foreground">
            🎂{" "}
            <span className="font-semibold">{data.full_name}</span>
            {language === "ko" ? "님의 생일입니다!" : "'s birthday!"}
            {birthDateText && (
              <span className="text-muted-foreground"> ({birthDateText})</span>
            )}
          </span>
        </div>
      </div>
    );
  }

  return null;
}
