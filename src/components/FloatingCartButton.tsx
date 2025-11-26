import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface FloatingCartButtonProps {
  count: number;
  onClick: () => void;
}

export function FloatingCartButton({ count, onClick }: FloatingCartButtonProps) {
  const { t } = useTranslation();
  
  if (count === 0) return null;
  
  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
      <Button
        onClick={onClick}
        size="lg"
        className="shadow-lg hover:shadow-xl transition-all gap-2 text-base font-semibold px-6 py-6 rounded-full"
      >
        <Plus className="w-5 h-5" />
        <span className="hidden sm:inline">{t("songLibrary.addToSet")}</span>
        <span className="bg-white/20 px-2 py-1 rounded-full text-sm font-bold">
          {count}
        </span>
      </Button>
    </div>
  );
}
