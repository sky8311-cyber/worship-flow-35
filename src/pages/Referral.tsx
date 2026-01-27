import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Share2, Mail, Gift, Users, Coins, Send, Clock, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";
import { format } from "date-fns";

const Referral = () => {
  const { profile } = useAuth();
  const { language } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch referral code
  const { data: referralCode } = useQuery({
    queryKey: ["my-referral-code", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", profile.id)
        .single();
      return data?.referral_code;
    },
    enabled: !!profile?.id,
  });

  // Fetch referral stats
  const { data: stats } = useQuery({
    queryKey: ["referral-stats", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return { invitedCount: 0, joinedCount: 0, totalSeeds: 0 };

      // Get all invites sent
      const { count: invitedCount } = await supabase
        .from("referral_invites")
        .select("*", { count: "exact", head: true })
        .eq("inviter_id", profile.id);

      // Get successful referrals
      const { data: referrals } = await supabase
        .from("referrals")
        .select("reward_amount, reward_issued")
        .eq("referrer_id", profile.id);

      const joinedCount = referrals?.length || 0;
      const totalSeeds = referrals
        ?.filter(r => r.reward_issued)
        .reduce((sum, r) => sum + (r.reward_amount || 0), 0) || 0;

      return { invitedCount: invitedCount || 0, joinedCount, totalSeeds };
    },
    enabled: !!profile?.id,
  });

  // Fetch invite history
  const { data: inviteHistory } = useQuery({
    queryKey: ["referral-invites", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from("referral_invites")
        .select("*")
        .eq("inviter_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Fetch successful referrals
  const { data: referralHistory } = useQuery({
    queryKey: ["successful-referrals", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from("referrals")
        .select(`
          *,
          referred:profiles!referrals_referred_id_fkey(full_name, avatar_url)
        `)
        .eq("referrer_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const referralLink = referralCode ? `https://kworship.app/r/${referralCode}` : "";

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success(language === "ko" ? "링크가 복사되었습니다" : "Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(language === "ko" ? "복사 실패" : "Failed to copy");
    }
  };

  const handleNativeShare = async () => {
    if (!referralLink || !navigator.share) return;
    try {
      await navigator.share({
        title: "K-Worship",
        text: language === "ko" 
          ? "K-Worship에서 함께 예배를 준비해요!" 
          : "Join me on K-Worship!",
        url: referralLink,
      });
    } catch (error) {
      console.log("Share cancelled:", error);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !referralCode) return;
    
    setSending(true);
    try {
      const response = await supabase.functions.invoke("send-referral-invite", {
        body: {
          email: inviteEmail,
          inviterName: profile?.full_name || "A K-Worship user",
          referralCode,
          language,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success(language === "ko" ? "초대가 발송되었습니다!" : "Invitation sent!");
      setInviteEmail("");
    } catch (error: any) {
      toast.error(error.message || (language === "ko" ? "발송 실패" : "Failed to send"));
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "joined":
        return <Badge variant="default" className="bg-green-500">{language === "ko" ? "가입완료" : "Joined"}</Badge>;
      case "sent":
        return <Badge variant="secondary">{language === "ko" ? "발송됨" : "Sent"}</Badge>;
      default:
        return <Badge variant="outline">{language === "ko" ? "대기중" : "Pending"}</Badge>;
    }
  };

  const breadcrumb = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard"><Home className="h-4 w-4" /></Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{language === "ko" ? "친구 초대" : "Invite Friends"}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <AppLayout breadcrumb={breadcrumb}>
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">
            {language === "ko" ? "친구 초대하기" : "Invite Friends"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ko" 
              ? "친구를 초대하고 K-Seed를 받으세요!" 
              : "Invite friends and earn K-Seeds!"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Send className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats?.invitedCount || 0}</p>
              <p className="text-xs text-muted-foreground">
                {language === "ko" ? "초대 발송" : "Sent"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats?.joinedCount || 0}</p>
              <p className="text-xs text-muted-foreground">
                {language === "ko" ? "가입 완료" : "Joined"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Coins className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">{stats?.totalSeeds || 0}</p>
              <p className="text-xs text-muted-foreground">
                {language === "ko" ? "획득 K-Seed" : "K-Seeds"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link Card */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "ko" ? "내 초대 링크" : "My Referral Link"}</CardTitle>
            <CardDescription>
              {language === "ko" 
                ? "이 링크를 공유하면 친구가 가입할 때 K-Seed를 받습니다" 
                : "Share this link and earn K-Seeds when friends join"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Link + Copy */}
            <div className="flex gap-2">
              <Input 
                value={referralLink} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            {/* Referral Code */}
            <div className="text-center py-4 border rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">
                {language === "ko" ? "내 추천 코드" : "My Referral Code"}
              </p>
              <p className="font-mono text-2xl font-bold tracking-widest text-primary">
                {referralCode || "---"}
              </p>
            </div>

            {/* Share Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                {language === "ko" ? "링크 복사" : "Copy Link"}
              </Button>
              {typeof navigator !== "undefined" && navigator.share && (
                <Button variant="outline" className="flex-1" onClick={handleNativeShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  {language === "ko" ? "공유하기" : "Share"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Email Invite Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {language === "ko" ? "이메일로 초대하기" : "Invite by Email"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder={language === "ko" ? "친구 이메일 주소" : "Friend's email address"}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Button onClick={handleSendInvite} disabled={!inviteEmail || sending}>
                {sending 
                  ? (language === "ko" ? "발송중..." : "Sending...") 
                  : (language === "ko" ? "초대 발송" : "Send Invite")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "ko" ? "초대 기록" : "Invite History"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="invites">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="invites">
                  {language === "ko" ? "발송 목록" : "Sent Invites"}
                </TabsTrigger>
                <TabsTrigger value="joined">
                  {language === "ko" ? "가입 완료" : "Joined Users"}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="invites" className="mt-4">
                {inviteHistory && inviteHistory.length > 0 ? (
                  <div className="space-y-2">
                    {inviteHistory.map((invite: any) => (
                      <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{invite.email}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(invite.created_at), "yyyy.MM.dd")}
                          </p>
                        </div>
                        {getStatusBadge(invite.status)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {language === "ko" ? "아직 발송한 초대가 없습니다" : "No invites sent yet"}
                  </p>
                )}
              </TabsContent>
              
              <TabsContent value="joined" className="mt-4">
                {referralHistory && referralHistory.length > 0 ? (
                  <div className="space-y-2">
                    {referralHistory.map((ref: any) => (
                      <div key={ref.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{ref.referred?.full_name || "User"}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(ref.created_at), "yyyy.MM.dd")} · {ref.source === "email" ? "Email" : "Link"}
                            </p>
                          </div>
                        </div>
                        {ref.reward_issued && (
                          <Badge variant="default" className="bg-primary">
                            +{ref.reward_amount} K-Seed
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {language === "ko" ? "아직 가입한 친구가 없습니다" : "No friends have joined yet"}
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Referral;
