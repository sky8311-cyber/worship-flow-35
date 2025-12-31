import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import type { CRMTab } from "@/pages/AdminCRM";

interface ChurchAccountRowProps {
  account: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  onCrossReference: (type: CRMTab, id: string, filterType?: string) => void;
  language: string;
}

export const ChurchAccountRow = ({
  account,
  onSelect,
  onCrossReference,
}: ChurchAccountRowProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "trialing": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "trial": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "past_due": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "canceled": return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onSelect}
    >
      {/* Icon column */}
      <TableCell className="w-10">
        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
          <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
      </TableCell>

      {/* Name */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={account.logo_url} />
            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
              {account.name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{account.name}</div>
            {account.slogan && (
              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                {account.slogan}
              </div>
            )}
          </div>
        </div>
      </TableCell>

      {/* Owner */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={account.owner?.avatar_url} />
            <AvatarFallback className="text-xs">
              {account.owner?.full_name?.substring(0, 2).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{account.owner?.full_name || "Unknown"}</span>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge className={getStatusColor(account.subscription_status)}>
          {account.subscription_status}
        </Badge>
      </TableCell>

      {/* Communities */}
      <TableCell>
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20"
          onClick={(e) => {
            e.stopPropagation();
            if (account.communityCount > 0) {
              onCrossReference("communities", account.id, "church_account");
            }
          }}
        >
          <Users className="w-3 h-3 mr-1" />
          {account.communityCount}
        </Badge>
      </TableCell>

      {/* Members/Seats */}
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {account.used_seats}/{account.max_seats} seats
        </span>
      </TableCell>

      {/* Created */}
      <TableCell className="text-sm text-muted-foreground">
        {format(new Date(account.created_at), "MMM d, yyyy")}
      </TableCell>

      {/* Actions */}
      <TableCell className="w-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
