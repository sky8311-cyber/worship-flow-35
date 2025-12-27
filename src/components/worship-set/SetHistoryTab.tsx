import { useState } from "react";
import { useSetAuditHistory } from "@/hooks/useSetAuditHistory";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";
import { 
  History, 
  Plus, 
  Minus, 
  Edit, 
  Music, 
  LayoutList, 
  Settings,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { SetRevertDialog } from "./SetRevertDialog";
import { cn } from "@/lib/utils";

interface SetHistoryTabProps {
  setId: string | undefined;
  onRevertComplete?: (restoredSongs: any[], restoredComponents: any[]) => void;
}

const getActionIcon = (action: "INSERT" | "UPDATE" | "DELETE") => {
  switch (action) {
    case "INSERT":
      return <Plus className="h-3 w-3 text-green-500" />;
    case "DELETE":
      return <Minus className="h-3 w-3 text-red-500" />;
    case "UPDATE":
      return <Edit className="h-3 w-3 text-blue-500" />;
  }
};

const getTypeIcon = (type: "set" | "song" | "component") => {
  switch (type) {
    case "song":
      return <Music className="h-3.5 w-3.5 text-muted-foreground" />;
    case "component":
      return <LayoutList className="h-3.5 w-3.5 text-muted-foreground" />;
    case "set":
      return <Settings className="h-3.5 w-3.5 text-muted-foreground" />;
  }
};

export const SetHistoryTab = ({ setId, onRevertComplete }: SetHistoryTabProps) => {
  const { data: history, isLoading } = useSetAuditHistory(setId);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [selectedSnapshotTime, setSelectedSnapshotTime] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRevertClick = (snapshotTime: string) => {
    setSelectedSnapshotTime(snapshotTime);
    setRevertDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <History className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">아직 변경 이력이 없습니다</p>
        <p className="text-xs text-muted-foreground mt-1">
          예배 세트를 수정하면 여기에 기록됩니다
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="pr-4">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {history.map((entry, index) => {
              const isExpanded = expandedIds.has(entry.id);
              const hasMultipleActions = entry.actions.length > 1;

              return (
                <div key={entry.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "absolute left-2.5 w-3 h-3 rounded-full border-2 bg-background",
                      index === 0 ? "border-primary" : "border-muted-foreground"
                    )}
                  />

                  <div className="bg-card border rounded-lg p-3 shadow-sm">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarImage src={entry.user_avatar || undefined} />
                          <AvatarFallback className="text-xs">
                            {entry.user_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <span className="text-sm font-medium truncate block">
                            {entry.user_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(entry.created_at), {
                              addSuffix: true,
                              locale: ko,
                            })}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs shrink-0"
                        onClick={() => handleRevertClick(entry.created_at)}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        되돌리기
                      </Button>
                    </div>

                    {/* Actions summary */}
                    <div className="mt-2 space-y-1">
                      {(isExpanded ? entry.actions : entry.actions.slice(0, 2)).map(
                        (action, actionIndex) => (
                          <div
                            key={actionIndex}
                            className="flex items-center gap-2 text-sm"
                          >
                            {getActionIcon(action.action)}
                            {getTypeIcon(action.type)}
                            <span className="text-muted-foreground truncate">
                              {action.song_title && (
                                <span className="font-medium text-foreground">
                                  "{action.song_title}"
                                </span>
                              )}
                              {action.component_label && (
                                <span className="font-medium text-foreground">
                                  "{action.component_label}"
                                </span>
                              )}
                              {!action.song_title && !action.component_label && action.type === "set" && (
                                <span className="font-medium text-foreground">
                                  예배 정보
                                </span>
                              )}
                              {" "}
                              {action.details}
                            </span>
                          </div>
                        )
                      )}

                      {hasMultipleActions && entry.actions.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-muted-foreground"
                          onClick={() => toggleExpanded(entry.id)}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              접기
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              {entry.actions.length - 2}개 더 보기
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="mt-2 text-xs text-muted-foreground">
                      {format(new Date(entry.created_at), "yyyy년 M월 d일 HH:mm", {
                        locale: ko,
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <SetRevertDialog
        open={revertDialogOpen}
        onOpenChange={setRevertDialogOpen}
        setId={setId}
        snapshotTime={selectedSnapshotTime}
        onRevertComplete={onRevertComplete}
      />
    </>
  );
};
