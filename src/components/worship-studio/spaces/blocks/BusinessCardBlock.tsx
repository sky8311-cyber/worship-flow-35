import { User, Mail, Phone } from "lucide-react";

interface Props {
  content: Record<string, any>;
  isOwner: boolean;
  onContentChange: (p: Record<string, any>) => void;
}

export function BusinessCardBlock({ content }: Props) {
  const name = (content.name as string) || "";
  const role = (content.role as string) || "";
  const email = (content.email as string) || "";
  const phone = (content.phone as string) || "";
  const photoUrl = (content.photo_url as string) || "";

  return (
    <div className="h-full w-full flex items-center gap-4 p-4 overflow-hidden">
      {/* Photo */}
      <div className="h-14 w-14 rounded-full bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <User className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-base font-serif font-semibold text-foreground truncate">
          {name || "이름"}
        </p>
        {role && <p className="text-xs text-muted-foreground truncate">{role}</p>}
        {email && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
            <Mail className="h-3 w-3 flex-shrink-0" /> {email}
          </p>
        )}
        {phone && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
            <Phone className="h-3 w-3 flex-shrink-0" /> {phone}
          </p>
        )}
      </div>
    </div>
  );
}
