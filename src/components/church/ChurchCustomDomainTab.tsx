import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, CheckCircle, Clock, AlertCircle, Loader2, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface ChurchCustomDomainTabProps {
  churchAccount: {
    id: string;
    custom_domain: string | null;
    domain_status: string | null;
    domain_verified_at: string | null;
  };
  isOwner: boolean;
  onUpdate: () => void;
}

export function ChurchCustomDomainTab({ churchAccount, isOwner, onUpdate }: ChurchCustomDomainTabProps) {
  const { language } = useLanguageContext();
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState(churchAccount.custom_domain || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveDomainMutation = useMutation({
    mutationFn: async () => {
      const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
      
      const { error } = await supabase
        .from("church_accounts")
        .update({ 
          custom_domain: cleanDomain || null,
          domain_status: cleanDomain ? "pending" : "none",
          domain_verified_at: null,
        })
        .eq("id", churchAccount.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["church-accounts"] });
      onUpdate();
      toast.success(language === "ko" ? "도메인이 저장되었습니다" : "Domain saved");
    },
    onError: () => {
      toast.error(language === "ko" ? "도메인 저장에 실패했습니다" : "Failed to save domain");
    },
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 gap-1"><CheckCircle className="w-3 h-3" />{language === "ko" ? "활성" : "Active"}</Badge>;
      case "verified":
        return <Badge variant="secondary" className="gap-1"><CheckCircle className="w-3 h-3" />{language === "ko" ? "확인됨" : "Verified"}</Badge>;
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />{language === "ko" ? "대기 중" : "Pending"}</Badge>;
      default:
        return <Badge variant="outline">{language === "ko" ? "미설정" : "Not Set"}</Badge>;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(language === "ko" ? "복사됨" : "Copied");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {language === "ko" ? "커스텀 도메인" : "Custom Domain"}
          </CardTitle>
          <CardDescription>
            {language === "ko" 
              ? "교회 브랜드에 맞는 커스텀 도메인을 연결하세요."
              : "Connect a custom domain that matches your church brand."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">
                {churchAccount.custom_domain || (language === "ko" ? "도메인 미설정" : "No domain set")}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === "ko" ? "현재 상태" : "Current Status"}
              </p>
            </div>
            {getStatusBadge(churchAccount.domain_status)}
          </div>

          {/* Domain Input */}
          {isOwner && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{language === "ko" ? "도메인 입력" : "Enter Domain"}</Label>
                <div className="flex gap-2">
                  <Input 
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="worship.yourchurch.com"
                  />
                  <Button 
                    onClick={() => saveDomainMutation.mutate()}
                    disabled={saveDomainMutation.isPending}
                  >
                    {saveDomainMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      language === "ko" ? "저장" : "Save"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* DNS Instructions */}
          {churchAccount.custom_domain && churchAccount.domain_status === "pending" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium">
                    {language === "ko" 
                      ? "DNS 설정이 필요합니다"
                      : "DNS configuration required"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === "ko" 
                      ? "도메인 제공업체에서 다음 DNS 레코드를 추가하세요:"
                      : "Add the following DNS records at your domain provider:"}
                  </p>
                  
                  <div className="space-y-2 bg-muted/50 p-3 rounded-lg text-sm font-mono">
                    <div className="flex items-center justify-between">
                      <span>A Record: @ → 185.158.133.1</span>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => copyToClipboard("185.158.133.1")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>A Record: www → 185.158.133.1</span>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => copyToClipboard("185.158.133.1")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>TXT Record: _lovable → lovable_verify={churchAccount.id.slice(0, 8)}</span>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => copyToClipboard(`lovable_verify=${churchAccount.id.slice(0, 8)}`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {language === "ko" 
                      ? "DNS 변경 사항이 적용되기까지 최대 72시간이 소요될 수 있습니다."
                      : "DNS changes may take up to 72 hours to propagate."}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Active Domain */}
          {churchAccount.custom_domain && churchAccount.domain_status === "active" && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">
                      {language === "ko" ? "도메인이 활성화되었습니다" : "Domain is active"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      https://{churchAccount.custom_domain}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`https://${churchAccount.custom_domain}`, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {language === "ko" ? "방문" : "Visit"}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Help Link */}
          <div className="pt-4 border-t">
            <Button 
              variant="link" 
              className="p-0 h-auto"
              onClick={() => window.open("https://docs.lovable.dev/features/custom-domain", "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {language === "ko" ? "커스텀 도메인 설정 가이드" : "Custom Domain Setup Guide"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
