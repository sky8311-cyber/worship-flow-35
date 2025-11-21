import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Music, ArrowRight, UserPlus, Users, Church, MoreHorizontal } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useTranslation } from "@/hooks/useTranslation";

interface Community {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface WorshipSet {
  id: string;
  service_name: string;
  date: string;
  theme?: string | null;
  worship_leader?: string | null;
  song_count?: number;
  created_at: string;
}

interface Activity {
  id: string;
  type: string;
  user_name: string;
  created_at: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  event_type: "rehearsal" | "meeting" | "worship_service" | "other";
  event_date: string;
  start_time?: string | null;
  location?: string | null;
  created_at: string;
}

interface FeedItem {
  id: string;
  type: "worship_set" | "activity" | "calendar_event";
  community: Community;
  set?: WorshipSet;
  activity?: Activity;
  calendarEvent?: CalendarEvent;
  created_at: string;
}

interface CommunityFeedCardProps {
  item: FeedItem;
}

export function CommunityFeedCard({ item }: CommunityFeedCardProps) {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;

  if (item.type === "worship_set" && item.set) {
    const { set, community } = item;
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={community.avatar_url || undefined} />
              <AvatarFallback>{community.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{community.name}</p>
              <p className="text-xs text-muted-foreground">
                {set.worship_leader} • {formatDistanceToNow(new Date(set.created_at), { locale: dateLocale })} {t("common.ago")}
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0">
              <Calendar className="w-3 h-3 mr-1" />
              {format(new Date(set.date), "M/d")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <h4 className="font-semibold mb-2">{set.service_name}</h4>
          {set.theme && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {set.theme}
            </p>
          )}

          {/* Song count badge */}
          {set.song_count !== undefined && (
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-xs">
                <Music className="w-3 h-3 mr-1" />
                {set.song_count} {t("common.songs")}
              </Badge>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => navigate(`/set-builder/${set.id}`)}
          >
            {t("common.viewDetails")}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (item.type === "activity" && item.activity) {
    const { activity, community } = item;
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{activity.user_name}</span>
                {" "}{t("activity.joinedCommunity")}{" "}
                <span className="font-medium">{community.name}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(activity.created_at), { locale: dateLocale })} {t("common.ago")}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (item.type === "calendar_event" && item.calendarEvent) {
    const { calendarEvent, community } = item;
    const eventTypeIconMap = {
      rehearsal: <Music className="w-4 h-4" />,
      meeting: <Users className="w-4 h-4" />,
      worship_service: <Church className="w-4 h-4" />,
      other: <MoreHorizontal className="w-4 h-4" />,
    };

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={community.avatar_url || undefined} />
              <AvatarFallback>{community.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{community.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(calendarEvent.created_at), { locale: dateLocale })} {t("common.ago")}
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {eventTypeIconMap[calendarEvent.event_type]}
              <span className="ml-1">{t(`calendarEvent.types.${calendarEvent.event_type}` as any)}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-semibold">{calendarEvent.title}</h4>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              {format(new Date(calendarEvent.event_date), "PPP", { locale: dateLocale })}
              {calendarEvent.start_time && ` • ${calendarEvent.start_time}`}
            </p>
            {calendarEvent.location && (
              <p className="line-clamp-1">📍 {calendarEvent.location}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
