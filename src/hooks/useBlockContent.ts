import { useState, useCallback, useRef, useEffect } from "react";
import { useUpdateBlock } from "@/hooks/useSpaceBlocks";

export function useBlockContent(
  blockId: string,
  spaceId: string,
  initialContent: Record<string, any>
) {
  const [content, setContentState] = useState<Record<string, any>>(initialContent);
  const updateBlock = useUpdateBlock();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef(content);

  // Sync when initialContent changes from server
  useEffect(() => {
    setContentState(initialContent);
    latestRef.current = initialContent;
  }, [JSON.stringify(initialContent)]);

  const setContent = useCallback(
    (patch: Record<string, any>) => {
      const merged = { ...latestRef.current, ...patch };
      latestRef.current = merged;
      setContentState(merged);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        updateBlock.mutate({ id: blockId, spaceId, content: latestRef.current });
      }, 500);
    },
    [blockId, spaceId, updateBlock]
  );

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        updateBlock.mutate({ id: blockId, spaceId, content: latestRef.current });
      }
    };
  }, [blockId, spaceId, updateBlock]);

  return { content, setContent };
}
