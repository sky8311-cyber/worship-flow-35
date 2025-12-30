import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProfileSidebarCard } from "./ProfileSidebarCard";

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  ministry_role: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  location: string | null;
  instrument: string | null;
}

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats?: {
    sets: number;
    communities: number;
    songs: number;
  };
  profileOverride?: Profile;
  title?: string;
}

export const ProfileDialog = ({ 
  open, 
  onOpenChange, 
  stats, 
  profileOverride,
  title 
}: ProfileDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title || "프로필"}</DialogTitle>
        </DialogHeader>
        <ProfileSidebarCard stats={stats} profileOverride={profileOverride} />
      </DialogContent>
    </Dialog>
  );
};
