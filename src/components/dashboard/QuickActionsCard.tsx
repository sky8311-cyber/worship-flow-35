import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Plus, Calendar, UserPlus, Sparkles } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { CreateCommunityDialog } from "@/components/CreateCommunityDialog";
import { CalendarEventDialog } from "@/components/CalendarEventDialog";
import { useAuth } from "@/contexts/AuthContext";
import { InlineCommunitySearch } from "@/components/dashboard/InlineCommunitySearch";

interface QuickActionsCardProps {
  showCreateCommunity?: boolean;
}

export function QuickActionsCard({ showCreateCommunity = false }: QuickActionsCardProps) {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { isAdmin, isWorshipLeader, isCommunityLeaderInAnyCommunity } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const canCreateEvents = isAdmin || isWorshipLeader || isCommunityLeaderInAnyCommunity;

  return (
    <>
      <Card>
        <CardContent className="p-3">
          <div className="space-y-2">
            {/* Worship Leader Application - Prominent placement for non-WLs */}
            {!isWorshipLeader && (
              <Button
                variant="default"
                className="w-full justify-start bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                onClick={() => navigate("/request-worship-leader")}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {language === "ko" ? "예배인도자 승인 신청" : "Apply for Worship Leader"}
              </Button>
            )}

            <Button
              variant={showSearch ? "secondary" : "outline"}
              className="w-full justify-start"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="w-4 h-4 mr-2" />
              {t("community.search")}
            </Button>

            {showSearch && <InlineCommunitySearch />}

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
