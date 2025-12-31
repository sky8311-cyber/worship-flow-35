import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, User, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CRMTab } from "@/pages/AdminCRM";

interface MemberRowProps {
  member: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  onCrossReference: (type: CRMTab, id: string, filterType?: string) => void;
  language: string;
}

export const MemberRow = ({
  member,
  onSelect,
  onCrossReference,
}: MemberRowProps) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">Admin</Badge>;
      case "worship_leader":
        return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs">Leader</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{role}</Badge>;
    }
  };

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onSelect}
    >
      {/* Icon column */}
      <TableCell className="w-10">
        <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded">
          <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </div>
      </TableCell>

      {/* Name */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={member.profile?.avatar_url} />
            <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">
              {member.profile?.full_name?.substring(0, 2).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{member.profile?.full_name || "Unknown"}</div>
            {member.profile?.instrument && (
              <div className="text-xs text-muted-foreground">
                {member.profile.instrument}
              </div>
            )}
          </div>
        </div>
      </TableCell>

      {/* Email */}
      <TableCell className="text-sm text-muted-foreground">
        {member.profile?.email}
      </TableCell>

      {/* Communities */}
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {member.communities?.slice(0, 2).map((c: any) => (
            <Badge 
              key={c.community_id}
              variant="outline" 
              className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 gap-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onCrossReference("communities", c.community_id, "");
              }}
            >
              <Users className="w-3 h-3" />
              {c.community?.name?.substring(0, 12) || "..."}
            </Badge>
          ))}
          {member.communities?.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{member.communities.length - 2}
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Roles */}
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {member.roles?.length > 0 ? (
            member.roles.slice(0, 2).map((r: any) => (
              <span key={r.id}>{getRoleBadge(r.role)}</span>
            ))
          ) : (
            <Badge variant="secondary" className="text-xs">Member</Badge>
          )}
        </div>
      </TableCell>

      {/* Last Sign In */}
      <TableCell className="text-sm text-muted-foreground">
        {member.authUser?.last_sign_in_at ? (
          formatDistanceToNow(new Date(member.authUser.last_sign_in_at), { addSuffix: true })
        ) : (
          "Never"
        )}
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
