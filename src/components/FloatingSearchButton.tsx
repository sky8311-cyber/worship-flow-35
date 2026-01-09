import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FloatingSearchButtonProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const FloatingSearchButton = ({ value, onChange, placeholder }: FloatingSearchButtonProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isExpanded]);

  // Render the expanded overlay via portal to escape parent stacking context
  const expandedOverlay = isExpanded && createPortal(
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={() => setIsExpanded(false)}
      />
      
      {/* Top search bar */}
      <div className="fixed top-0 left-0 right-0 z-50 p-3 bg-background border-b shadow-lg animate-in slide-in-from-top duration-200">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-10 text-base"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => {
              if (value) {
                onChange("");
              } else {
                setIsExpanded(false);
              }
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </>,
    document.body
  );

  return (
    <>
      {expandedOverlay}
      {!isExpanded && (
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
    </>
  );
};
