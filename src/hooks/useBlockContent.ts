import { useState, useCallback, useRef, useEffect } from "react";
import { useUpdateBlock } from "@/hooks/useSpaceBlocks";

export function useBlockContent(
  blockId: string,
  spaceId: string,
  initialContent: Record<string, any>
) {
  const [content, setContentState] = useState<Record<string, any>>(initialContent);
  const updateBlock = useUpdateBlock();
  const updateBlockRef = useRef(updateBlock);
  updateBlockRef.current = updateBlock;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef(content);
  const blockIdRef = useRef(blockId);
  const spaceIdRef = useRef(spaceId);
  blockIdRef.current = blockId;
  spaceIdRef.current = spaceId;

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
        updateBlockRef.current.mutate({ id: blockIdRef.current, spaceId: spaceIdRef.current, content: latestRef.current });
      }, 500);
    },
    []
  );

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        updateBlockRef.current.mutate({ id: blockIdRef.current, spaceId: spaceIdRef.current, content: latestRef.current });
      }
    };
  }, []);

  return { content, setContent };
}
