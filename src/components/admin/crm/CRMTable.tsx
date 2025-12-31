import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChurchAccountRow } from "./ChurchAccountRow";
import { WorshipLeaderRow } from "./WorshipLeaderRow";
import { CommunityRow } from "./CommunityRow";
import { MemberRow } from "./MemberRow";
import type { CRMTab, CRMEntity } from "@/pages/AdminCRM";

interface CRMTableProps {
  activeTab: CRMTab;
  data: any[];
  expandedRows: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelectEntity: (entity: CRMEntity) => void;
  onCrossReference: (type: CRMTab, id: string, filterType?: string) => void;
  language: string;
}

export const CRMTable = ({
  activeTab,
  data,
  expandedRows,
  onToggleExpand,
  onSelectEntity,
  onCrossReference,
  language,
}: CRMTableProps) => {
  const getHeaders = () => {
    switch (activeTab) {
      case "church_accounts":
        return ["Name", "Owner", "Status", "Communities", "Members", "Created"];
      case "worship_leaders":
        return ["Name", "Email", "Type", "Communities", "Church Account", "Created"];
      case "communities":
        return ["Name", "Leader", "Members", "Church Account", "Status", "Created"];
      case "members":
        return ["Name", "Email", "Communities", "Roles", "Last Sign In"];
      default:
        return [];
    }
  };

  const renderRows = () => {
    if (data.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={getHeaders().length} className="text-center py-12 text-muted-foreground">
            No data found
          </TableCell>
        </TableRow>
      );
    }

    switch (activeTab) {
      case "church_accounts":
        return data.map((item) => (
          <ChurchAccountRow
            key={item.id}
            account={item}
            isExpanded={expandedRows.has(item.id)}
            onToggleExpand={() => onToggleExpand(item.id)}
            onSelect={() => onSelectEntity({ id: item.id, type: "church_accounts", data: item })}
            onCrossReference={onCrossReference}
            language={language}
          />
        ));
      case "worship_leaders":
        return data.map((item) => (
          <WorshipLeaderRow
            key={item.id}
            leader={item}
            isExpanded={expandedRows.has(item.id)}
            onToggleExpand={() => onToggleExpand(item.id)}
            onSelect={() => onSelectEntity({ id: item.id, type: "worship_leaders", data: item })}
            onCrossReference={onCrossReference}
            language={language}
          />
        ));
      case "communities":
        return data.map((item) => (
          <CommunityRow
            key={item.id}
            community={item}
            isExpanded={expandedRows.has(item.id)}
            onToggleExpand={() => onToggleExpand(item.id)}
            onSelect={() => onSelectEntity({ id: item.id, type: "communities", data: item })}
            onCrossReference={onCrossReference}
            language={language}
          />
        ));
      case "members":
        return data.map((item) => (
          <MemberRow
            key={item.id}
            member={item}
            isExpanded={expandedRows.has(item.id)}
            onToggleExpand={() => onToggleExpand(item.id)}
            onSelect={() => onSelectEntity({ id: item.id, type: "members", data: item })}
            onCrossReference={onCrossReference}
            language={language}
          />
        ));
      default:
        return null;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="w-10"></TableHead>
          {getHeaders().map((header) => (
            <TableHead key={header} className="font-semibold">
              {header}
            </TableHead>
          ))}
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {renderRows()}
      </TableBody>
    </Table>
  );
};
