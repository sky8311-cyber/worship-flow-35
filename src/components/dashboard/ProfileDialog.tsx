import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProfileSidebarCard } from "./ProfileSidebarCard";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats?: {
    sets: number;
    communities: number;
    collaborations: number;
  };
}

export const ProfileDialog = ({ open, onOpenChange, stats }: ProfileDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>프로필</DialogTitle>
        </DialogHeader>
        <ProfileSidebarCard stats={stats} />
      </DialogContent>
    </Dialog>
  );
};
