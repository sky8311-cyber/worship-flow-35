import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Trash2, Users, RefreshCw, GripVertical, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CommunityTeamRotationTabProps {
  communityId: string;
  isAdmin: boolean;
  churchAccountId?: string | null;
}

interface RotationSchedule {
  id: string;
  name: string;
  name_ko: string | null;
  description: string | null;
  rotation_pattern: string;
  rotation_start_date: string;
  is_active: boolean;
}

interface RotationMember {
  id: string;
  rotation_schedule_id: string;
  user_id: string;
  role_id: string | null;
  rotation_order: number;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  role?: {
    name: string;
    name_ko: string | null;
    color: string | null;
  };
}

export function CommunityTeamRotationTab({ communityId, isAdmin, churchAccountId }: CommunityTeamRotationTabProps) {
  const { language } = useLanguageContext();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<RotationSchedule | null>(null);
  const [newSchedule, setNewSchedule] = useState({
    name: "",
    name_ko: "",
    description: "",
    rotation_pattern: "weekly",
    rotation_start_date: new Date(),
  });

  // Fetch rotation schedules for this community
  const { data: schedules, isLoading } = useQuery({
    queryKey: ["community-rotation-schedules", communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_rotation_schedules")
        .select("*")
        .eq("community_id", communityId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as RotationSchedule[];
    },
  });

  // Fetch members for selected schedule
  const { data: members } = useQuery({
    queryKey: ["rotation-members", selectedSchedule?.id],
    queryFn: async () => {
      if (!selectedSchedule) return [];
      
      const { data, error } = await supabase
        .from("team_rotation_members")
        .select(`
          *,
          profile:profiles(full_name, avatar_url),
          role:church_custom_roles(name, name_ko, color)
        `)
        .eq("rotation_schedule_id", selectedSchedule.id)
        .order("rotation_order");
      
      if (error) throw error;
      return data as RotationMember[];
    },
    enabled: !!selectedSchedule,
  });

  // Fetch community members for adding to rotation
  const { data: communityMembers } = useQuery({
    queryKey: ["community-members-for-rotation", communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_members")
        .select("user_id")
        .eq("community_id", communityId);
      
      if (error) throw error;
      if (!data || data.length === 0) return [];
      
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);
      
      return data.map(d => ({
        user_id: d.user_id,
        profile: profiles?.find(p => p.id === d.user_id)
      }));
    },
  });

  // Fetch custom roles from parent church account
  const { data: customRoles } = useQuery({
    queryKey: ["church-custom-roles-for-rotation", churchAccountId],
    queryFn: async () => {
      if (!churchAccountId) return [];
      const { data, error } = await supabase
        .from("church_custom_roles")
        .select("*")
        .eq("church_account_id", churchAccountId)
        .order("position");
      
      if (error) throw error;
      return data;
    },
    enabled: !!churchAccountId,
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async () => {
      if (!churchAccountId) throw new Error("Church account required");
      
      const { data, error } = await supabase
        .from("team_rotation_schedules")
        .insert({
          church_account_id: churchAccountId,
          community_id: communityId,
          name: newSchedule.name,
          name_ko: newSchedule.name_ko || null,
          description: newSchedule.description || null,
          rotation_pattern: newSchedule.rotation_pattern,
          rotation_start_date: format(newSchedule.rotation_start_date, "yyyy-MM-dd"),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-rotation-schedules", communityId] });
      setShowCreateDialog(false);
      setNewSchedule({
        name: "",
        name_ko: "",
        description: "",
        rotation_pattern: "weekly",
        rotation_start_date: new Date(),
      });
      toast.success(language === "ko" ? "로테이션 스케줄이 생성되었습니다" : "Rotation schedule created");
    },
    onError: () => {
      toast.error(language === "ko" ? "스케줄 생성에 실패했습니다" : "Failed to create schedule");
    },
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from("team_rotation_schedules")
        .delete()
        .eq("id", scheduleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-rotation-schedules", communityId] });
      setSelectedSchedule(null);
      toast.success(language === "ko" ? "스케줄이 삭제되었습니다" : "Schedule deleted");
    },
  });

  // Add member to rotation mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId?: string }) => {
      if (!selectedSchedule) throw new Error("No schedule selected");
      
      const nextOrder = members?.length || 0;
      
      const { error } = await supabase
        .from("team_rotation_members")
        .insert({
          rotation_schedule_id: selectedSchedule.id,
          user_id: userId,
          role_id: roleId || null,
          rotation_order: nextOrder,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rotation-members"] });
      toast.success(language === "ko" ? "멤버가 추가되었습니다" : "Member added");
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("team_rotation_members")
        .delete()
        .eq("id", memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rotation-members"] });
      toast.success(language === "ko" ? "멤버가 제거되었습니다" : "Member removed");
    },
  });

  const getPatternLabel = (pattern: string) => {
    const labels: Record<string, { ko: string; en: string }> = {
      weekly: { ko: "매주", en: "Weekly" },
      biweekly: { ko: "격주", en: "Biweekly" },
      monthly: { ko: "매월", en: "Monthly" },
    };
    return language === "ko" ? labels[pattern]?.ko : labels[pattern]?.en;
  };

  if (!churchAccountId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{language === "ko" ? "이 기능은 Church Account가 필요합니다" : "This feature requires a Church Account"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                {language === "ko" ? "팀 로테이션" : "Team Rotation"}
              </CardTitle>
              <CardDescription>
                {language === "ko" 
                  ? "커뮤니티 팀원 로테이션 스케줄을 관리합니다."
                  : "Manage team rotation schedules for this community."}
              </CardDescription>
            </div>
            {isAdmin && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    {language === "ko" ? "새 로테이션" : "New Rotation"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {language === "ko" ? "새 로테이션 스케줄" : "New Rotation Schedule"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>{language === "ko" ? "이름 (영문)" : "Name (English)"}</Label>
                      <Input 
                        value={newSchedule.name}
                        onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Sunday Service Team"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === "ko" ? "이름 (한글)" : "Name (Korean)"}</Label>
                      <Input 
                        value={newSchedule.name_ko}
                        onChange={(e) => setNewSchedule(prev => ({ ...prev, name_ko: e.target.value }))}
                        placeholder="예: 주일예배팀"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === "ko" ? "로테이션 주기" : "Rotation Pattern"}</Label>
                      <Select 
                        value={newSchedule.rotation_pattern}
                        onValueChange={(value) => setNewSchedule(prev => ({ ...prev, rotation_pattern: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">{language === "ko" ? "매주" : "Weekly"}</SelectItem>
                          <SelectItem value="biweekly">{language === "ko" ? "격주" : "Biweekly"}</SelectItem>
                          <SelectItem value="monthly">{language === "ko" ? "매월" : "Monthly"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{language === "ko" ? "시작일" : "Start Date"}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {format(newSchedule.rotation_start_date, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newSchedule.rotation_start_date}
                            onSelect={(date) => date && setNewSchedule(prev => ({ ...prev, rotation_start_date: date }))}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Button 
                      onClick={() => createScheduleMutation.mutate()}
                      disabled={!newSchedule.name || createScheduleMutation.isPending}
                      className="w-full"
                    >
                      {language === "ko" ? "생성" : "Create"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === "ko" ? "로딩 중..." : "Loading..."}
            </div>
          ) : !schedules?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{language === "ko" ? "로테이션 스케줄이 없습니다" : "No rotation schedules"}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {schedules.map((schedule) => (
                <Card 
                  key={schedule.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedSchedule?.id === schedule.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedSchedule(schedule)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {language === "ko" && schedule.name_ko ? schedule.name_ko : schedule.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {getPatternLabel(schedule.rotation_pattern)}
                        </p>
                      </div>
                      <Badge variant={schedule.is_active ? "default" : "outline"}>
                        {schedule.is_active 
                          ? (language === "ko" ? "활성" : "Active")
                          : (language === "ko" ? "비활성" : "Inactive")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-xs text-muted-foreground">
                      {language === "ko" ? "시작일:" : "Start:"} {new Date(schedule.rotation_start_date).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Schedule Details */}
      {selectedSchedule && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {language === "ko" && selectedSchedule.name_ko ? selectedSchedule.name_ko : selectedSchedule.name}
              </CardTitle>
              {isAdmin && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deleteScheduleMutation.mutate(selectedSchedule.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Members List */}
            <div className="space-y-2">
              {members?.map((member, index) => (
                <div 
                  key={member.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium w-6">{index + 1}</span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{member.profile?.full_name || "Unknown"}</p>
                    {member.role && (
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: member.role.color || undefined }}
                      >
                        {language === "ko" && member.role.name_ko ? member.role.name_ko : member.role.name}
                      </Badge>
                    )}
                  </div>
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeMemberMutation.mutate(member.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Member */}
            {isAdmin && (
              <div className="pt-4 border-t">
                <Label className="text-sm mb-2 block">
                  {language === "ko" ? "멤버 추가" : "Add Member"}
                </Label>
                <div className="flex gap-2">
                  <Select onValueChange={(userId) => addMemberMutation.mutate({ userId })}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={language === "ko" ? "멤버 선택" : "Select member"} />
                    </SelectTrigger>
                    <SelectContent>
                      {communityMembers
                        ?.filter(cm => !members?.some(m => m.user_id === cm.user_id))
                        .map((cm) => (
                          <SelectItem key={cm.user_id} value={cm.user_id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={cm.profile?.avatar_url || undefined} />
                                <AvatarFallback><User className="w-3 h-3" /></AvatarFallback>
                              </Avatar>
                              {cm.profile?.full_name || "Unknown"}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
