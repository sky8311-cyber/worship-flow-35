import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Users, Building2, ExternalLink, Star } from "lucide-react";
import { format } from "date-fns";
import type { CRMTab } from "@/pages/AdminCRM";

interface WorshipLeaderRowProps {
  leader: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  onCrossReference: (type: CRMTab, id: string, filterType?: string) => void;
  language: string;
}

export const WorshipLeaderRow = ({
  leader,
  onSelect,
  onCrossReference,
}: WorshipLeaderRowProps) => {
  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onSelect}
    >
      {/* Icon column */}
      <TableCell className="w-10">
        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded">
          <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
      </TableCell>

      {/* Name */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={leader.profile?.avatar_url} />
            <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
              {leader.profile?.full_name?.substring(0, 2).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium flex items-center gap-1.5">
              {leader.profile?.full_name || "Unknown"}
              {leader.isPremium && (
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            {leader.profile?.church_name && (
              <div className="text-xs text-muted-foreground">
                {leader.profile.church_name}
              </div>
            )}
          </div>
        </div>
      </TableCell>

      {/* Email */}
      <TableCell className="text-sm text-muted-foreground">
        {leader.profile?.email}
      </TableCell>

      {/* Type */}
      <TableCell>
        {leader.churchAccount ? (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Church
          </Badge>
        ) : leader.isPremium ? (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            Premium
          </Badge>
        ) : (
          <Badge variant="secondary">Free</Badge>
        )}
      </TableCell>

      {/* Communities */}
      <TableCell>
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20"
          onClick={(e) => {
            e.stopPropagation();
            if (leader.communityCount > 0) {
              onCrossReference("communities", leader.id, "worship_leader");
            }
          }}
        >
          <Users className="w-3 h-3 mr-1" />
          {leader.communityCount}
        </Badge>
      </TableCell>

      {/* Church Account */}
      <TableCell>
        {leader.churchAccount ? (
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onCrossReference("church_accounts", leader.churchAccount.id, "");
            }}
          >
            <Building2 className="w-3 h-3" />
            {leader.churchAccount.name?.substring(0, 15)}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Created */}
      <TableCell className="text-sm text-muted-foreground">
        {leader.createdAt ? format(new Date(leader.createdAt), "MMM d, yyyy") : "—"}
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
