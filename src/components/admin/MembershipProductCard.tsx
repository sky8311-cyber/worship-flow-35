import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Crown, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MembershipProduct, formatPrice } from "@/hooks/useMembershipProducts";

interface MembershipProductCardProps {
  product: MembershipProduct;
  language: "en" | "ko";
}

export function MembershipProductCard({ product, language }: MembershipProductCardProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name_en: product.display_name_en,
    display_name_ko: product.display_name_ko,
    description_en: product.description_en || "",
    description_ko: product.description_ko || "",
    price_usd: product.price_usd,
    price_krw: product.price_krw,
    billing_cycle: product.billing_cycle,
    billing_cycle_label_en: product.billing_cycle_label_en || "",
    billing_cycle_label_ko: product.billing_cycle_label_ko || "",
    trial_days: product.trial_days,
    stripe_price_id_usd: product.stripe_price_id_usd || "",
    is_active: product.is_active,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("membership_products")
        .update({
          display_name_en: data.display_name_en,
          display_name_ko: data.display_name_ko,
          description_en: data.description_en || null,
          description_ko: data.description_ko || null,
          price_usd: data.price_usd,
          price_krw: data.price_krw,
          billing_cycle: data.billing_cycle,
          billing_cycle_label_en: data.billing_cycle_label_en || null,
          billing_cycle_label_ko: data.billing_cycle_label_ko || null,
          trial_days: data.trial_days,
          stripe_price_id_usd: data.stripe_price_id_usd || null,
          is_active: data.is_active,
        })
        .eq("id", product.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership-products"] });
      queryClient.invalidateQueries({ queryKey: ["membership-products-all"] });
      toast.success(language === "ko" ? "저장되었습니다" : "Saved successfully");
      setIsEditing(false);
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error(language === "ko" ? "저장 실패" : "Save failed");
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const Icon = product.product_key === "full_membership" ? Crown : Building2;
  const iconColor = product.product_key === "full_membership" ? "text-amber-500" : "text-blue-500";

  return (
    <Card className={!product.is_active ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <CardTitle className="text-lg">
                {language === "ko" ? product.display_name_ko : product.display_name_en}
              </CardTitle>
              <CardDescription className="text-xs font-mono text-muted-foreground">
                {product.product_key}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {product.is_active ? (
              <Badge className="bg-green-500">{language === "ko" ? "활성" : "Active"}</Badge>
            ) : (
              <Badge variant="secondary">{language === "ko" ? "비활성" : "Inactive"}</Badge>
            )}
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  {language === "ko" ? "저장" : "Save"}
                </>
              ) : (
                language === "ko" ? "편집" : "Edit"
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            {/* Display Names */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "ko" ? "이름 (영어)" : "Name (EN)"}</Label>
                <Input
                  value={formData.display_name_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name_en: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "ko" ? "이름 (한국어)" : "Name (KO)"}</Label>
                <Input
                  value={formData.display_name_ko}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name_ko: e.target.value }))}
                />
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "ko" ? "가격 (USD 센트)" : "Price (USD cents)"}</Label>
                <Input
                  type="number"
                  value={formData.price_usd}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_usd: parseInt(e.target.value) || 0 }))}
                  placeholder="4999 = $49.99"
                />
                <p className="text-xs text-muted-foreground">
                  = {formatPrice(formData.price_usd, "usd")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{language === "ko" ? "가격 (KRW)" : "Price (KRW)"}</Label>
                <Input
                  type="number"
                  value={formData.price_krw}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_krw: parseInt(e.target.value) || 0 }))}
                  placeholder="59000"
                />
                <p className="text-xs text-muted-foreground">
                  = {formatPrice(formData.price_krw, "krw")}
                </p>
              </div>
            </div>

            {/* Billing Cycle & Trial */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "ko" ? "결제 주기" : "Billing Cycle"}</Label>
                <Select
                  value={formData.billing_cycle}
                  onValueChange={(val) => setFormData(prev => ({ 
                    ...prev, 
                    billing_cycle: val as "monthly" | "yearly",
                    billing_cycle_label_en: val === "monthly" ? "per month" : "per year",
                    billing_cycle_label_ko: val === "monthly" ? "월간" : "연간",
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{language === "ko" ? "월간" : "Monthly"}</SelectItem>
                    <SelectItem value="yearly">{language === "ko" ? "연간" : "Yearly"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === "ko" ? "체험 기간 (일)" : "Trial Days"}</Label>
                <Input
                  type="number"
                  value={formData.trial_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, trial_days: parseInt(e.target.value) || 0 }))}
                  min={0}
                  max={90}
                />
              </div>
            </div>

            {/* Stripe Price ID */}
            <div className="space-y-2">
              <Label>{language === "ko" ? "Stripe Price ID (USD)" : "Stripe Price ID (USD)"}</Label>
              <Input
                value={formData.stripe_price_id_usd}
                onChange={(e) => setFormData(prev => ({ ...prev, stripe_price_id_usd: e.target.value }))}
                placeholder="price_1ABC..."
                className="font-mono text-sm"
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between pt-2">
              <Label>{language === "ko" ? "활성화" : "Active"}</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            {/* Cancel Button */}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setFormData({
                  display_name_en: product.display_name_en,
                  display_name_ko: product.display_name_ko,
                  description_en: product.description_en || "",
                  description_ko: product.description_ko || "",
                  price_usd: product.price_usd,
                  price_krw: product.price_krw,
                  billing_cycle: product.billing_cycle,
                  billing_cycle_label_en: product.billing_cycle_label_en || "",
                  billing_cycle_label_ko: product.billing_cycle_label_ko || "",
                  trial_days: product.trial_days,
                  stripe_price_id_usd: product.stripe_price_id_usd || "",
                  is_active: product.is_active,
                });
                setIsEditing(false);
              }}
            >
              {language === "ko" ? "취소" : "Cancel"}
            </Button>
          </>
        ) : (
          /* Display Mode */
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{language === "ko" ? "가격 (USD)" : "Price (USD)"}</p>
              <p className="font-semibold text-lg">{formatPrice(product.price_usd, "usd")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{language === "ko" ? "가격 (KRW)" : "Price (KRW)"}</p>
              <p className="font-semibold text-lg">{formatPrice(product.price_krw, "krw")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{language === "ko" ? "결제 주기" : "Billing"}</p>
              <p className="font-medium">
                {language === "ko" 
                  ? (product.billing_cycle === "yearly" ? "연간" : "월간")
                  : (product.billing_cycle === "yearly" ? "Yearly" : "Monthly")
                }
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{language === "ko" ? "체험 기간" : "Trial"}</p>
              <p className="font-medium">{product.trial_days}{language === "ko" ? "일" : " days"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Stripe Price ID</p>
              <p className="font-mono text-xs truncate">
                {product.stripe_price_id_usd || (language === "ko" ? "미설정" : "Not set")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
