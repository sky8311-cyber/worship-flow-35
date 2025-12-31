import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Building2, ExternalLink, Crown, User } from "lucide-react";
import { format } from "date-fns";
import type { CRMTab } from "@/pages/AdminCRM";

interface CommunityRowProps {
  community: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  onCrossReference: (type: CRMTab, id: string, filterType?: string) => void;
  language: string;
}

export const CommunityRow = ({
  community,
  onSelect,
  onCrossReference,
}: CommunityRowProps) => {
  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onSelect}
    >
      {/* Icon column */}
      <TableCell className="w-10">
        <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded">
          <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
      </TableCell>

      {/* Name */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={community.avatar_url} />
            <AvatarFallback className="bg-green-100 text-green-600 text-xs">
              {community.name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{community.name}</div>
            {community.description && (
              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                {community.description}
              </div>
            )}
          </div>
        </div>
      </TableCell>

      {/* Leader */}
      <TableCell>
        {community.leader ? (
          <div 
            className="flex items-center gap-2 cursor-pointer hover:text-purple-600"
            onClick={(e) => {
              e.stopPropagation();
              onCrossReference("worship_leaders", community.leader_id, "");
            }}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={community.leader.avatar_url} />
              <AvatarFallback className="text-xs">
                {community.leader.full_name?.substring(0, 2).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{community.leader.full_name}</span>
            <Crown className="h-3 w-3 text-purple-500" />
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No leader</span>
        )}
      </TableCell>

      {/* Members */}
      <TableCell>
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20"
          onClick={(e) => {
            e.stopPropagation();
            if (community.memberCount > 0) {
              onCrossReference("members", community.id, "community");
            }
          }}
        >
          <User className="w-3 h-3 mr-1" />
          {community.memberCount}
        </Badge>
      </TableCell>

      {/* Church Account */}
      <TableCell>
        {community.churchAccount ? (
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onCrossReference("church_accounts", community.churchAccount.id, "");
            }}
          >
            <Building2 className="w-3 h-3" />
            {community.churchAccount.name?.substring(0, 15)}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">Independent</span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge variant={community.is_active ? "default" : "secondary"}>
          {community.is_active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>

      {/* Created */}
      <TableCell className="text-sm text-muted-foreground">
        {format(new Date(community.created_at), "MMM d, yyyy")}
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
