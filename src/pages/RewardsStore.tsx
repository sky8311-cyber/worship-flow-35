import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Sprout, 
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  Crown,
  Award,
  Wand2,
  FileDown,
  Check,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const itemIcons: Record<string, React.ReactNode> = {
  perk_template_pack_a: <Sparkles className="w-8 h-8" />,
  perk_premium_trial_7d: <Crown className="w-8 h-8" />,
  perk_badge_seed_planter: <Award className="w-8 h-8" />,
  perk_setlist_ai_suggestion_10x: <Wand2 className="w-8 h-8" />,
  perk_export_pack_pdf_ppt: <FileDown className="w-8 h-8" />,
};

const RewardsStore = () => {
  const { user } = useAuth();
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Fetch wallet
  const { data: wallet } = useQuery({
    queryKey: ['rewards-wallet', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data } = await supabase
        .from('rewards_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      return data || { balance: 0, status: 'active' };
    },
    enabled: !!user?.id
  });

  // Fetch store settings
  const { data: storeSettings } = useQuery({
    queryKey: ['rewards-store-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rewards_settings')
        .select('store_enabled')
        .eq('id', 1)
        .single();
      return data;
    }
  });

  // Fetch store items
  const { data: storeItems, isLoading } = useQuery({
    queryKey: ['rewards-store-items'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rewards_store_items')
        .select('*')
        .eq('enabled', true)
        .order('cost', { ascending: true });
      
      return data || [];
    }
  });

  // Fetch user's redemptions
  const { data: redemptions } = useQuery({
    queryKey: ['rewards-redemptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data } = await supabase
        .from('rewards_redemptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      
      return data || [];
    },
    enabled: !!user?.id
  });

  // Redeem mutation
  const redeemMutation = useMutation({
    mutationFn: async (item: any) => {
      const idempotency_key = `redeem_${user!.id}_${item.code}_${Date.now()}`;
      
      const { data, error } = await supabase.functions.invoke('rewards-debit', {
        body: {
          user_id: user!.id,
          item_code: item.code,
          idempotency_key,
          meta: {}
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Redemption failed');
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rewards-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['rewards-redemptions'] });
      queryClient.invalidateQueries({ queryKey: ['rewards-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['rewards-daily-totals'] });
      
      toast.success(
        language === 'ko' 
          ? `${selectedItem?.name_ko || selectedItem?.name} 교환 완료!` 
          : `${selectedItem?.name} redeemed successfully!`
      );
      setConfirmOpen(false);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || (language === 'ko' ? '교환 실패' : 'Redemption failed'));
    }
  });

  const handleRedeem = (item: any) => {
    setSelectedItem(item);
    setConfirmOpen(true);
  };

  const confirmRedeem = () => {
    if (selectedItem) {
      redeemMutation.mutate(selectedItem);
    }
  };

  const getItemRedemptionCount = (itemCode: string) => {
    return redemptions?.filter(r => r.item_code === itemCode).length || 0;
  };

  const balance = wallet?.balance || 0;

  if (!user) return null;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link to="/rewards" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            {language === 'ko' ? '리워드로 돌아가기' : 'Back to Rewards'}
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-primary" />
                {language === 'ko' ? 'K-Seed 스토어' : 'K-Seed Store'}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {language === 'ko' 
                  ? 'K-Seed로 특별한 보상을 교환하세요'
                  : 'Redeem your K-Seeds for special rewards'}
              </p>
            </div>
            
            {/* Balance Badge */}
            <div className="bg-primary/10 px-4 py-2 rounded-lg">
              <p className="text-xs text-muted-foreground">
                {language === 'ko' ? '보유 잔액' : 'Your Balance'}
              </p>
              <p className="text-xl font-bold text-primary flex items-center gap-1">
                🌱 {balance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Store Disabled Message */}
        {storeSettings?.store_enabled === false ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {language === 'ko' ? '스토어가 일시 중지되었습니다' : 'Store is temporarily closed'}
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : storeItems && storeItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {storeItems.map((item: any) => {
              const canAfford = balance >= item.cost;
              const isFrozen = wallet?.status === 'frozen';
              const redemptionCount = getItemRedemptionCount(item.code);
              
              return (
                <Card 
                  key={item.code} 
                  className={`relative overflow-hidden transition-all ${
                    canAfford && !isFrozen
                      ? 'hover:shadow-md hover:border-primary/30 cursor-pointer' 
                      : 'opacity-70'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary">
                        {itemIcons[item.code] || <Sprout className="w-8 h-8" />}
                      </div>
                      <Badge variant="secondary" className="font-bold text-lg">
                        🌱 {item.cost}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-3">
                      {language === 'ko' ? item.name_ko || item.name : item.name}
                    </CardTitle>
                    <CardDescription>
                      {language === 'ko' ? item.description_ko || item.description : item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      {redemptionCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Check className="w-3 h-3 text-green-500" />
                          {language === 'ko' 
                            ? `${redemptionCount}회 교환됨` 
                            : `Redeemed ${redemptionCount}x`}
                        </div>
                      )}
                      <div className="flex-1" />
                      <Button
                        onClick={() => handleRedeem(item)}
                        disabled={!canAfford || isFrozen || redeemMutation.isPending}
                        size="sm"
                      >
                        {!canAfford 
                          ? (language === 'ko' ? '잔액 부족' : 'Not enough') 
                          : (language === 'ko' ? '교환하기' : 'Redeem')}
                      </Button>
                    </div>
                    
                    {item.stock !== null && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {language === 'ko' 
                          ? `남은 수량: ${item.stock}` 
                          : `Stock: ${item.stock} remaining`}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {language === 'ko' ? '스토어가 준비 중입니다' : 'Store is coming soon'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Banner */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground text-center">
              {language === 'ko' 
                ? '⚠️ 교환된 보상은 환불되지 않습니다. 신중하게 선택해 주세요.'
                : '⚠️ Redeemed rewards cannot be refunded. Please choose carefully.'}
            </p>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'ko' ? '교환 확인' : 'Confirm Redemption'}
              </DialogTitle>
              <DialogDescription>
                {language === 'ko' 
                  ? `${selectedItem?.name_ko || selectedItem?.name}을(를) ${selectedItem?.cost} K-Seed로 교환하시겠습니까?`
                  : `Redeem ${selectedItem?.name} for ${selectedItem?.cost} K-Seeds?`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {language === 'ko' ? '현재 잔액' : 'Current balance'}
                </span>
                <span className="font-medium">🌱 {balance.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">
                  {language === 'ko' ? '교환 비용' : 'Redemption cost'}
                </span>
                <span className="font-medium text-orange-600">-🌱 {selectedItem?.cost}</span>
              </div>
              <div className="border-t mt-2 pt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {language === 'ko' ? '교환 후 잔액' : 'After redemption'}
                </span>
                <span className="font-bold text-primary">
                  🌱 {(balance - (selectedItem?.cost || 0)).toLocaleString()}
                </span>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                {language === 'ko' ? '취소' : 'Cancel'}
              </Button>
              <Button 
                onClick={confirmRedeem} 
                disabled={redeemMutation.isPending}
              >
                {redeemMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {language === 'ko' ? '교환하기' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default RewardsStore;
