interface Props {
  content: Record<string, any>;
  isOwner: boolean;
  onContentChange: (p: Record<string, any>) => void;
}

export function StickyNoteBlock({ content, isOwner, onContentChange }: Props) {
  const text = (content.text as string) || "";
  const bgColor = (content.bgColor as string) || "#fef08a";

  return (
    <div
      className="h-full w-full p-3 flex flex-col"
      style={{
        backgroundColor: bgColor,
        boxShadow: "3px 3px 8px rgba(0,0,0,0.15)",
        transform: "rotate(-0.5deg)",
      }}
    >
      {isOwner ? (
        <textarea
          className="flex-1 w-full bg-transparent border-none outline-none resize-none text-sm text-gray-800 leading-relaxed"
          value={text}
          placeholder="메모를 입력하세요..."
          onChange={(e) => onContentChange({ text: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
          {text || "메모"}
        </p>
      )}
    </div>
  );
}
