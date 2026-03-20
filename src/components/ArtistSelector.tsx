import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsMobile } from "@/hooks/use-mobile";

interface ArtistSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const ArtistSelector = ({ value, onValueChange }: ArtistSelectorProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { data: existingArtists = [] } = useQuery({
    queryKey: ["all-artists"],
    queryFn: async () => {
      const { data } = await supabase
        .from("songs")
        .select("artist")
        .not("artist", "is", null)
        .eq("status", "published");
      
      const allArtists = new Set<string>();
      data?.forEach(song => {
        if (song.artist) {
          allArtists.add(song.artist.trim());
        }
      });
      return Array.from(allArtists).sort();
    }
  });

  const filteredArtists = existingArtists.filter(artist =>
    artist.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (artist: string) => {
    onValueChange(artist);
    setOpen(false);
    setSearchValue("");
  };

  const handleAddNew = () => {
    if (searchValue.trim()) {
      onValueChange(searchValue.trim());
      setOpen(false);
      setSearchValue("");
    }
  };

  const showAddNew = searchValue.trim() && 
    !existingArtists.some(a => a.toLowerCase() === searchValue.toLowerCase());

  const TriggerButton = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="w-full justify-between"
    >
      {value || t("artistSelector.selectArtist")}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  const CommandContent = (
    <Command>
      <CommandInput 
        placeholder={t("artistSelector.searchArtist")} 
        value={searchValue}
        onValueChange={setSearchValue}
        className="text-base"
      />
      <CommandList>
        <CommandEmpty>
          {showAddNew ? (
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleAddNew}
            >
              + {t("artistSelector.addNew")}: "{searchValue}"
            </Button>
          ) : (
            t("artistSelector.noArtistFound")
          )}
        </CommandEmpty>
        <CommandGroup className="max-h-64 overflow-y-auto">
          {filteredArtists.map((artist) => (
            <CommandItem
              key={artist}
              value={artist}
              onSelect={() => handleSelect(artist)}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  value === artist ? "opacity-100" : "opacity-0"
                )}
              />
              {artist}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  // Mobile: Use Drawer (bottom sheet) for better keyboard handling
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {TriggerButton}
        </DrawerTrigger>
        <DrawerContent className="max-h-[60vh]">
          <div className="p-4">
            {CommandContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {TriggerButton}
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        {CommandContent}
      </PopoverContent>
    </Popover>
  );
};
