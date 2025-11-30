import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { Plus, Trash2, Users, User, Check, Search, Loader2, X } from "lucide-react";
import {
  Church, Music, Volume2, Mic, Guitar, Monitor,
  BookOpen, Heart, Star, Sparkles, Camera, Laptop
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  user: User,
  users: Users,
  church: Church,
  music: Music,
  "volume-2": Volume2,
  mic: Mic,
  guitar: Guitar,
  monitor: Monitor,
  "book-open": BookOpen,
  heart: Heart,
  star: Star,
  sparkles: Sparkles,
  camera: Camera,
  laptop: Laptop,
};

interface Position {
  id: string;
  service_set_id: string;
  role_id: string;
  slots: number;
  notes: string | null;
  church_custom_roles?: {
    id: string;
    name: string;
    name_ko: string | null;
    color: string;
    icon: string;
  };
  signups?: {
    id: string;
    user_id: string;
    status: string;
    profiles?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  }[];
}

interface WorshipSetPositionsManagerProps {
  serviceSetId: string;
  communityId: string | null;
  churchAccountId: string | null;
  isReadOnly?: boolean;
}

export function WorshipSetPositionsManager({
  serviceSetId,
  communityId,
  churchAccountId,
  isReadOnly = false,
}: WorshipSetPositionsManagerProps) {
  const { language } = useLanguageContext();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [slots, setSlots] = useState(1);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigningPosition, setAssigningPosition] = useState<Position | null>(null);
  const [memberSearch, setMemberSearch] = useState("");

  // Fetch church custom roles
  const { data: customRoles } = useQuery({
    queryKey: ["church-custom-roles", churchAccountId],
    queryFn: async () => {
      if (!churchAccountId) return [];
      const { data, error } = await supabase
        .from("church_custom_roles")
        .select("*")
        .eq("church_account_id", churchAccountId)
        .order("position", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!churchAccountId,
  });

  // Fetch positions for this worship set
  const { data: positions, isLoading } = useQuery({
    queryKey: ["worship-set-positions", serviceSetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_set_positions")
        .select(`
          *,
          church_custom_roles(id, name, name_ko, color, icon),
          worship_set_signups(
            id, user_id, status, assigned_by,
            profiles:user_id(id, full_name, avatar_url)
          )
        `)
        .eq("service_set_id", serviceSetId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Position[];
    },
    enabled: !!serviceSetId,
  });

  // Fetch community members for assignment
  const { data: communityMembers } = useQuery({
    queryKey: ["community-members-for-assignment", communityId],
    queryFn: async () => {
      if (!communityId) return [];
      const { data, error } = await supabase
        .from("community_members")
        .select("user_id")
        .eq("community_id", communityId);
      if (error) throw error;
      
      if (!data?.length) return [];
      
      // Fetch profiles separately
      const userIds = data.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, email")
        .in("id", userIds);
      if (profilesError) throw profilesError;
      
      return profiles || [];
    },
    enabled: !!communityId,
  });

  // Add position mutation
  const addPositionMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("worship_set_positions")
        .insert({
          service_set_id: serviceSetId,
          role_id: selectedRoleId,
          slots,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "역할이 추가되었습니다" : "Position added");
      queryClient.invalidateQueries({ queryKey: ["worship-set-positions", serviceSetId] });
      setShowAddDialog(false);
      setSelectedRoleId("");
      setSlots(1);
    },
    onError: () => {
      toast.error(language === "ko" ? "추가 실패" : "Failed to add");
    },
  });

  // Delete position mutation
  const deletePositionMutation = useMutation({
    mutationFn: async (positionId: string) => {
      const { error } = await supabase
        .from("worship_set_positions")
        .delete()
        .eq("id", positionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "역할이 삭제되었습니다" : "Position removed");
      queryClient.invalidateQueries({ queryKey: ["worship-set-positions", serviceSetId] });
    },
  });

  // Assign member mutation
  const assignMemberMutation = useMutation({
    mutationFn: async ({ positionId, userId }: { positionId: string; userId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("worship_set_signups")
        .insert({
          position_id: positionId,
          user_id: userId,
          assigned_by: user?.id,
          status: "confirmed",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "멤버가 배정되었습니다" : "Member assigned");
      queryClient.invalidateQueries({ queryKey: ["worship-set-positions", serviceSetId] });
      setShowAssignDialog(false);
      setAssigningPosition(null);
      setMemberSearch("");
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error(language === "ko" ? "이미 배정된 멤버입니다" : "Member already assigned");
      } else {
        toast.error(language === "ko" ? "배정 실패" : "Failed to assign");
      }
    },
  });

  // Remove signup mutation
  const removeSignupMutation = useMutation({
    mutationFn: async (signupId: string) => {
      const { error } = await supabase
        .from("worship_set_signups")
        .delete()
        .eq("id", signupId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "배정이 취소되었습니다" : "Assignment removed");
      queryClient.invalidateQueries({ queryKey: ["worship-set-positions", serviceSetId] });
    },
  });

  const handleOpenAssignDialog = (position: Position) => {
    setAssigningPosition(position);
    setShowAssignDialog(true);
    setMemberSearch("");
  };

  // Filter members for assignment (exclude already assigned)
  const assignedUserIds = assigningPosition?.signups?.map(s => s.user_id) || [];
  const filteredMembers = communityMembers?.filter(m => {
    if (!m) return false;
    if (assignedUserIds.includes(m.id)) return false;
    if (!memberSearch) return true;
    const name = m.full_name?.toLowerCase() || "";
    const email = m.email?.toLowerCase() || "";
    const search = memberSearch.toLowerCase();
    return name.includes(search) || email.includes(search);
  }) || [];

  if (!churchAccountId) {
    return null; // Only show for church accounts
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            {language === "ko" ? "팀 역할 배정" : "Team Positions"}
          </CardTitle>
          {!isReadOnly && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddDialog(true)}
              disabled={!customRoles?.length}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              {language === "ko" ? "역할 추가" : "Add Role"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !positions?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {language === "ko"
              ? "아직 배정된 역할이 없습니다"
              : "No positions defined yet"}
          </p>
        ) : (
          <div className="space-y-3">
            {positions.map((position) => {
              const role = position.church_custom_roles;
              const signups = position.signups || [];
              const IconComp = ICON_MAP[role?.icon || "user"] || User;
              const filledSlots = signups.length;
              const totalSlots = position.slots;

              return (
                <div
                  key={position.id}
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: role?.color || "#6b7280" }}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {language === "ko" && role?.name_ko ? role.name_ko : role?.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {filledSlots}/{totalSlots}
                        </Badge>
                      </div>
                    </div>
                    {!isReadOnly && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenAssignDialog(position)}
                          disabled={filledSlots >= totalSlots}
                          className="h-8 px-2"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deletePositionMutation.mutate(position.id)}
                          className="h-8 px-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {/* Signups list */}
                  {signups.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 pl-11">
                      {signups.map((signup: any) => (
                        <Badge
                          key={signup.id}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {signup.profiles?.full_name || "Unknown"}
                          {!isReadOnly && (
                            <button
                              onClick={() => removeSignupMutation.mutate(signup.id)}
                              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {/* Empty slots indicator */}
                  {filledSlots < totalSlots && (
                    <div className="flex flex-wrap gap-2 mt-2 pl-11">
                      {Array.from({ length: totalSlots - filledSlots }).map((_, i) => (
                        <Badge
                          key={`empty-${i}`}
                          variant="outline"
                          className="text-muted-foreground border-dashed"
                        >
                          {language === "ko" ? "빈 자리" : "Open"}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add Position Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === "ko" ? "역할 추가" : "Add Position"}
              </DialogTitle>
              <DialogDescription>
                {language === "ko"
                  ? "이 예배에 필요한 역할을 추가하세요"
                  : "Add a role needed for this worship service"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "ko" ? "역할 선택" : "Select Role"}
                </label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === "ko" ? "역할을 선택하세요" : "Select a role"} />
                  </SelectTrigger>
                  <SelectContent>
                    {customRoles?.map((role) => {
                      const IconComp = ICON_MAP[role.icon] || User;
                      return (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded flex items-center justify-center text-white"
                              style={{ backgroundColor: role.color }}
                            >
                              <IconComp className="w-3 h-3" />
                            </div>
                            <span>
                              {language === "ko" && role.name_ko ? role.name_ko : role.name}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "ko" ? "필요 인원" : "Slots needed"}
                </label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={slots}
                  onChange={(e) => setSlots(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                {language === "ko" ? "취소" : "Cancel"}
              </Button>
              <Button
                onClick={() => addPositionMutation.mutate()}
                disabled={!selectedRoleId || addPositionMutation.isPending}
              >
                {addPositionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {language === "ko" ? "추가" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Member Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === "ko" ? "멤버 배정" : "Assign Member"}
              </DialogTitle>
              <DialogDescription>
                {assigningPosition?.church_custom_roles && (
                  <span>
                    {language === "ko"
                      ? `${assigningPosition.church_custom_roles.name_ko || assigningPosition.church_custom_roles.name} 역할에 멤버를 배정하세요`
                      : `Assign a member to ${assigningPosition.church_custom_roles.name}`}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={language === "ko" ? "이름으로 검색..." : "Search by name..."}
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {language === "ko" ? "검색 결과가 없습니다" : "No members found"}
                  </p>
                ) : (
                  filteredMembers.map((member: any) => (
                    <button
                      key={member.id}
                      onClick={() => {
                        if (assigningPosition) {
                          assignMemberMutation.mutate({
                            positionId: assigningPosition.id,
                            userId: member.id,
                          });
                        }
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {member.full_name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                {language === "ko" ? "닫기" : "Close"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
