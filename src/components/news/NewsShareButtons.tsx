import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface NewsShareButtonsProps {
  url: string;
  title: string;
  variant?: "inline" | "dropdown";
}

export const NewsShareButtons = ({ url, title, variant = "dropdown" }: NewsShareButtonsProps) => {
  const { language } = useTranslation();
  const [copied, setCopied] = useState(false);

  const fullUrl = url.startsWith("http") ? url : `https://kworship.app${url}`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success(language === "ko" ? "링크가 복사되었습니다" : "Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`;
    window.open(tweetUrl, "_blank");
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, "_blank");
  };

  const shareToKakao = () => {
    // KakaoTalk share via kakaolink scheme or web fallback
    const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(fullUrl)}`;
    window.open(kakaoUrl, "_blank");
  };

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={copyToClipboard}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="sm" onClick={shareToTwitter}>
          <span className="font-bold">𝕏</span>
        </Button>
        <Button variant="outline" size="sm" onClick={shareToFacebook}>
          <span className="font-bold text-blue-600">f</span>
        </Button>
        <Button variant="outline" size="sm" onClick={shareToKakao}>
          <span className="text-yellow-500">💬</span>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-1.5" />
          {language === "ko" ? "공유" : "Share"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={copyToClipboard}>
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {language === "ko" ? "링크 복사" : "Copy Link"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToTwitter}>
          <span className="mr-2 font-bold">𝕏</span>
          Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToFacebook}>
          <span className="mr-2 font-bold text-blue-600">f</span>
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToKakao}>
          <span className="mr-2">💬</span>
          KakaoTalk
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
