import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Sprout, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Gift, 
  ArrowUpRight, 
  ArrowDownLeft,
  Store,
  History
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const Rewards = () => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState("history");

  // Fetch wallet data
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['rewards-wallet', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Try to get existing wallet
      const { data, error } = await supabase
        .from('rewards_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching wallet:', error);
      }
      
      return data || { balance: 0, lifetime_earned: 0, lifetime_spent: 0, status: 'active' };
    },
    enabled: !!user?.id
  });

  // Fetch today's totals
  const { data: dailyTotals } = useQuery({
    queryKey: ['rewards-daily-totals', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('rewards_daily_user_totals')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();
      
      return data || { total_earned: 0, total_spent: 0 };
    },
    enabled: !!user?.id
  });

  // Fetch ledger entries
  const { data: ledgerEntries, isLoading: ledgerLoading } = useQuery({
    queryKey: ['rewards-ledger', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('rewards_ledger')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching ledger:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch rules for display
  const { data: rules } = useQuery({
    queryKey: ['rewards-rules'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rewards_rules')
        .select('*')
        .eq('enabled', true)
        .order('amount', { ascending: false });
      
      return data || [];
    }
  });

  const getReasonLabel = (code: string, entry?: any) => {
    const rule = rules?.find(r => r.code === code);
    if (rule) {
      return language === 'ko' ? rule.description_ko : rule.description;
    }
    // Fallback: use meta description if available
    if (entry?.meta?.description) {
      return entry.meta.description;
    }
    return code.replace(/_/g, ' ');
  };

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sprout className="w-6 h-6 text-primary" />
            K-Seed Rewards
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {language === 'ko' 
              ? 'K-Worship 활동으로 K-Seed를 모으고 보상을 받으세요'
              : 'Earn K-Seeds through your K-Worship activities and redeem rewards'}
          </p>
        </div>

        {/* Wallet Card */}
        <Card className="mb-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Balance */}
              <div className="text-center md:text-left">
                <p className="text-sm text-muted-foreground mb-1">
                  {language === 'ko' ? '현재 잔액' : 'Current Balance'}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="text-4xl">🌱</span>
                  <span className="text-4xl font-bold text-primary">
                    {walletLoading ? '...' : (wallet?.balance || 0).toLocaleString()}
                  </span>
                  <span className="text-lg text-muted-foreground">K-Seeds</span>
                </div>
                {wallet?.status === 'frozen' && (
                  <Badge variant="destructive" className="mt-2">
                    {language === 'ko' ? '동결됨' : 'Frozen'}
                  </Badge>
                )}
              </div>

              {/* Today's Stats */}
              <div className="flex gap-6 justify-center">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    {language === 'ko' ? '오늘 획득' : 'Earned Today'}
                  </p>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">+{dailyTotals?.total_earned || 0}</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    {language === 'ko' ? '오늘 사용' : 'Spent Today'}
                  </p>
                  <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                    <TrendingDown className="w-4 h-4" />
                    <span className="font-semibold">-{dailyTotals?.total_spent || 0}</span>
                  </div>
                </div>
              </div>

              {/* Store Button */}
              <Link to="/rewards/store">
                <Button className="w-full md:w-auto">
                  <Store className="w-4 h-4 mr-2" />
                  {language === 'ko' ? '보상 스토어' : 'Rewards Store'}
                </Button>
              </Link>
            </div>

            {/* Lifetime Stats */}
            <Separator className="my-4" />
            <div className="flex justify-center gap-8 text-sm text-muted-foreground">
              <div>
                <span>{language === 'ko' ? '총 획득: ' : 'Lifetime earned: '}</span>
                <span className="font-medium text-foreground">
                  {(wallet?.lifetime_earned || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span>{language === 'ko' ? '총 사용: ' : 'Lifetime spent: '}</span>
                <span className="font-medium text-foreground">
                  {(wallet?.lifetime_spent || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Banner */}
        <Card className="mb-6 bg-muted/50">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground text-center">
              {language === 'ko' 
                ? '💡 K-Seed는 K-Worship 내부 로열티 포인트입니다. 현금 가치가 없으며 양도할 수 없습니다.'
                : '💡 K-Seeds are K-Worship internal loyalty points. They have no cash value and are non-transferable.'}
            </p>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              {language === 'ko' ? '히스토리' : 'History'}
            </TabsTrigger>
            <TabsTrigger value="ways" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              {language === 'ko' ? '획득 방법' : 'Ways to Earn'}
            </TabsTrigger>
          </TabsList>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {language === 'ko' ? '최근 활동' : 'Recent Activity'}
                </CardTitle>
                <CardDescription>
                  {language === 'ko' ? '최근 50개의 거래 내역' : 'Last 50 transactions'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ledgerLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'ko' ? '로딩 중...' : 'Loading...'}
                  </div>
                ) : ledgerEntries && ledgerEntries.length > 0 ? (
                  <div className="space-y-3">
                    {ledgerEntries.map((entry: any) => (
                      <div 
                        key={entry.id} 
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            entry.direction === 'credit' 
                              ? 'bg-green-100 dark:bg-green-900/30' 
                              : 'bg-orange-100 dark:bg-orange-900/30'
                          }`}>
                            {entry.direction === 'credit' 
                              ? <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                              : <ArrowDownLeft className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            }
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {getReasonLabel(entry.reason_code, entry)}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(entry.created_at), 'MM/dd HH:mm')}
                            </p>
                          </div>
                        </div>
                        <div className={`font-semibold ${
                          entry.direction === 'credit' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          {entry.direction === 'credit' ? '+' : '-'}{entry.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sprout className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{language === 'ko' ? '아직 거래 내역이 없습니다' : 'No transactions yet'}</p>
                    <p className="text-sm mt-1">
                      {language === 'ko' 
                        ? 'K-Worship을 사용하여 K-Seed를 모아보세요!'
                        : 'Start using K-Worship to earn K-Seeds!'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ways to Earn Tab */}
          <TabsContent value="ways" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {language === 'ko' ? 'K-Seed 획득 방법' : 'Ways to Earn K-Seeds'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rules?.filter(r => !r.code.startsWith('admin_')).map((rule: any) => (
                    <div key={rule.code} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {language === 'ko' ? rule.description_ko : rule.description}
                        </p>
                        {rule.daily_cap_amount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {language === 'ko' 
                              ? `일일 최대: ${rule.daily_cap_amount}` 
                              : `Daily cap: ${rule.daily_cap_amount}`}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="font-semibold">
                        +{rule.amount} 🌱
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Rewards;
