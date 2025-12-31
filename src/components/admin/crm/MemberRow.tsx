import { Fragment } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Users, ExternalLink, User } from "lucide-react";
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
  isExpanded,
  onToggleExpand,
  onSelect,
  onCrossReference,
  language,
}: MemberRowProps) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge className="bg-red-500">Admin</Badge>;
      case "worship_leader": return <Badge className="bg-purple-500">Leader</Badge>;
      default: return null;
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
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.profile?.avatar_url} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{member.profile?.full_name || "Unknown"}</div>
              {member.profile?.church_name && (
                <div className="text-xs text-muted-foreground">
                  {member.profile.church_name}
                </div>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {member.profile?.email}
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {member.communities?.slice(0, 2).map((cm: any) => (
              <Badge
                key={cm.community_id}
                variant="secondary"
                className="cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onCrossReference("communities", cm.community_id, "community");
                }}
              >
                {cm.community?.name || "Unknown"}
              </Badge>
            ))}
            {member.communityCount > 2 && (
              <Badge variant="outline" className="text-xs">
                +{member.communityCount - 2}
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {member.roles?.map((role: any) => (
              <Fragment key={role.id}>
                {getRoleBadge(role.role)}
              </Fragment>
            ))}
            {(!member.roles || member.roles.length === 0) && (
              <Badge variant="outline">Member</Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {member.authUser?.last_sign_in_at 
            ? formatDistanceToNow(new Date(member.authUser.last_sign_in_at), { addSuffix: true })
            : "Never"
          }
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
        <TableCell colSpan={7} className="p-0 border-0">
          <Collapsible open={isExpanded}>
            <CollapsibleContent>
              <div className="bg-orange-50/50 dark:bg-orange-900/10 p-4 space-y-4">
                {/* Communities */}
                {member.communities?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-orange-700 dark:text-orange-300">
                      Member of Communities ({member.communities.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {member.communities.map((cm: any) => (
                        <Badge
                          key={cm.community_id}
                          variant="secondary"
                          className="cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30"
                          onClick={() => onCrossReference("communities", cm.community_id, "community")}
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {cm.community?.name || "Unknown"}
                          <span className="ml-1 text-xs opacity-70">({cm.role})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Profile Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {member.profile?.instrument && (
                    <div>
                      <span className="text-muted-foreground">Instrument: </span>
                      <span className="font-medium">{member.profile.instrument}</span>
                    </div>
                  )}
                  {member.profile?.ministry_role && (
                    <div>
                      <span className="text-muted-foreground">Ministry Role: </span>
                      <span className="font-medium">{member.profile.ministry_role}</span>
                    </div>
                  )}
                  {member.profile?.country && (
                    <div>
                      <span className="text-muted-foreground">Country: </span>
                      <span className="font-medium">{member.profile.country}</span>
                    </div>
                  )}
                  {member.profile?.created_at && (
                    <div>
                      <span className="text-muted-foreground">Joined: </span>
                      <span className="font-medium">
                        {formatDistanceToNow(new Date(member.profile.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Email Verification */}
                <div className="text-sm">
                  <span className="text-muted-foreground">Email Verified: </span>
                  {member.authUser?.email_confirmed_at ? (
                    <Badge variant="outline" className="text-green-600">Verified</Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-600">Unverified</Badge>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </TableCell>
      </TableRow>
    </Fragment>
  );
};
