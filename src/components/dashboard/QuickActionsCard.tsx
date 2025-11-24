import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Plus, Calendar, UserPlus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { CreateCommunityDialog } from "@/components/CreateCommunityDialog";
import { CalendarEventDialog } from "@/components/CalendarEventDialog";
import { useAuth } from "@/contexts/AuthContext";

interface QuickActionsCardProps {
  showCreateCommunity?: boolean;
}

export function QuickActionsCard({ showCreateCommunity = false }: QuickActionsCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAdmin, isWorshipLeader, isCommunityLeaderInAnyCommunity } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  const canCreateEvents = isAdmin || isWorshipLeader || isCommunityLeaderInAnyCommunity;

  return (
    <>
      <Card>
        <CardContent className="p-3">
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/community/search")}
            >
              <Search className="w-4 h-4 mr-2" />
              {t("community.search")}
            </Button>

            {showCreateCommunity && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("community.createNew")}
              </Button>
            )}

            {canCreateEvents && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setEventDialogOpen(true)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {t("dashboard.createEvent")}
              </Button>
            )}

            {!isWorshipLeader && (
              <Button
                variant="default"
                className="w-full justify-start"
                onClick={() => navigate("/request-worship-leader")}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {t("worshipLeaderRequest.title")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <CreateCommunityDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <CalendarEventDialog 
        open={eventDialogOpen} 
        onOpenChange={setEventDialogOpen}
        onSuccess={() => setEventDialogOpen(false)}
      />
    </>
  );
}
