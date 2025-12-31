import { Fragment } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Building2, Users, ExternalLink } from "lucide-react";
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
  isExpanded,
  onToggleExpand,
  onSelect,
  onCrossReference,
  language,
}: ChurchAccountRowProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "trial": return "bg-blue-500";
      case "canceled": return "bg-gray-500";
      case "past_due": return "bg-red-500";
      default: return "bg-gray-500";
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
            {account.logo_url ? (
              <Avatar className="h-10 w-10">
                <AvatarImage src={account.logo_url} />
                <AvatarFallback>{account.name[0]}</AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            )}
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
        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={account.owner?.avatar_url} />
              <AvatarFallback className="text-xs">
                {account.owner?.full_name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{account.owner?.full_name || "Unknown"}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge className={getStatusColor(account.subscription_status)}>
            {account.subscription_status}
          </Badge>
        </TableCell>
        <TableCell>
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-green-600 hover:text-green-700"
            onClick={(e) => {
              e.stopPropagation();
              onCrossReference("communities", account.id, "church_account");
            }}
          >
            {account.communityCount} communities
          </Button>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            {account.memberCount}
          </div>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {format(new Date(account.created_at), "MMM d, yyyy")}
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
              <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 space-y-4">
                {/* Communities List */}
                {account.communities?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-blue-700 dark:text-blue-300">
                      Communities ({account.communities.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {account.communities.slice(0, 5).map((community: any) => (
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
                      {account.communities.length > 5 && (
                        <Badge variant="outline">+{account.communities.length - 5} more</Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Members List */}
                {account.members?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-blue-700 dark:text-blue-300">
                      Direct Members ({account.members.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {account.members.slice(0, 8).map((member: any) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-1 bg-white dark:bg-card px-2 py-1 rounded-full text-xs"
                        >
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={member.profile?.avatar_url} />
                            <AvatarFallback className="text-[8px]">
                              {member.profile?.full_name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.profile?.full_name || "Unknown"}</span>
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {member.role}
                          </Badge>
                        </div>
                      ))}
                      {account.members.length > 8 && (
                        <Badge variant="outline">+{account.members.length - 8} more</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Subscription Info */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Seats: </span>
                    <span className="font-medium">{account.used_seats}/{account.max_seats}</span>
                  </div>
                  {account.custom_domain && (
                    <div>
                      <span className="text-muted-foreground">Domain: </span>
                      <span className="font-medium">{account.custom_domain}</span>
                      <Badge 
                        variant="outline" 
                        className={`ml-1 text-xs ${account.domain_status === "verified" ? "text-green-600" : "text-yellow-600"}`}
                      >
                        {account.domain_status}
                      </Badge>
                    </div>
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
