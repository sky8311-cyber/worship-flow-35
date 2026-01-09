import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FloatingSearchButtonProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasCartItems?: boolean;
}

export const FloatingSearchButton = ({ value, onChange, placeholder, hasCartItems = false }: FloatingSearchButtonProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);


  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed left-4 z-40 lg:hidden transition-all duration-300 ease-out",
        hasCartItems ? "bottom-40" : "bottom-24",
        isExpanded ? "right-4" : ""
      )}
    >
      {isExpanded ? (
        <div className="flex items-center gap-2 bg-card border rounded-full shadow-lg p-1.5 animate-scale-in">
          <Search className="h-5 w-5 ml-3 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => {
              if (value) {
                onChange("");
              } else {
                setIsExpanded(false);
              }
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setIsExpanded(true)}
        >
          <Search className="h-6 w-6" />
          {value && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-background" />
          )}
        </Button>
      )}
    </div>
  );
};
