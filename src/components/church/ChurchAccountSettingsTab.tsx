import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguageContext } from "@/contexts/LanguageContext";
import type { Json } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Trash2, Save, Paintbrush } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChurchLogoUpload } from "./ChurchLogoUpload";
import { ChurchThemeCustomizer } from "./ChurchThemeCustomizer";

interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
}

interface ChurchAccount {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  billing_email: string | null;
  slogan: string | null;
  theme_config: ThemeConfig | Record<string, unknown> | null;
}

interface ChurchAccountSettingsTabProps {
  churchAccount: ChurchAccount;
  isOwner: boolean;
  onUpdate: () => void;
}

const DEFAULT_THEME: ThemeConfig = {
  primaryColor: "#2b4b8a",
  accentColor: "#d16265",
};

const parseThemeConfig = (config: ThemeConfig | Record<string, unknown> | null): ThemeConfig => {
  if (!config) return DEFAULT_THEME;
  if (typeof config === 'object' && 'primaryColor' in config && 'accentColor' in config) {
    return {
      primaryColor: String(config.primaryColor || DEFAULT_THEME.primaryColor),
      accentColor: String(config.accentColor || DEFAULT_THEME.accentColor),
    };
  }
  return DEFAULT_THEME;
};

export function ChurchAccountSettingsTab({ churchAccount, isOwner, onUpdate }: ChurchAccountSettingsTabProps) {
  const { language } = useLanguageContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState(churchAccount.name);
  const [description, setDescription] = useState(churchAccount.description || "");
  const [website, setWebsite] = useState(churchAccount.website || "");
  const [billingEmail, setBillingEmail] = useState(churchAccount.billing_email || "");
  const [slogan, setSlogan] = useState(churchAccount.slogan || "");
  const [logoUrl, setLogoUrl] = useState(churchAccount.logo_url);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(
    parseThemeConfig(churchAccount.theme_config)
  );

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("church_accounts")
        .update({
          name,
          description: description || null,
          website: website || null,
          billing_email: billingEmail || null,
          slogan: slogan || null,
          theme_config: themeConfig as unknown as Json,
        })
        .eq("id", churchAccount.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "저장되었습니다" : "Settings saved");
      onUpdate();
    },
    onError: () => {
      toast.error(language === "ko" ? "저장 실패" : "Failed to save");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("church_accounts")
        .delete()
        .eq("id", churchAccount.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "교회 계정이 삭제되었습니다" : "Church account deleted");
      queryClient.invalidateQueries({ queryKey: ["church-accounts"] });
      navigate("/church-account");
    },
    onError: () => {
      toast.error(language === "ko" ? "삭제 실패" : "Failed to delete");
    },
  });

  const hasChanges = 
    name !== churchAccount.name ||
    description !== (churchAccount.description || "") ||
    website !== (churchAccount.website || "") ||
    billingEmail !== (churchAccount.billing_email || "") ||
    slogan !== (churchAccount.slogan || "") ||
    JSON.stringify(themeConfig) !== JSON.stringify(parseThemeConfig(churchAccount.theme_config));

  return (
    <div className="space-y-6">
      {/* Logo & Branding Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paintbrush className="w-5 h-5" />
            {language === "ko" ? "브랜딩" : "Branding"}
          </CardTitle>
          <CardDescription>
            {language === "ko"
              ? "교회 로고, 슬로건, 테마 색상을 설정합니다."
              : "Set your church logo, slogan, and theme colors."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>{language === "ko" ? "교회 로고" : "Church Logo"}</Label>
            <ChurchLogoUpload
              churchAccountId={churchAccount.id}
              currentLogoUrl={logoUrl}
              churchName={name}
              onUpload={(url) => setLogoUrl(url)}
            />
          </div>

          {/* Slogan */}
          <div className="space-y-2">
            <Label htmlFor="slogan">{language === "ko" ? "슬로건" : "Slogan"}</Label>
            <Input
              id="slogan"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder={language === "ko" ? "예: 믿음과 사랑으로 하나 되는 교회" : "e.g., United in Faith and Love"}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              {language === "ko" ? "교회의 비전이나 모토를 입력하세요 (최대 100자)" : "Enter your church's vision or motto (max 100 characters)"}
            </p>
          </div>

          {/* Theme Customizer */}
          <div className="space-y-2">
            <Label>{language === "ko" ? "테마 색상" : "Theme Colors"}</Label>
            <ChurchThemeCustomizer
              themeConfig={themeConfig}
              onChange={setThemeConfig}
            />
          </div>
        </CardContent>
      </Card>

      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "ko" ? "기본 정보" : "Basic Information"}</CardTitle>
          <CardDescription>
            {language === "ko"
              ? "교회 계정의 기본 정보를 수정합니다."
              : "Edit basic information for this church account."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{language === "ko" ? "교회 이름" : "Church Name"} *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === "ko" ? "예: 사랑의교회" : "e.g., Grace Community Church"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{language === "ko" ? "설명" : "Description"}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === "ko" ? "교회에 대한 간단한 설명" : "Brief description of your church"}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">{language === "ko" ? "웹사이트" : "Website"}</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.yourchurch.org"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingEmail">{language === "ko" ? "결제 이메일" : "Billing Email"}</Label>
            <Input
              id="billingEmail"
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder="billing@yourchurch.org"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={!hasChanges || !name || updateMutation.isPending}
              className="gap-2"
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              {language === "ko" ? "저장" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isOwner && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">
              {language === "ko" ? "위험 구역" : "Danger Zone"}
            </CardTitle>
            <CardDescription>
              {language === "ko"
                ? "이 작업은 되돌릴 수 없습니다."
                : "These actions cannot be undone."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2 w-full sm:w-auto">
                  <Trash2 className="w-4 h-4" />
                  <span className="truncate">{language === "ko" ? "교회 계정 삭제" : "Delete Church Account"}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {language === "ko" ? "정말 삭제하시겠습니까?" : "Are you sure?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {language === "ko"
                      ? "이 교회 계정을 삭제하면 모든 멤버가 제거되고 연결된 커뮤니티의 연결이 해제됩니다. 이 작업은 되돌릴 수 없습니다."
                      : "Deleting this church account will remove all members and unlink all connected communities. This action cannot be undone."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{language === "ko" ? "취소" : "Cancel"}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {language === "ko" ? "삭제" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
