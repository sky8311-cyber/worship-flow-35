import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  TrendingUp, 
  Sprout,
  Mail,
  Link,
  Crown,
  Loader2
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const AdminReferralStats = () => {
  const [timePeriod, setTimePeriod] = useState<'all' | 'month' | 'year'>('month');
  
  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    if (timePeriod === 'month') {
      return {
        start: startOfMonth(now).toISOString(),
        end: endOfMonth(now).toISOString()
      };
    } else if (timePeriod === 'year') {
      return {
        start: new Date(now.getFullYear(), 0, 1).toISOString(),
        end: new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString()
      };
    }
    return { start: null, end: null };
  };

  // Fetch overall referral stats
  const { data: overallStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-referral-stats', timePeriod],
    queryFn: async () => {
      const dateRange = getDateRange();
      
      // Total referrals
      let referralsQuery = supabase
        .from('referrals')
        .select('id, source, reward_amount, created_at', { count: 'exact' });
      
      if (dateRange.start && dateRange.end) {
        referralsQuery = referralsQuery
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }
      
      const { data: referrals, count: totalReferrals } = await referralsQuery;
      
      // Calculate stats
      const linkReferrals = referrals?.filter(r => r.source === 'link').length || 0;
      const emailReferrals = referrals?.filter(r => r.source === 'email').length || 0;
      const totalKSeedsIssued = referrals?.reduce((sum, r) => sum + (r.reward_amount || 0), 0) || 0;
      
      // Total pending invites
      let invitesQuery = supabase
        .from('referral_invites')
        .select('id', { count: 'exact' })
        .eq('status', 'sent');
      
      if (dateRange.start && dateRange.end) {
        invitesQuery = invitesQuery
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }
      
      const { count: pendingInvites } = await invitesQuery;
      
      return {
        totalReferrals: totalReferrals || 0,
        linkReferrals,
        emailReferrals,
        totalKSeedsIssued,
        pendingInvites: pendingInvites || 0
      };
    }
  });

  // Fetch top referrers
  const { data: topReferrers, isLoading: referrersLoading } = useQuery({
    queryKey: ['admin-top-referrers', timePeriod],
    queryFn: async () => {
      const dateRange = getDateRange();
      
      // Get all referrals with referrer info
      let query = supabase
        .from('referrals')
        .select(`
          referrer_id,
          reward_amount,
          created_at,
          profiles:referrer_id(email, full_name)
        `);
      
      if (dateRange.start && dateRange.end) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }
      
      const { data: referrals } = await query;
      
      if (!referrals) return [];
      
      // Group by referrer and count
      const referrerMap = new Map<string, {
        referrer_id: string;
        email: string;
        full_name: string | null;
        count: number;
        totalKSeeds: number;
      }>();
      
      referrals.forEach((ref: any) => {
        const existing = referrerMap.get(ref.referrer_id);
        if (existing) {
          existing.count += 1;
          existing.totalKSeeds += ref.reward_amount || 0;
        } else {
          referrerMap.set(ref.referrer_id, {
            referrer_id: ref.referrer_id,
            email: ref.profiles?.email || 'Unknown',
            full_name: ref.profiles?.full_name,
            count: 1,
            totalKSeeds: ref.reward_amount || 0
          });
        }
      });
      
      // Sort by count and take top 10
      return Array.from(referrerMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }
  });

  // Fetch recent referrals
  const { data: recentReferrals, isLoading: recentLoading } = useQuery({
    queryKey: ['admin-recent-referrals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('referrals')
        .select(`
          id,
          source,
          reward_amount,
          reward_issued,
          created_at,
          referrer:referrer_id(email, full_name),
          referred:referred_id(email, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
      return data || [];
    }
  });

  // Fetch monthly trend (last 6 months)
  const { data: monthlyTrend } = useQuery({
    queryKey: ['admin-referral-monthly-trend'],
    queryFn: async () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date).toISOString();
        const end = endOfMonth(date).toISOString();
        
        const { count } = await supabase
          .from('referrals')
          .select('id', { count: 'exact' })
          .gte('created_at', start)
          .lte('created_at', end);
        
        months.push({
          month: format(date, 'MMM yyyy'),
          count: count || 0
        });
      }
      return months;
    }
  });

  return (
    <div className="space-y-6">
      {/* Time Period Filter */}
      <div className="flex justify-end">
        <Select value={timePeriod} onValueChange={(v: 'all' | 'month' | 'year') => setTimePeriod(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Referrals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : overallStats?.totalReferrals || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Via Link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : overallStats?.linkReferrals || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Via Email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : overallStats?.emailReferrals || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Sprout className="w-4 h-4" />
              K-Seeds Issued
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `+${overallStats?.totalKSeedsIssued || 0}`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Pending Invites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : overallStats?.pendingInvites || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      {monthlyTrend && monthlyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Monthly Trend (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {monthlyTrend.map((m, i) => {
                const maxCount = Math.max(...monthlyTrend.map(t => t.count), 1);
                const height = (m.count / maxCount) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium">{m.count}</span>
                    <div 
                      className="w-full bg-primary/80 rounded-t"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="text-xs text-muted-foreground">{m.month.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              Top Referrers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referrersLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : topReferrers && topReferrers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Referrals</TableHead>
                    <TableHead className="text-right">K-Seeds</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topReferrers.map((referrer, index) => (
                    <TableRow key={referrer.referrer_id}>
                      <TableCell>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{referrer.full_name || 'Anonymous'}</span>
                          <span className="text-xs text-muted-foreground">{referrer.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{referrer.count}</TableCell>
                      <TableCell className="text-right text-green-600">+{referrer.totalKSeeds}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">No referrals yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Referrals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : recentReferrals && recentReferrals.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentReferrals.map((referral: any) => (
                  <div key={referral.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {referral.referred?.full_name || referral.referred?.email || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Referred by {referral.referrer?.full_name || referral.referrer?.email || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(referral.created_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={referral.source === 'email' ? 'secondary' : 'outline'}>
                        {referral.source === 'email' ? <Mail className="w-3 h-3 mr-1" /> : <Link className="w-3 h-3 mr-1" />}
                        {referral.source}
                      </Badge>
                      {referral.reward_issued && (
                        <span className="text-xs text-green-600">+{referral.reward_amount}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No referrals yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReferralStats;
