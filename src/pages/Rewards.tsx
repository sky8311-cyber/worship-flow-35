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
import { Separator } from "@/components/ui/separator";
import { 
  Sprout, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Gift, 
  ArrowUpRight,
  Store,
  History,
  Users,
  MessageSquare,
  Music,
  Church,
  Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

// Reward categories for grouping
const REWARD_CATEGORIES = {
  referral: {
    icon: Users,
    label_ko: '🤝 Referral & Growth',
    label_en: '🤝 Referral & Growth',
    codes: ['invited_user_signed_up']
  },
  community: {
    icon: MessageSquare,
    label_ko: '💬 Community Activity',
    label_en: '💬 Community Activity',
    codes: ['first_community_post', 'community_posts_10_milestone', 'community_chat_active_bonus']
  },
  songs: {
    icon: Music,
    label_ko: '🎵 Song Library',
    label_en: '🎵 Song Library',
    codes: ['song_added_to_library', 'song_metadata_complete']
  },
  sets: {
    icon: Church,
    label_ko: '⛪ Worship Sets',
    label_en: '⛪ Worship Sets',
    codes: ['set_created', 'set_published']
  },
  consistency: {
    icon: Calendar,
    label_ko: '📅 Consistency',
    label_en: '📅 Consistency',
    codes: ['weekly_streak_bonus', 'daily_login']
  }
};

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

  // Fetch rewards settings (for store_enabled check)
  const { data: rewardsSettings } = useQuery({
    queryKey: ['rewards-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rewards_settings')
        .select('*')
        .single();
      return data;
    }
  });

  // Fetch ledger entries (only credit items now)
  const { data: ledgerEntries, isLoading: ledgerLoading } = useQuery({
    queryKey: ['rewards-ledger', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('rewards_ledger')
        .select('*')
        .eq('user_id', user.id)
        .eq('direction', 'credit') // Only show credit (earning) entries
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

  // Group rules by category
  const getRulesByCategory = () => {
    const categorizedRules: Record<string, any[]> = {};
    
    Object.entries(REWARD_CATEGORIES).forEach(([key, category]) => {
      const categoryRules = rules?.filter(r => 
        category.codes.includes(r.code) && !r.code.startsWith('admin_')
      ) || [];
      if (categoryRules.length > 0) {
        categorizedRules[key] = categoryRules;
      }
    });
    
    return categorizedRules;
  };

  if (!user) {
    return null;
  }

  const categorizedRules = getRulesByCategory();
  const isStoreEnabled = rewardsSettings?.store_enabled === true;

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

        {/* Kingdom Seed Narrative Banner */}
        <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-green-50 dark:from-yellow-900/20 dark:to-green-900/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="py-4">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                💡 K-Seed는 'Kingdom Seed (킹덤 씨드)'입니다.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                {language === 'ko' 
                  ? '하나님 나라를 위해 뿌려지는 작은 순종과 섬김의 씨앗처럼, 여러분의 참여와 나눔, 기록과 초대가 모여 교회 공동체가 다시 모이기에 힘쓰고 예배가 회복되는 힘이 되기를 소망합니다.'
                  : 'Every act of participation, service, and contribution is a seed sown for God\'s Kingdom. As these seeds gather, churches are strengthened to come together again in worship.'}
              </p>
              <p className="text-xs text-muted-foreground italic">
                {language === 'ko'
                  ? 'K-Seed는 경쟁을 위한 점수가 아니라 함께 세워가는 하나님 나라의 흔적입니다.'
                  : 'K-Seeds are not for competition, but a reflection of shared obedience and faithfulness.'}
              </p>
            </div>
          </CardContent>
        </Card>

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

              {/* Store Button - Conditional based on admin toggle */}
              {isStoreEnabled && (
                <Link to="/rewards/store">
                  <Button className="w-full md:w-auto">
                    <Store className="w-4 h-4 mr-2" />
                    {language === 'ko' ? '보상 스토어' : 'Rewards Store'}
                  </Button>
                </Link>
              )}
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
                  {language === 'ko' ? '최근 획득 내역' : 'Recent Earnings'}
                </CardTitle>
                <CardDescription>
                  {language === 'ko' ? '최근 50개의 K-Seed 획득 내역' : 'Last 50 K-Seed earnings'}
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
                          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                            <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
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
                        <div className="font-semibold text-green-600 dark:text-green-400">
                          +{entry.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sprout className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{language === 'ko' ? '아직 획득 내역이 없습니다' : 'No earnings yet'}</p>
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
          <TabsContent value="ways" className="mt-4 space-y-4">
            {Object.entries(REWARD_CATEGORIES).map(([key, category]) => {
              const categoryRules = categorizedRules[key];
              if (!categoryRules || categoryRules.length === 0) return null;
              
              const CategoryIcon = category.icon;
              
              return (
                <Card key={key}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      {language === 'ko' ? category.label_ko : category.label_en}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoryRules.map((rule: any) => (
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
                            {rule.cooldown_seconds > 0 && rule.cooldown_seconds >= 2592000 && (
                              <p className="text-xs text-muted-foreground">
                                {language === 'ko' ? '월 1회' : 'Once per month'}
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
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Rewards;
