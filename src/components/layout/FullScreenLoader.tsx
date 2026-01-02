import { cn } from "@/lib/utils";

interface FullScreenLoaderProps {
  label?: string;
  className?: string;
}

export function FullScreenLoader({ label = "Loading…", className }: FullScreenLoaderProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 grid place-items-center bg-background/95 backdrop-blur-sm",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-b-primary" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
