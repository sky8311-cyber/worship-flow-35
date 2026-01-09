import { cn } from "@/lib/utils";

interface FloatingActionStackProps {
  children: React.ReactNode;
  hasMiniPlayer?: boolean;
}

export const FloatingActionStack = ({ 
  children, 
  hasMiniPlayer = false 
}: FloatingActionStackProps) => {
  return (
    <div
      className={cn(
        "fixed right-4 z-40 flex flex-col-reverse gap-3 lg:hidden transition-all duration-300 ease-out",
        hasMiniPlayer ? "bottom-32" : "bottom-24"
      )}
    >
      {children}
    </div>
  );
};
