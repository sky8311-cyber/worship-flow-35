import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Users, User, Check, Loader2, LogOut } from "lucide-react";
import {
  Church, Music, Volume2, Mic, Guitar, Monitor,
  BookOpen, Heart, Star, Sparkles, Camera, Laptop
} from "lucide-react";
import { creditPositionSignupReward } from "@/lib/rewardsHelper";

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

interface PositionSignupCardProps {
  serviceSetId: string;
}

export function PositionSignupCard({ serviceSetId }: PositionSignupCardProps) {
  const { language } = useLanguageContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
      return data || [];
    },
    enabled: !!serviceSetId,
  });

  // Self-signup mutation
  const signupMutation = useMutation({
    mutationFn: async (positionId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("worship_set_signups")
        .insert({
          position_id: positionId,
          user_id: user.id,
          status: "confirmed",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "신청되었습니다!" : "Signed up!");
      queryClient.invalidateQueries({ queryKey: ["worship-set-positions", serviceSetId] });
      
      // Credit K-Seed reward for position signup (fire-and-forget)
      if (user) {
        creditPositionSignupReward(user.id, serviceSetId);
      }
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error(language === "ko" ? "이미 신청하셨습니다" : "Already signed up");
      } else {
        toast.error(language === "ko" ? "신청 실패" : "Failed to sign up");
      }
    },
  });

  // Cancel signup mutation
  const cancelSignupMutation = useMutation({
    mutationFn: async (signupId: string) => {
      const { error } = await supabase
        .from("worship_set_signups")
        .delete()
        .eq("id", signupId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "신청이 취소되었습니다" : "Signup cancelled");
      queryClient.invalidateQueries({ queryKey: ["worship-set-positions", serviceSetId] });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!positions?.length) {
    return null; // Don't show if no positions defined
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" />
          {language === "ko" ? "팀 역할 신청" : "Team Positions"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {positions.map((position: any) => {
            const role = position.church_custom_roles;
            const signups = position.worship_set_signups || [];
            const IconComp = ICON_MAP[role?.icon || "user"] || User;
            const filledSlots = signups.length;
            const totalSlots = position.slots;
            const isOpen = filledSlots < totalSlots;
            
            // Check if current user is signed up for this position
            const userSignup = signups.find((s: any) => s.user_id === user?.id);
            const isUserSignedUp = !!userSignup;

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
                      <Badge 
                        variant={isOpen ? "secondary" : "outline"} 
                        className="text-xs"
                      >
                        {filledSlots}/{totalSlots}
                      </Badge>
                    </div>
                  </div>
                  {isUserSignedUp ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelSignupMutation.mutate(userSignup.id)}
                      disabled={cancelSignupMutation.isPending}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      {cancelSignupMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4" />
                      )}
                      {language === "ko" ? "취소" : "Cancel"}
                    </Button>
                  ) : isOpen ? (
                    <Button
                      size="sm"
                      onClick={() => signupMutation.mutate(position.id)}
                      disabled={signupMutation.isPending}
                      className="gap-1"
                    >
                      {signupMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      {language === "ko" ? "신청" : "Sign Up"}
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {language === "ko" ? "마감" : "Full"}
                    </Badge>
                  )}
                </div>
                {/* Signups list */}
                {signups.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 pl-11">
                    {signups.map((signup: any) => (
                      <Badge
                        key={signup.id}
                        variant={signup.user_id === user?.id ? "default" : "secondary"}
                        className="gap-1"
                      >
                        {signup.profiles?.full_name || "Unknown"}
                        {signup.user_id === user?.id && (
                          <Check className="w-3 h-3" />
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
      </CardContent>
    </Card>
  );
}
