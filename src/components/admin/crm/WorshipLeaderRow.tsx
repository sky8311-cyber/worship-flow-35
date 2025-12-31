import { Fragment } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Crown, Users, Building2, ExternalLink, Star } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
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
  isExpanded,
  onToggleExpand,
  onSelect,
  onCrossReference,
  language,
}: WorshipLeaderRowProps) => {
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
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={leader.profile?.avatar_url} />
                <AvatarFallback>
                  {leader.profile?.full_name?.[0] || "W"}
                </AvatarFallback>
              </Avatar>
              <Crown className="absolute -top-1 -right-1 h-4 w-4 text-purple-500" />
            </div>
            <div>
              <div className="font-medium flex items-center gap-2">
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
        <TableCell className="text-sm text-muted-foreground">
          {leader.profile?.email}
        </TableCell>
        <TableCell>
          {leader.churchAccount ? (
            <Badge className="bg-blue-500">Church Account</Badge>
          ) : leader.isPremium ? (
            <Badge className="bg-yellow-500">Premium</Badge>
          ) : (
            <Badge variant="secondary">Free</Badge>
          )}
        </TableCell>
        <TableCell>
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-green-600 hover:text-green-700"
            onClick={(e) => {
              e.stopPropagation();
              onCrossReference("communities", leader.id, "worship_leader");
            }}
          >
            {leader.communityCount} communities
          </Button>
        </TableCell>
        <TableCell>
          {leader.churchAccount ? (
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-blue-600 hover:text-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                onCrossReference("church_accounts", leader.churchAccount.id, "church_account");
              }}
            >
              <Building2 className="h-3 w-3 mr-1" />
              {leader.churchAccount.name}
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {leader.createdAt ? format(new Date(leader.createdAt), "MMM d, yyyy") : "-"}
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
              <div className="bg-purple-50/50 dark:bg-purple-900/10 p-4 space-y-4">
                {/* Communities */}
                {leader.communities?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-purple-700 dark:text-purple-300">
                      Managed Communities ({leader.communities.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {leader.communities.map((community: any) => (
                        <Badge
                          key={community.id}
                          variant="secondary"
                          className="cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30"
                          onClick={() => onCrossReference("communities", community.id, "community")}
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {community.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Profile Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {leader.profile?.serving_position && (
                    <div>
                      <span className="text-muted-foreground">Position: </span>
                      <span className="font-medium">{leader.profile.serving_position}</span>
                    </div>
                  )}
                  {leader.profile?.years_serving && (
                    <div>
                      <span className="text-muted-foreground">Years Serving: </span>
                      <span className="font-medium">{leader.profile.years_serving}</span>
                    </div>
                  )}
                  {leader.profile?.country && (
                    <div>
                      <span className="text-muted-foreground">Country: </span>
                      <span className="font-medium">{leader.profile.country}</span>
                    </div>
                  )}
                  {leader.authUser?.last_sign_in_at && (
                    <div>
                      <span className="text-muted-foreground">Last Sign In: </span>
                      <span className="font-medium">
                        {formatDistanceToNow(new Date(leader.authUser.last_sign_in_at), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Subscription Details */}
                {leader.subscription && (
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Subscription: </span>
                      <Badge 
                        variant={leader.subscription.subscription_status === "active" ? "default" : "secondary"}
                      >
                        {leader.subscription.subscription_status}
                      </Badge>
                    </div>
                    {leader.subscription.current_period_end && (
                      <div>
                        <span className="text-muted-foreground">Period Ends: </span>
                        <span className="font-medium">
                          {format(new Date(leader.subscription.current_period_end), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </TableCell>
      </TableRow>
    </Fragment>
  );
};
