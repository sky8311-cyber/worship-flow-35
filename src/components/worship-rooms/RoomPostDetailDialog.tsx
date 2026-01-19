import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RoomPost } from "@/hooks/useRoomPosts";
import { RoomPostCard } from "./RoomPostCard";

interface RoomPostDetailDialogProps {
  post: RoomPost | null;
  roomId: string;
  isOwnRoom: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoomPostDetailDialog({ 
  post, 
  roomId, 
  isOwnRoom, 
  open, 
  onOpenChange 
}: RoomPostDetailDialogProps) {
  if (!post) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <RoomPostCard 
          post={post} 
          roomId={roomId} 
          isOwnRoom={isOwnRoom} 
        />
      </DialogContent>
    </Dialog>
  );
}
