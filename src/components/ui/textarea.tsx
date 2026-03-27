import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = true, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

    const resize = React.useCallback((el: HTMLTextAreaElement | null) => {
      if (!el) return;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }, []);

    // Resize on value changes
    React.useEffect(() => {
      if (autoResize) resize(innerRef.current);
    }, [props.value, props.defaultValue, autoResize, resize]);

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        // Initial resize on mount
        if (autoResize) resize(node);
      },
      [ref, autoResize, resize],
    );

    const handleInput = React.useCallback(
      (e: React.FormEvent<HTMLTextAreaElement>) => {
        if (autoResize) resize(e.currentTarget);
      },
      [autoResize, resize],
    );

    return (
      <textarea
        className={cn(
          "flex min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          className,
        )}
        ref={setRefs}
        onInput={handleInput}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
