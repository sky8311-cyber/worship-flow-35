import { X, ArrowLeft, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CRMTab } from "@/pages/AdminCRM";

interface FilterBannerProps {
  filterId: string;
  filterType: string;
  filterName?: string;
  currentTab: CRMTab;
  onClearFilter: () => void;
  onGoBack: () => void;
}

export const FilterBanner = ({
  filterId,
  filterType,
  filterName,
  currentTab,
  onClearFilter,
  onGoBack,
}: FilterBannerProps) => {
  const getFilterTypeLabel = () => {
    switch (filterType) {
      case "church_account": return "Church Account";
      case "community": return "Community";
      case "worship_leader": return "Worship Leader";
      default: return filterType;
    }
  };

  const getTabLabel = () => {
    switch (currentTab) {
      case "church_accounts": return "Church Accounts";
      case "worship_leaders": return "Worship Leaders";
      case "communities": return "Communities";
      case "members": return "Members";
      default: return currentTab;
    }
  };

  const getBackTab = (): CRMTab => {
    switch (filterType) {
      case "church_account": return "church_accounts";
      case "community": return "communities";
      case "worship_leader": return "worship_leaders";
      default: return "church_accounts";
    }
  };

  const getAccentColor = () => {
    switch (filterType) {
      case "church_account": return "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800";
      case "community": return "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800";
      case "worship_leader": return "bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800";
      default: return "bg-muted border-border";
    }
  };

  return (
    <div className={`mb-4 p-3 rounded-lg border-2 ${getAccentColor()} flex flex-wrap items-center justify-between gap-2`}>
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={onGoBack}
          className="gap-1.5 h-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Showing {getTabLabel()} under
          </span>
          <Badge variant="secondary" className="font-semibold">
            {filterName || filterId.slice(0, 8)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {getFilterTypeLabel()}
          </Badge>
        </div>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onClearFilter}
        className="gap-1.5 h-8"
      >
        <X className="w-3.5 h-3.5" />
        Clear Filter
      </Button>
    </div>
  );
};
