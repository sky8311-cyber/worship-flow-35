import { ChevronRight, Home } from "lucide-react";
import type { CRMTab } from "@/pages/AdminCRM";

interface BreadcrumbProps {
  currentTab: CRMTab;
  filterId?: string | null;
  filterType?: string | null;
  filterName?: string;
}

export const CRMBreadcrumb = ({
  currentTab,
  filterId,
  filterType,
  filterName,
}: BreadcrumbProps) => {
  const getTabLabel = () => {
    switch (currentTab) {
      case "church_accounts": return "Church Accounts";
      case "worship_leaders": return "Worship Leaders";
      case "communities": return "Communities";
      case "members": return "Members";
      default: return currentTab;
    }
  };

  const getHierarchyLevel = () => {
    switch (currentTab) {
      case "church_accounts": return 1;
      case "worship_leaders": return 2;
      case "communities": return 3;
      case "members": return 4;
      default: return 0;
    }
  };

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
      <Home className="w-4 h-4" />
      <span>CRM</span>
      <ChevronRight className="w-3.5 h-3.5" />
      <span className="text-foreground font-medium flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
          {getHierarchyLevel()}
        </span>
        {getTabLabel()}
      </span>
      {filterId && filterType && (
        <>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">
            {filterName || `Filtered (${filterId.slice(0, 8)}...)`}
          </span>
        </>
      )}
    </nav>
  );
};
