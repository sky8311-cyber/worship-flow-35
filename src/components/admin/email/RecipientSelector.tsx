import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, Shield, Building2, Activity, Zap, Home,
  Crown, UserCheck, UserX, Clock, Plus, MessageSquare, FileText, Edit3, AlertCircle, Eye
} from "lucide-react";
import { RecipientListDialog } from "./RecipientListDialog";
import { useTranslation } from "@/hooks/useTranslation";

interface RecipientCategory {
  id: string;
  label: string;
  labelKo: string;
  icon: React.ElementType;
  groups: RecipientGroup[];
}

interface RecipientGroup {
  id: string;
  label: string;
  labelKo: string;
  rpcFunction: string;
  rpcParam: string;
  icon?: React.ElementType;
}

interface Community {
  id: string;
  name: string;
}

const recipientCategories: RecipientCategory[] = [
  {
    id: "all",
    label: "All Users",
    labelKo: "전체 사용자",
    icon: Users,
    groups: [
      { id: "all_users", label: "All Registered Users", labelKo: "모든 가입자", rpcFunction: "get_users_by_platform_tier", rpcParam: "all" },
    ],
  },
  {
    id: "platform_tier",
    label: "Platform Tier",
    labelKo: "플랫폼 티어별",
    icon: Crown,
    groups: [
      { id: "team_member", label: "Team Members", labelKo: "팀멤버", rpcFunction: "get_users_by_platform_tier", rpcParam: "team_member", icon: UserCheck },
      { id: "worship_leader", label: "Basic Members (Worship Leaders)", labelKo: "예배인도자 (일반멤버)", rpcFunction: "get_users_by_platform_tier", rpcParam: "worship_leader", icon: Crown },
      { id: "full_member", label: "Full Members (Premium)", labelKo: "정회원 (프리미엄)", rpcFunction: "get_users_by_platform_tier", rpcParam: "full_member", icon: Shield },
      { id: "church_account", label: "Community Account Members", labelKo: "공동체 어카운트 멤버", rpcFunction: "get_users_by_platform_tier", rpcParam: "church_account", icon: Building2 },
    ],
  },
  {
    id: "activity",
    label: "Activity Status",
    labelKo: "활동 상태별",
    icon: Activity,
    groups: [
      { id: "active_7", label: "Active (7 days)", labelKo: "활성 (7일 내 접속)", rpcFunction: "get_users_by_activity_status", rpcParam: "active_7_days", icon: Clock },
      { id: "semi_active", label: "Semi-active (7-30 days)", labelKo: "준활성 (7-30일 미접속)", rpcFunction: "get_users_by_activity_status", rpcParam: "semi_active", icon: Clock },
      { id: "inactive_30", label: "Inactive (30+ days)", labelKo: "비활성 (30일+ 미접속)", rpcFunction: "get_users_by_activity_status", rpcParam: "inactive_30_plus", icon: UserX },
      { id: "new_users", label: "New Users (7 days)", labelKo: "신규 가입자 (7일 내)", rpcFunction: "get_users_by_activity_status", rpcParam: "new_users_7_days", icon: Plus },
    ],
  },
  {
    id: "community_status",
    label: "Community Status",
    labelKo: "커뮤니티 참여 상태별",
    icon: Home,
    groups: [
      { id: "in_community", label: "In a Community", labelKo: "커뮤니티 참여중", rpcFunction: "get_users_by_community_status", rpcParam: "in_community", icon: Home },
      { id: "not_in_community", label: "Not in Community", labelKo: "커뮤니티 미참여", rpcFunction: "get_users_by_community_status", rpcParam: "not_in_community", icon: UserX },
      { id: "community_owner", label: "Community Owners", labelKo: "커뮤니티 오너", rpcFunction: "get_users_by_community_status", rpcParam: "community_owner", icon: Crown },
      { id: "community_leader", label: "Community Leaders", labelKo: "커뮤니티 리더", rpcFunction: "get_users_by_community_status", rpcParam: "community_leader", icon: Shield },
      { id: "community_member", label: "Community Members", labelKo: "커뮤니티 일반 멤버", rpcFunction: "get_users_by_community_status", rpcParam: "community_member", icon: Users },
    ],
  },
  {
    id: "engagement",
    label: "Engagement",
    labelKo: "특정 활동별",
    icon: Zap,
    groups: [
      { id: "has_sets", label: "Created Worship Sets", labelKo: "예배 세트 생성자", rpcFunction: "get_users_by_activity_status", rpcParam: "has_created_sets", icon: FileText },
      { id: "no_sets", label: "No Worship Sets", labelKo: "예배 세트 미생성자", rpcFunction: "get_users_by_activity_status", rpcParam: "no_sets_created", icon: FileText },
      { id: "has_posts", label: "Posted in Community", labelKo: "게시글 작성자", rpcFunction: "get_users_by_activity_status", rpcParam: "has_posts", icon: MessageSquare },
      { id: "pending_wl", label: "Pending WL Applications", labelKo: "승급 신청 대기자", rpcFunction: "get_users_by_activity_status", rpcParam: "pending_wl_applications", icon: Clock },
    ],
  },
];

