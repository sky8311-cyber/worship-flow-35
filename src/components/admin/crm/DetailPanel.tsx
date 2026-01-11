import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Building2, Crown, Users, User, ExternalLink, Mail, Globe, Calendar, Star, Pencil, Trash2, UserCog, Send } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { CRMEntity, CRMTab } from "@/pages/AdminCRM";
import { TierBadge } from "@/components/admin/TierBadge";
import { TierLevel, TIER_CONFIG } from "@/hooks/useTierFeature";

interface DetailPanelProps {
  entity: CRMEntity;
  onClose: () => void;
  onCrossReference: (type: CRMTab, id: string, filterType?: string) => void;
  language: string;
}

export const DetailPanel = ({ entity, onClose, onCrossReference, language }: DetailPanelProps) => {
  const renderChurchAccountDetails = () => {
    const account = entity.data;
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          {account.logo_url ? (
            <Avatar className="h-16 w-16">
              <AvatarImage src={account.logo_url} />
              <AvatarFallback>{account.name[0]}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold">{account.name}</h2>
              <TierBadge tier="church" size="sm" />
            </div>
            {account.slogan && (
              <p className="text-sm text-muted-foreground italic">"{account.slogan}"</p>
            )}
            <Badge className={account.subscription_status === "active" ? "bg-green-500" : "bg-blue-500"}>
              {account.subscription_status}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <UserCog className="h-3.5 w-3.5" />
            Manage
          </Button>
        </div>

        {/* Owner */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Owner</h3>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar>
              <AvatarImage src={account.owner?.avatar_url} />
              <AvatarFallback>{account.owner?.full_name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{account.owner?.full_name}</div>
              <div className="text-sm text-muted-foreground">{account.owner?.email}</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{account.communityCount}</div>
            <div className="text-xs text-muted-foreground">Communities</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{account.memberCount}</div>
            <div className="text-xs text-muted-foreground">Members</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{account.used_seats}/{account.max_seats}</div>
            <div className="text-xs text-muted-foreground">Seats</div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-3 text-sm">
          {account.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a href={account.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {account.website}
              </a>
            </div>
          )}
          {account.custom_domain && (
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <span>{account.custom_domain}</span>
              <Badge variant="outline" className={account.domain_status === "verified" ? "text-green-600" : "text-yellow-600"}>
                {account.domain_status}
              </Badge>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Created {format(new Date(account.created_at), "PPP")}</span>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => onCrossReference("communities", account.id, "church_account")}
          >
            <Users className="h-4 w-4 mr-2" />
            View All Communities
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => onCrossReference("worship_leaders", account.id, "church_account")}
          >
            <Crown className="h-4 w-4 mr-2" />
            View All Leaders
          </Button>
        </div>
      </div>
    );
  };

  const renderWorshipLeaderDetails = () => {
    const leader = entity.data;
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={leader.profile?.avatar_url} />
              <AvatarFallback>{leader.profile?.full_name?.[0] || "W"}</AvatarFallback>
            </Avatar>
            <Crown className="absolute -top-1 -right-1 h-5 w-5 text-purple-500" />
          </div>
          <div className="flex-1">
            {/* Determine worship leader tier */}
            {(() => {
              const tier: TierLevel = leader.churchAccount ? "church" : leader.isPremium ? "premium" : "worship_leader";
              return (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold">
                      {leader.profile?.full_name || "Unknown"}
                    </h2>
                    <TierBadge tier={tier} size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground">{leader.profile?.email}</p>
                </>
              );
            })()}
          </div>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit Profile
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Message
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <UserCog className="h-3.5 w-3.5" />
            Change Role
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        </div>

        {/* Profile Info */}
        <div className="space-y-3 text-sm">
          {leader.profile?.church_name && (
            <div>
              <span className="text-muted-foreground">Church: </span>
              <span className="font-medium">{leader.profile.church_name}</span>
            </div>
          )}
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{leader.communityCount}</div>
            <div className="text-xs text-muted-foreground">Communities</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-bold">
              {leader.authUser?.last_sign_in_at 
                ? formatDistanceToNow(new Date(leader.authUser.last_sign_in_at), { addSuffix: true })
                : "Never"
              }
            </div>
            <div className="text-xs text-muted-foreground">Last Active</div>
          </div>
        </div>

        {/* Church Account Link */}
        {leader.churchAccount && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Church Account</h3>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onCrossReference("church_accounts", leader.churchAccount.id, "")}
            >
              <Building2 className="h-4 w-4 mr-2" />
              {leader.churchAccount.name}
            </Button>
          </div>
        )}

        {/* Communities */}
        {leader.communities?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Managed Communities</h3>
            <div className="space-y-2">
              {leader.communities.slice(0, 5).map((community: any) => (
                <Button
                  key={community.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onCrossReference("communities", community.id, "")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {community.name}
                </Button>
              ))}
              {leader.communities.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{leader.communities.length - 5} more communities
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCommunityDetails = () => {
    const community = entity.data;
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          {community.avatar_url ? (
            <Avatar className="h-16 w-16">
              <AvatarImage src={community.avatar_url} />
              <AvatarFallback>{community.name[0]}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Users className="h-8 w-8 text-green-600" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold">{community.name}</h2>
            {community.description && (
              <p className="text-sm text-muted-foreground">{community.description}</p>
            )}
            <Badge variant={community.is_active ? "default" : "secondary"}>
              {community.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Announce
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            View Page
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>

        {/* Leader */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Leader</h3>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onCrossReference("worship_leaders", community.leader_id, "")}
          >
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src={community.leader?.avatar_url} />
              <AvatarFallback>{community.leader?.full_name?.[0] || "L"}</AvatarFallback>
            </Avatar>
            {community.leader?.full_name || "Unknown"}
            <Crown className="h-4 w-4 ml-auto text-purple-500" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{community.memberCount}</div>
            <div className="text-xs text-muted-foreground">Members</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-bold">
              {formatDistanceToNow(new Date(community.created_at), { addSuffix: true })}
            </div>
            <div className="text-xs text-muted-foreground">Created</div>
          </div>
        </div>

        {/* Church Account */}
        {community.churchAccount && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Church Account</h3>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onCrossReference("church_accounts", community.churchAccount.id, "")}
            >
              <Building2 className="h-4 w-4 mr-2" />
              {community.churchAccount.name}
            </Button>
          </div>
        )}

        {/* Navigation Actions */}
        <div>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => onCrossReference("members", community.id, "community")}
          >
            <User className="h-4 w-4 mr-2" />
            View All Members ({community.memberCount})
          </Button>
        </div>
      </div>
    );
  };

  const renderMemberDetails = () => {
    const member = entity.data;
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={member.profile?.avatar_url} />
            <AvatarFallback><User className="h-8 w-8" /></AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{member.profile?.full_name || "Unknown"}</h2>
            <p className="text-sm text-muted-foreground">{member.profile?.email}</p>
            <div className="flex gap-1 mt-1">
              {member.roles?.map((role: any) => (
                <Badge key={role.id} variant="secondary">{role.role}</Badge>
              ))}
              {(!member.roles || member.roles.length === 0) && (
                <Badge variant="secondary">Member</Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit Profile
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Message
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <UserCog className="h-3.5 w-3.5" />
            Change Role
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        </div>

        {/* Profile Info */}
        <div className="space-y-3 text-sm">
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
          {member.profile?.bio && (
            <div>
              <span className="text-muted-foreground">Bio: </span>
              <p className="font-medium">{member.profile.bio}</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{member.communityCount}</div>
            <div className="text-xs text-muted-foreground">Communities</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-bold">
              {member.authUser?.last_sign_in_at 
                ? formatDistanceToNow(new Date(member.authUser.last_sign_in_at), { addSuffix: true })
                : "Never"
              }
            </div>
            <div className="text-xs text-muted-foreground">Last Active</div>
          </div>
        </div>

        {/* Communities */}
        {member.communities?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Member of Communities</h3>
            <div className="space-y-2">
              {member.communities.slice(0, 5).map((cm: any) => (
                <Button
                  key={cm.community_id}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => onCrossReference("communities", cm.community_id, "")}
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {cm.community?.name || "Unknown"}
                  </span>
                  <Badge variant="secondary" className="text-xs">{cm.role}</Badge>
                </Button>
              ))}
              {member.communities.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{member.communities.length - 5} more communities
                </p>
              )}
            </div>
          </div>
        )}

        {/* Verification Status */}
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Email: </span>
          {member.authUser?.email_confirmed_at ? (
            <Badge variant="outline" className="text-green-600">Verified</Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-600">Unverified</Badge>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (entity.type) {
      case "church_accounts": return renderChurchAccountDetails();
      case "worship_leaders": return renderWorshipLeaderDetails();
      case "communities": return renderCommunityDetails();
      case "members": return renderMemberDetails();
      default: return null;
    }
  };

  const getTitle = () => {
    switch (entity.type) {
      case "church_accounts": return "Worship Community Account";
      case "worship_leaders": return "Basic Member";
      case "communities": return "Community";
      case "members": return "Team Member";
      default: return "Details";
    }
  };

  const getAccentColor = () => {
    switch (entity.type) {
      case "church_accounts": return "border-l-blue-500";
      case "worship_leaders": return "border-l-purple-500";
      case "communities": return "border-l-green-500";
      case "members": return "border-l-orange-500";
      default: return "border-l-gray-500";
    }
  };

  return (
    <div className={`border-l-4 ${getAccentColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{getTitle()}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      {renderContent()}
    </div>
  );
};
