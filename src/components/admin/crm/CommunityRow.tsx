import { Fragment } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Users, Building2, ExternalLink, Crown, User } from "lucide-react";
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
  isExpanded,
  onToggleExpand,
  onSelect,
  onCrossReference,
  language,
}: CommunityRowProps) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner": return <Badge className="bg-purple-500 text-[10px]">Owner</Badge>;
      case "leader": return <Badge className="bg-blue-500 text-[10px]">Leader</Badge>;
      case "member": return <Badge variant="secondary" className="text-[10px]">Member</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{role}</Badge>;
    }
  };

  return (
    <Fragment>
      <TableRow 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onSelect}
      >
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            {community.avatar_url ? (
              <Avatar className="h-10 w-10">
                <AvatarImage src={community.avatar_url} />
                <AvatarFallback>{community.name[0]}</AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            )}
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
        <TableCell>
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-purple-600 hover:text-purple-700 flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onCrossReference("worship_leaders", community.leader_id, "worship_leader");
            }}
          >
            <Avatar className="h-5 w-5">
              <AvatarImage src={community.leader?.avatar_url} />
              <AvatarFallback className="text-[10px]">
                {community.leader?.full_name?.[0] || "L"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{community.leader?.full_name || "Unknown"}</span>
            <Crown className="h-3 w-3" />
          </Button>
        </TableCell>
        <TableCell>
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-orange-600 hover:text-orange-700"
            onClick={(e) => {
              e.stopPropagation();
              onCrossReference("members", community.id, "community");
            }}
          >
            {community.memberCount} members
          </Button>
        </TableCell>
        <TableCell>
          {community.churchAccount ? (
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-blue-600 hover:text-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                onCrossReference("church_accounts", community.churchAccount.id, "church_account");
              }}
            >
              <Building2 className="h-3 w-3 mr-1" />
              {community.churchAccount.name}
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">Independent</span>
          )}
        </TableCell>
        <TableCell>
          <Badge variant={community.is_active ? "default" : "secondary"}>
            {community.is_active ? "Active" : "Inactive"}
          </Badge>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {format(new Date(community.created_at), "MMM d, yyyy")}
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
      
      {/* Expanded Content */}
      <TableRow className={isExpanded ? "" : "hidden"}>
        <TableCell colSpan={8} className="p-0 border-0">
          <Collapsible open={isExpanded}>
            <CollapsibleContent>
              <div className="bg-green-50/50 dark:bg-green-900/10 p-4 space-y-4">
                {/* Members List */}
                {community.members?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-green-700 dark:text-green-300">
                      Members ({community.members.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {community.members.slice(0, 10).map((member: any) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-1 bg-white dark:bg-card px-2 py-1 rounded-full text-xs cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20"
                          onClick={() => onCrossReference("members", member.user_id, "member")}
                        >
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={member.profile?.avatar_url} />
                            <AvatarFallback className="text-[8px]">
                              {member.profile?.full_name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.profile?.full_name || "Unknown"}</span>
                          {getRoleBadge(member.role)}
                        </div>
                      ))}
                      {community.members.length > 10 && (
                        <Badge variant="outline">+{community.members.length - 10} more</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Community Info */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Invite Token: </span>
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">{community.invite_token}</code>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </TableCell>
      </TableRow>
    </Fragment>
  );
};
