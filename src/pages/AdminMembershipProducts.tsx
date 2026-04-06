import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { MembershipProductCard } from "@/components/admin/MembershipProductCard";
import { useAllMembershipProducts } from "@/hooks/useMembershipProducts";
import { useTranslation } from "@/hooks/useTranslation";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CreditCard, Loader2, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminMembershipProducts = () => {
  const { language } = useTranslation();
  const { data: products, isLoading, error, refetch } = useAllMembershipProducts();
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupResult, setSetupResult] = useState<Record<string, any> | null>(null);

  const handleStripeSetup = async () => {
    setIsSettingUp(true);
    setSetupResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("setup-stripe-products", {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      setSetupResult(data);
      toast.success(language === "ko" ? "Stripe 상품이 설정되었습니다" : "Stripe products configured");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to setup Stripe products");
    } finally {
      setIsSettingUp(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              {language === "ko" ? "멤버십 상품 관리" : "Membership Products"}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {language === "ko" 
              ? "멤버십 가격, 결제 주기, 체험 기간을 설정합니다. 변경사항은 즉시 반영됩니다."
              : "Configure membership pricing, billing cycles, and trial periods. Changes are applied immediately."
            }
          </p>
        </div>

        {/* Stripe Setup Button */}
        <Card className="mb-6 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              {language === "ko" ? "Stripe 상품 초기화" : "Stripe Product Setup"}
            </CardTitle>
            <CardDescription>
              {language === "ko"
                ? "Stripe에 멤버십 상품과 가격을 생성하고 ID를 자동 저장합니다. 이미 설정된 항목은 스킵됩니다."
                : "Creates membership products and prices in Stripe and saves IDs automatically. Already configured items are skipped."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleStripeSetup} disabled={isSettingUp} variant="default">
              {isSettingUp ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === "ko" ? "설정 중..." : "Setting up..."}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  {language === "ko" ? "Stripe 상품 초기화 실행" : "Run Stripe Setup"}
                </>
              )}
            </Button>

            {setupResult && (
              <pre className="mt-4 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-64">
                {JSON.stringify(setupResult, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{language === "ko" ? "Stripe Price ID 안내" : "Stripe Price ID Note"}</AlertTitle>
          <AlertDescription>
            {language === "ko" 
              ? "가격을 변경하면 Stripe Dashboard에서 새 Price를 생성하고 Price ID를 업데이트해야 합니다."
              : "When changing prices, create a new Price in Stripe Dashboard and update the Price ID here."
            }
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">
                {language === "ko" ? "오류 발생" : "Error"}
              </CardTitle>
              <CardDescription>
                {language === "ko" 
                  ? "멤버십 상품을 불러올 수 없습니다."
                  : "Could not load membership products."
                }
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {products?.map((product) => (
              <MembershipProductCard
                key={product.id}
                product={product}
                language={language as "en" | "ko"}
              />
            ))}
          </div>
        )}

        {/* Terminology Guide */}
        <Card className="mt-8 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">
              {language === "ko" ? "📝 용어 정책 (한국 교회 문화)" : "📝 Terminology Policy"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-destructive mb-2">
                  {language === "ko" ? "❌ 사용 금지" : "❌ Avoid"}
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Subscription (구독)</li>
                  <li>• Purchase (구매)</li>
                  <li>• Subscribe (구독하다)</li>
                  <li>• Payment (결제)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-green-600 mb-2">
                  {language === "ko" ? "✅ 권장 표현" : "✅ Use Instead"}
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Membership (멤버십)</li>
                  <li>• Join (가입)</li>
                  <li>• Become a Member (멤버 되기)</li>
                  <li>• Contribution (후원) / 참여비</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminMembershipProducts;
