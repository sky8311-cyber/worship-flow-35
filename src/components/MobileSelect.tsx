import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Check, ChevronsUpDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface MobileSelectOption {
  value: string;
  label: string;
}

interface MobileSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: MobileSelectOption[];
  placeholder: string;
  className?: string;
}

export const MobileSelect = ({ 
  value, 
  onValueChange, 
  options, 
  placeholder,
  className 
}: MobileSelectProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  
  const selectedOption = options.find(o => o.value === value);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setOpen(false);
  };

  const TriggerButton = (
    <Button 
      variant="outline" 
      role="combobox"
      aria-expanded={open}
      className={cn("w-full justify-between font-normal", className)}
    >
      <span className="truncate">{selectedOption?.label || placeholder}</span>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  const OptionsList = (
    <div className="space-y-1 p-2 max-h-[50vh] overflow-y-auto">
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "secondary" : "ghost"}
          className="w-full justify-start gap-2 font-normal"
          onClick={() => handleSelect(option.value)}
        >
          <Check className={cn("h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
          {option.label}
        </Button>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
        <DrawerContent className="max-h-[60vh]">
          <div className="py-4">
            {OptionsList}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{TriggerButton}</PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-background" align="start">
        {OptionsList}
      </PopoverContent>
    </Popover>
  );
};