export interface RecipientFilter {
  type: "segment" | "specific_community" | "manual";
  rpcFunction?: string;
  rpcParam?: string;
  communityId?: string;
  manualEmails?: string[];
}

interface RecipientSelectorProps {
  value: RecipientFilter;
  onChange: (filter: RecipientFilter) => void;
  recipientCount: number;
  excludedEmails?: string[];
  onExcludedEmailsChange?: (emails: string[]) => void;
}

// Email validation helper
const validateEmails = (input: string): { valid: string[]; invalid: string[] } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emails = input
    .split(/[,\n]/)
    .map(e => e.trim())
    .filter(e => e.length > 0);
  
  const valid = emails.filter(e => emailRegex.test(e));
  const invalid = emails.filter(e => !emailRegex.test(e));
  
  return { valid, invalid };
};

export const RecipientSelector = ({ 
  value, 
  onChange, 
  recipientCount,
  excludedEmails = [],
  onExcludedEmailsChange,
}: RecipientSelectorProps) => {
  const { language } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all_users");
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
  const [manualEmailInput, setManualEmailInput] = useState<string>("");
  const [emailValidation, setEmailValidation] = useState<{ valid: string[]; invalid: string[] }>({ valid: [], invalid: [] });
  const [showRecipientList, setShowRecipientList] = useState(false);

  // Fetch communities for specific community selection
  const { data: communities = [] } = useQuery({
    queryKey: ["all-communities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_communities")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Community[];
    },
  });

  // Validate manual email input when it changes
  useEffect(() => {
    if (selectedCategory === "manual") {
      const validation = validateEmails(manualEmailInput);
      setEmailValidation(validation);
    }
  }, [manualEmailInput, selectedCategory]);

  // Update filter when selection changes
  useEffect(() => {
    if (selectedCategory === "manual") {
      onChange({
        type: "manual",
        manualEmails: emailValidation.valid,
      });
    } else if (selectedCategory === "specific_community") {
      if (selectedCommunityId) {
        onChange({
          type: "specific_community",
          communityId: selectedCommunityId,
        });
      }
    } else {
      const category = recipientCategories.find(c => c.id === selectedCategory);
      const group = category?.groups.find(g => g.id === selectedGroup);
      if (group) {
        onChange({
          type: "segment",
          rpcFunction: group.rpcFunction,
          rpcParam: group.rpcParam,
        });
      }
    }
  }, [selectedCategory, selectedGroup, selectedCommunityId, emailValidation.valid, onChange]);

  const currentCategory = recipientCategories.find(c => c.id === selectedCategory);
  const CategoryIcon = currentCategory?.icon || Users;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CategoryIcon className="w-4 h-4" />
          {language === "ko" ? "수신자 선택" : "Select Recipients"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Selection */}
        <div className="space-y-2">
          <Label>{language === "ko" ? "카테고리" : "Category"}</Label>
          <Select value={selectedCategory} onValueChange={(val) => {
            setSelectedCategory(val);
            if (val !== "specific_community") {
              const cat = recipientCategories.find(c => c.id === val);
              if (cat && cat.groups.length > 0) {
                setSelectedGroup(cat.groups[0].id);
              }
            }
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {recipientCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {language === "ko" ? cat.labelKo : cat.label}
                    </span>
                  </SelectItem>
                );
              })}
              <SelectItem value="specific_community">
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {language === "ko" ? "특정 커뮤니티" : "Specific Community"}
                </span>
              </SelectItem>
              <SelectItem value="manual">
                <span className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  {language === "ko" ? "수동 입력" : "Manual Input"}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Group Selection, Community Selection, or Manual Input */}
        {selectedCategory === "manual" ? (
          <div className="space-y-2">
            <Label>{language === "ko" ? "이메일 주소 입력" : "Enter Email Addresses"}</Label>
            <Textarea
              value={manualEmailInput}
              onChange={(e) => setManualEmailInput(e.target.value)}
              placeholder={language === "ko" 
                ? "이메일 주소를 입력하세요\n(콤마 또는 줄바꿈으로 구분)\n\n예:\nsky@goodpapa.org\nuser@example.com" 
                : "Enter email addresses\n(separated by comma or newline)\n\nExample:\nsky@goodpapa.org\nuser@example.com"}
              className="min-h-[150px] font-mono text-sm"
            />
            {emailValidation.invalid.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">
                    {language === "ko" 
                      ? `${emailValidation.invalid.length}개 형식 오류:` 
                      : `${emailValidation.invalid.length} invalid format:`}
                  </p>
                  <p className="text-xs opacity-80">
                    {emailValidation.invalid.slice(0, 3).join(", ")}
                    {emailValidation.invalid.length > 3 && ` +${emailValidation.invalid.length - 3}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : selectedCategory === "specific_community" ? (
          <div className="space-y-2">
            <Label>{language === "ko" ? "커뮤니티 선택" : "Select Community"}</Label>
            <Select value={selectedCommunityId} onValueChange={setSelectedCommunityId}>
              <SelectTrigger>
                <SelectValue placeholder={language === "ko" ? "커뮤니티 선택..." : "Select community..."} />
              </SelectTrigger>
              <SelectContent>
                {communities.map((community) => (
                  <SelectItem key={community.id} value={community.id}>
                    {community.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : currentCategory && currentCategory.groups.length > 1 ? (
          <div className="space-y-2">
            <Label>{language === "ko" ? "세부 그룹" : "Sub-group"}</Label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentCategory.groups.map((group) => {
                  const GroupIcon = group.icon || Users;
                  return (
                    <SelectItem key={group.id} value={group.id}>
                      <span className="flex items-center gap-2">
                        <GroupIcon className="w-4 h-4" />
                        {language === "ko" ? group.labelKo : group.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {/* Recipient Count Display */}
        <div className="p-4 bg-muted rounded-lg text-center space-y-3">
          <div>
            <p className="text-3xl font-bold">
              {selectedCategory === "manual" 
                ? emailValidation.valid.length - excludedEmails.length
                : recipientCount - excludedEmails.length}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === "ko" ? "수신자" : "Recipients"}
              {excludedEmails.length > 0 && (
                <span className="ml-1">
                  ({language === "ko" ? `${excludedEmails.length}명 제외` : `${excludedEmails.length} excluded`})
                </span>
              )}
            </p>
          </div>
          
          {/* View Recipient List Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowRecipientList(true)}
            disabled={(selectedCategory === "manual" ? emailValidation.valid.length : recipientCount) === 0}
          >
            <Eye className="w-4 h-4 mr-2" />
            {language === "ko" ? "수신자 명단 보기" : "View Recipient List"}
          </Button>
        </div>

        {/* Recipient List Dialog */}
        <RecipientListDialog
          open={showRecipientList}
          onOpenChange={setShowRecipientList}
          filter={value}
          excludedEmails={excludedEmails}
          onExcludedEmailsChange={onExcludedEmailsChange}
        />
      </CardContent>
    </Card>
  );
};
