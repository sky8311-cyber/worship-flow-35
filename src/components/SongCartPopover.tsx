import { useState, useMemo } from "react";
import { ShoppingCart, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Separator } from "@/components/ui/separator";
import { useSongCart } from "@/contexts/SongCartContext";
import { useTranslation } from "@/hooks/useTranslation";
import { AddToSetDialog } from "@/components/AddToSetDialog";

export const SongCartPopover = () => {
  const { cartItems, removeFromCart, clearCart, cartCount } = useSongCart();
  const { t } = useTranslation();
  const [isAddToSetOpen, setIsAddToSetOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  // Stabilize songs array to prevent unnecessary re-renders and useEffect triggers
  const songsForDialog = useMemo(() => 
    cartItems.map(item => ({
      id: item.id,
      title: item.title,
      artist: item.artist,
      default_key: item.default_key
    })), 
    [cartItems]
  );

  const handleAddToSetSuccess = () => {
    clearCart();
    setIsAddToSetOpen(false);
    setPopoverOpen(false);
  };

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1.5 bg-destructive text-destructive-foreground text-[10px] rounded-full h-4 min-w-4 flex items-center justify-center font-bold px-1">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t("songLibrary.cartTitle")} ({cartCount})
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">
                {t("songLibrary.cartTitle")} ({cartCount})
              </h4>
              {cartCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                  onClick={clearCart}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {t("songLibrary.clearCart")}
                </Button>
              )}
            </div>
          </div>
          <Separator />
          {cartCount > 0 ? (
            <>
              <ScrollArea className="max-h-64">
                <div className="p-2">
                  {cartItems.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group"
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-sm font-medium truncate">{song.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {song.artist || "-"} {song.default_key && `• ${song.default_key}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFromCart(song.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Separator />
              <div className="p-3">
                <Button 
                  className="w-full" 
                  onClick={() => setIsAddToSetOpen(true)}
                >
                  {t("songLibrary.addToSet")}
                </Button>
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {t("songLibrary.cartEmpty") || "카트가 비어있습니다"}
            </div>
          )}
        </PopoverContent>
      </Popover>

      <AddToSetDialog
        open={isAddToSetOpen}
        onOpenChange={setIsAddToSetOpen}
        songs={songsForDialog}
        onSuccess={handleAddToSetSuccess}
      />
    </>
  );
};
