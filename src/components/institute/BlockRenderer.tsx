import { useMemo } from "react";

export interface ContentBlock {
  id: string;
  type: "heading" | "paragraph" | "image" | "video" | "quote" | "verse" | "callout" | "divider" | "list";
  data: Record<string, any>;
}

interface BlockRendererProps {
  blocks: ContentBlock[];
}

const HeadingBlock = ({ data }: { data: Record<string, any> }) => {
  const level = data.level || 1;
  const text = data.text || "";
  if (level === 1) return <h1 className="text-2xl font-bold text-foreground mt-6 mb-3 first:mt-0">{text}</h1>;
  if (level === 2) return <h2 className="text-xl font-bold text-foreground mt-5 mb-2.5 first:mt-0">{text}</h2>;
  return <h3 className="text-lg font-semibold text-foreground mt-4 mb-2 first:mt-0">{text}</h3>;
};

const ParagraphBlock = ({ data }: { data: Record<string, any> }) => (
  <p className="text-[15px] leading-[1.8] text-foreground/90 mb-4 whitespace-pre-wrap">{data.text || ""}</p>
);

const ImageBlock = ({ data }: { data: Record<string, any> }) => (
  <figure className="my-6">
    <img
      src={data.url}
      alt={data.alt || data.caption || ""}
      className="w-full rounded-lg shadow-sm object-cover max-h-[400px]"
      loading="lazy"
    />
    {data.caption && (
      <figcaption className="text-xs text-muted-foreground text-center mt-2.5 italic">{data.caption}</figcaption>
    )}
  </figure>
);

const VideoBlock = ({ data }: { data: Record<string, any> }) => {
  const embedUrl = useMemo(() => {
    const url = data.url || "";
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  }, [data.url]);

  if (!embedUrl) return null;

  return (
    <figure className="my-6">
      <div className="relative rounded-lg overflow-hidden shadow-sm" style={{ paddingTop: "56.25%" }}>
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
      {data.caption && (
        <figcaption className="text-xs text-muted-foreground text-center mt-2.5 italic">{data.caption}</figcaption>
      )}
    </figure>
  );
};

const QuoteBlock = ({ data }: { data: Record<string, any> }) => (
  <blockquote className="border-l-4 border-primary/30 pl-4 py-2 my-5 italic text-foreground/80">
    <p className="text-[15px] leading-relaxed">{data.text || ""}</p>
    {(data.attribution || data.source) && (
      <cite className="text-xs text-muted-foreground mt-1.5 block not-italic">— {data.attribution || data.source}</cite>
    )}
  </blockquote>
);

const ListBlock = ({ data }: { data: Record<string, any> }) => {
  const items: string[] = data.items || [];
  const Tag = data.ordered ? "ol" : "ul";
  return (
    <Tag className={`my-4 pl-6 space-y-1.5 text-[15px] leading-[1.8] text-foreground/90 ${data.ordered ? "list-decimal" : "list-disc"}`}>
      {items.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </Tag>
  );
};

const VerseBlock = ({ data }: { data: Record<string, any> }) => (
  <div className="my-6 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border-l-4 border-amber-500/70 dark:border-amber-400/50 p-4 pl-5">
    <p className="text-[15px] leading-[1.8] text-foreground/90 italic">{data.text || ""}</p>
    {data.reference && (
      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mt-2.5 tracking-wide">{data.reference}</p>
    )}
  </div>
);

const CalloutBlock = ({ data }: { data: Record<string, any> }) => {
  const icon = data.icon || "💡";
  return (
    <div className="my-6 rounded-xl bg-primary/5 border border-primary/15 p-4 flex gap-3 shadow-sm">
      <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] leading-[1.8] text-foreground/90">{data.text || ""}</p>
      </div>
    </div>
  );
};

const DividerBlock = () => (
  <hr className="my-8 border-border" />
);

const blockComponents: Record<string, React.FC<{ data: Record<string, any> }>> = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  image: ImageBlock,
  video: VideoBlock,
  quote: QuoteBlock,
  verse: VerseBlock,
  callout: CalloutBlock,
  divider: DividerBlock,
  list: ListBlock,
};

export const BlockRenderer = ({ blocks }: BlockRendererProps) => {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="inst-prose">
      {blocks.map((block) => {
        const Component = blockComponents[block.type];
        if (!Component) return null;
        return <Component key={block.id} data={block.data || {}} />;
      })}
    </div>
  );
};
