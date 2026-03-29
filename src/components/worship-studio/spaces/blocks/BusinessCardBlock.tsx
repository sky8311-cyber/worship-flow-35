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
      <div className="h-12 w-12 rounded-full bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <User className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-serif font-semibold text-foreground truncate">
          {name || "이름"}
        </p>
        {role && <p className="text-[10px] text-muted-foreground truncate">{role}</p>}
        {email && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
            <Mail className="h-2.5 w-2.5 flex-shrink-0" /> {email}
          </p>
        )}
        {phone && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
            <Phone className="h-2.5 w-2.5 flex-shrink-0" /> {phone}
          </p>
        )}
      </div>
    </div>
  );
}
