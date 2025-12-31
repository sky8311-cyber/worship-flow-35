import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { CRMTab } from "@/pages/AdminCRM";

interface CRMTabsProps {
  activeTab: CRMTab;
  onTabChange: (tab: CRMTab) => void;
  filterId?: string | null;
  filterType?: string | null;
  onClearFilter?: () => void;
}

export const CRMTabs = ({ 
  activeTab, 
  onTabChange,
  filterId,
  filterType,
  onClearFilter
}: CRMTabsProps) => {
  const getFilterLabel = () => {
    if (!filterType) return null;
    switch (filterType) {
      case "church_account": return "Filtered by Church Account";
      case "community": return "Filtered by Community";
      case "worship_leader": return "Filtered by Worship Leader";
      default: return "Filtered";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as CRMTab)}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger 
            value="church_accounts" 
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            Church
          </TabsTrigger>
          <TabsTrigger 
            value="worship_leaders"
            className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
          >
            Leaders
          </TabsTrigger>
          <TabsTrigger 
            value="communities"
            className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
          >
            Communities
          </TabsTrigger>
          <TabsTrigger 
            value="members"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            Members
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {filterId && filterType && (
        <Badge variant="secondary" className="flex items-center gap-1">
          {getFilterLabel()}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={onClearFilter}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
    </div>
  );
};
