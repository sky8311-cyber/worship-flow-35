import { useMemo } from "react";

export interface ContentBlock {
  id: string;
  type: "heading" | "paragraph" | "image" | "video" | "quote" | "verse" | "callout" | "divider";
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
  <p className="text-[15px] leading-relaxed text-foreground/90 mb-3 whitespace-pre-wrap">{data.text || ""}</p>
);

const ImageBlock = ({ data }: { data: Record<string, any> }) => (
  <figure className="my-5">
    <img
      src={data.url}
      alt={data.alt || data.caption || ""}
      className="w-full rounded-xl object-cover"
      loading="lazy"
    />
    {data.caption && (
      <figcaption className="text-xs text-muted-foreground text-center mt-2">{data.caption}</figcaption>
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
    <figure className="my-5">
      <div className="relative rounded-xl overflow-hidden bg-foreground" style={{ paddingTop: "56.25%" }}>
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
      {data.caption && (
        <figcaption className="text-xs text-muted-foreground text-center mt-2">{data.caption}</figcaption>
      )}
    </figure>
  );
};

const QuoteBlock = ({ data }: { data: Record<string, any> }) => (
  <blockquote className="border-l-4 border-amber-400/60 pl-4 py-2 my-4 italic text-foreground/80">
    <p className="text-[15px] leading-relaxed">{data.text || ""}</p>
    {data.source && <cite className="text-xs text-muted-foreground mt-1 block not-italic">— {data.source}</cite>}
  </blockquote>
);

const VerseBlock = ({ data }: { data: Record<string, any> }) => (
  <div className="my-5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-800/30 p-4">
    <p className="text-[15px] leading-relaxed text-foreground/90 italic">{data.text || ""}</p>
    {data.reference && (
      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mt-2">{data.reference}</p>
    )}
  </div>
);

const CalloutBlock = ({ data }: { data: Record<string, any> }) => {
  const icon = data.icon || "💡";
  return (
    <div className="my-5 rounded-xl bg-primary/5 border border-primary/10 p-4 flex gap-3">
      <span className="text-lg flex-shrink-0">{icon}</span>
      <p className="text-[15px] leading-relaxed text-foreground/90">{data.text || ""}</p>
    </div>
  );
};

const DividerBlock = () => (
  <hr className="my-6 border-border" />
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
