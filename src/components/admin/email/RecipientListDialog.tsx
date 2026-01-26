import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchInput } from "@/components/ui/search-input";
import { Loader2, Users, Mail } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { RecipientFilter } from "./RecipientSelector";

export interface Recipient {
  id: string | null;
  email: string;
  full_name: string | null;
}

interface RecipientListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: RecipientFilter;
  excludedEmails?: string[];
  onExcludedEmailsChange?: (emails: string[]) => void;
}

export const RecipientListDialog = ({
  open,
  onOpenChange,
  filter,
  excludedEmails = [],
  onExcludedEmailsChange,
}: RecipientListDialogProps) => {
  const { language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [localExcluded, setLocalExcluded] = useState<Set<string>>(new Set(excludedEmails));

  // Fetch recipients based on filter
  const { data: recipients = [], isLoading } = useQuery({
    queryKey: ["recipient-list", filter],
    queryFn: async () => {
      // Manual emails
      if (filter.type === "manual" && filter.manualEmails) {
        // Try to get profile info for existing users
        const { data: existingProfiles } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("email", filter.manualEmails);

        const profileMap = new Map(
          (existingProfiles || []).map((p) => [p.email.toLowerCase(), p])
        );

        return filter.manualEmails.map((email) => {
          const profile = profileMap.get(email.toLowerCase());
          return {
            id: profile?.id || null,
            email: email,
            full_name: profile?.full_name || null,
          };
        }) as Recipient[];
      }

      // Specific community
      if (filter.type === "specific_community" && filter.communityId) {
        const { data, error } = await supabase
          .from("community_members")
          .select("user_id, profiles(id, email, full_name)")
          .eq("community_id", filter.communityId);

        if (error) throw error;

        return (data || [])
          .map((m: any) => ({
            id: m.profiles?.id || null,
            email: m.profiles?.email || "",
            full_name: m.profiles?.full_name || null,
          }))
          .filter((r) => r.email) as Recipient[];
      }

      // Segment (RPC functions)
      if (filter.type === "segment" && filter.rpcFunction && filter.rpcParam) {
        let data: any[] = [];

        if (filter.rpcFunction === "get_users_by_platform_tier") {
          const result = await supabase.rpc("get_users_by_platform_tier", {
            tier_type: filter.rpcParam,
          });
          data = result.data || [];
        } else if (filter.rpcFunction === "get_users_by_community_status") {
          const result = await supabase.rpc("get_users_by_community_status", {
            status_type: filter.rpcParam,
          });
          data = result.data || [];
        } else if (filter.rpcFunction === "get_users_by_activity_status") {
          const result = await supabase.rpc("get_users_by_activity_status", {
            activity_type: filter.rpcParam,
          });
          data = result.data || [];
        }

        return data.map((u: any) => ({
          id: u.id || null,
          email: u.email || "",
          full_name: u.full_name || null,
        })) as Recipient[];
      }

      return [];
    },
    enabled: open,
  });

  // Filter recipients by search query
  const filteredRecipients = useMemo(() => {
    if (!searchQuery.trim()) return recipients;
    const query = searchQuery.toLowerCase();
    return recipients.filter(
      (r) =>
        r.email.toLowerCase().includes(query) ||
        r.full_name?.toLowerCase().includes(query)
    );
  }, [recipients, searchQuery]);

  // Toggle single recipient
  const toggleRecipient = (email: string) => {
    const newExcluded = new Set(localExcluded);
    if (newExcluded.has(email)) {
      newExcluded.delete(email);
    } else {
      newExcluded.add(email);
    }
    setLocalExcluded(newExcluded);
  };

  // Toggle all recipients
  const toggleAll = () => {
    if (localExcluded.size === 0) {
      // Exclude all
      setLocalExcluded(new Set(recipients.map((r) => r.email)));
    } else {
      // Include all
      setLocalExcluded(new Set());
    }
  };

  // Selected count
  const selectedCount = recipients.length - localExcluded.size;
  const allSelected = localExcluded.size === 0 && recipients.length > 0;

  // Handle confirm
  const handleConfirm = () => {
    onExcludedEmailsChange?.(Array.from(localExcluded));
    onOpenChange(false);
  };

  // Reset local state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setLocalExcluded(new Set(excludedEmails));
      setSearchQuery("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {language === "ko"
              ? `수신자 명단 (${recipients.length}명)`
              : `Recipient List (${recipients.length})`}
          </DialogTitle>
          <DialogDescription>
            {language === "ko"
              ? "발송 대상자를 확인하고 필요시 제외할 수 있습니다."
              : "Review recipients and optionally exclude some."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 flex-1 min-h-0">
          {/* Search */}
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === "ko" ? "이름 또는 이메일 검색..." : "Search name or email..."
            }
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : recipients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === "ko" ? "수신자가 없습니다." : "No recipients found."}
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center gap-2 p-2 border-b">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  {language === "ko" ? "전체 선택" : "Select All"}
                </label>
                <span className="text-xs text-muted-foreground">
                  {selectedCount}/{recipients.length}
                </span>
              </div>

              {/* Recipient List */}
              <ScrollArea className="h-[300px] border rounded-md">
                <div className="p-2 space-y-1">
                  {filteredRecipients.map((recipient) => {
                    const isSelected = !localExcluded.has(recipient.email);
                    return (
                      <div
                        key={recipient.email}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => toggleRecipient(recipient.email)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRecipient(recipient.email)}
                        />
                        <div className="flex-1 min-w-0">
                          {recipient.full_name && (
                            <p className="text-sm font-medium truncate">
                              {recipient.full_name}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {recipient.email}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="text-sm text-muted-foreground mr-auto">
            {language === "ko"
              ? `선택됨: ${selectedCount}/${recipients.length}`
              : `Selected: ${selectedCount}/${recipients.length}`}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === "ko" ? "취소" : "Cancel"}
          </Button>
          <Button onClick={handleConfirm}>
            {language === "ko" ? "확인" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
