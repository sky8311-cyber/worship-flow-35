import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface LikersDialogProps {
  postId: string;
  postType: "community_post" | "worship_set" | "calendar_event" | "feedback_post";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Liker {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export function LikersDialog({ postId, postType, open, onOpenChange }: LikersDialogProps) {
  const { data: likers = [], isLoading } = useQuery({
    queryKey: ["post-likers", postId],
    queryFn: async () => {
      // Get all user IDs who liked this post
      const { data: likes, error: likesError } = await supabase
        .from("post_likes")
        .select("user_id")
        .eq("post_id", postId)
        .eq("post_type", postType);

      if (likesError) throw likesError;
      if (!likes || likes.length === 0) return [];

      const userIds = likes.map((like) => like.user_id);

      // Fetch profile details for all likers
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      if (profilesError) throw profilesError;
      return profiles as Liker[];
    },
    enabled: open && !!postId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Likes</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : likers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No likes yet
            </div>
          ) : (
            <div className="space-y-2">
              {likers.map((liker) => (
                <div
                  key={liker.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={liker.avatar_url || undefined} alt={liker.full_name} />
                    <AvatarFallback>{liker.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{liker.full_name}</span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
