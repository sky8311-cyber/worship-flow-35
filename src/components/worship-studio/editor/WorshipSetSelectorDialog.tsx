import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileStack, Check, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";

interface WorshipSet {
  id: string;
  service_name: string | null;
  date: string | null;
  worship_leader: string | null;
  status: string;
}

interface WorshipSetSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (set: WorshipSet) => void;
}

export function WorshipSetSelectorDialog({ open, onOpenChange, onSelect }: WorshipSetSelectorDialogProps) {
  const { language } = useTranslation();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const { data: sets, isLoading } = useQuery({
    queryKey: ["worship-sets-for-embed", user?.id, search],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from("service_sets")
        .select("id, service_name, date, worship_leader, status")
        .eq("created_by", user.id)
        .eq("status", "published")
        .order("date", { ascending: false })
        .limit(50);
      
      if (search) {
        query = query.ilike("service_name", `%${search}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as WorshipSet[];
    },
    enabled: open && !!user,
  });
  
  const handleSelect = (set: WorshipSet) => {
    setSelectedId(set.id);
    onSelect(set);
    onOpenChange(false);
    setSearch("");
    setSelectedId(null);
  };
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "PPP", { locale: language === "ko" ? ko : enUS });
    } catch {
      return dateStr;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === "ko" ? "예배셋 삽입" : "Insert Worship Set"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === "ko" ? "예배셋 이름 검색..." : "Search worship sets..."}
            className="pl-10"
            autoFocus
          />
        </div>
        
        <ScrollArea className="h-80 mt-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : !sets?.length ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileStack className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{language === "ko" ? "발행된 예배셋이 없습니다" : "No published worship sets"}</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {sets.map(set => (
                <button
                  key={set.id}
                  onClick={() => handleSelect(set)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                    selectedId === set.id
                      ? "bg-primary/10 border border-primary"
                      : "hover:bg-muted border border-transparent"
                  )}
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                    <FileStack className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {set.service_name || (language === "ko" ? "제목 없음" : "Untitled")}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {set.date && (
                        <>
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(set.date)}</span>
                        </>
                      )}
                      {set.worship_leader && (
                        <span className="truncate">• {set.worship_leader}</span>
                      )}
                    </div>
                  </div>
                  {selectedId === set.id && (
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
