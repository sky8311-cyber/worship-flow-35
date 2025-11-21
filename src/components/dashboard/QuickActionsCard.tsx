import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { CreateCommunityDialog } from "@/components/CreateCommunityDialog";

interface QuickActionsCardProps {
  showCreateCommunity?: boolean;
}

export function QuickActionsCard({ showCreateCommunity = false }: QuickActionsCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
          </div>
        </CardContent>
      </Card>

      <CreateCommunityDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </>
  );
}
