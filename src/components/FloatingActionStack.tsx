import React from "react";
import { cn } from "@/lib/utils";

interface FloatingActionStackProps {
  children: React.ReactNode;
  hasMiniPlayer?: boolean;
  hidden?: boolean;
}

export const FloatingActionStack = ({ 
  children, 
  hasMiniPlayer = false,
  hidden = false
}: FloatingActionStackProps) => {
  return (
    <div
      className={cn(
        "fixed right-4 z-40 flex flex-col-reverse gap-3 lg:hidden transition-all duration-300 ease-out",
        hasMiniPlayer ? "bottom-48" : "bottom-32",
        hidden 
          ? "translate-y-24 opacity-0 pointer-events-none" 
          : "translate-y-0 opacity-100"
      )}
    >
      {children}
    </div>
  );
};
