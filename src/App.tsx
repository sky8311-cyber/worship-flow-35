import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SongCartProvider } from "@/contexts/SongCartContext";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { AdminRoute } from "@/components/AdminRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { FullScreenLoader } from "@/components/layout/FullScreenLoader";
import { LegalConsentModal } from "@/components/legal/LegalConsentModal";
import { CommunicationConsentModal } from "@/components/legal/CommunicationConsentModal";
import { useLegalConsent } from "@/hooks/useLegalConsent";
import { GlobalMusicPlayer } from "@/components/music-player/GlobalMusicPlayer";
import { PageAnalyticsProvider } from "@/components/analytics/PageAnalyticsProvider";
import { GlobalRsvpPrompt } from "@/components/global/GlobalRsvpPrompt";
// Critical path - keep synchronous for fast initial load
import MobileAppLanding from "./pages/MobileAppLanding";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import NotFound from "./pages/NotFound";
// Lazy load all other pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SongLibrary = lazy(() => import("./pages/SongLibrary"));
const SetBuilder = lazy(() => import("./pages/SetBuilder"));
const BandView = lazy(() => import("./pages/BandView"));
const WorshipSets = lazy(() => import("./pages/WorshipSets"));
const CommunityManagement = lazy(() => import("./pages/CommunityManagement"));
const CommunitySearch = lazy(() => import("./pages/CommunitySearch"));
const Settings = lazy(() => import("./pages/Settings"));
const Help = lazy(() => import("./pages/Help"));
const ChurchAccount = lazy(() => import("./pages/ChurchAccount"));
const Membership = lazy(() => import("./pages/Membership"));
const TemplateManager = lazy(() => import("./pages/TemplateManager"));
// FavoritesList removed - now uses /songs?filter=favorites
const SeedHistory = lazy(() => import("./pages/SeedHistory"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Referral = lazy(() => import("./pages/Referral"));
const ReferralRedirect = lazy(() => import("./pages/ReferralRedirect"));
const RewardsStore = lazy(() => import("./pages/RewardsStore"));
const RequestWorshipLeader = lazy(() => import("./pages/RequestWorshipLeader"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const Legal = lazy(() => import("./pages/Legal"));
const AppHistory = lazy(() => import("./pages/AppHistory"));
const Features = lazy(() => import("./pages/Features"));
const Press = lazy(() => import("./pages/Press"));
const News = lazy(() => import("./pages/News"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const KWorshipInfo = lazy(() => import("./pages/KWorshipInfo"));

// Admin pages - lazy loaded (only admins use these)
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminCommunities = lazy(() => import("./pages/AdminCommunities"));
const AdminChurchAccounts = lazy(() => import("./pages/AdminChurchAccounts"));
const AdminWorshipLeaderApplications = lazy(() => import("./pages/AdminWorshipLeaderApplications"));
const AdminCRM = lazy(() => import("./pages/AdminCRM"));
const AdminRewards = lazy(() => import("./pages/AdminRewards"));
const AdminEmail = lazy(() => import("./pages/AdminEmail"));
const AdminFeatures = lazy(() => import("./pages/AdminFeatures"));
const AdminHistory = lazy(() => import("./pages/AdminHistory"));
const AdminTierGuide = lazy(() => import("./pages/AdminTierGuide"));
const AdminSupport = lazy(() => import("./pages/AdminSupport"));
const AdminTopics = lazy(() => import("./pages/AdminTopics"));
const AdminSongEnrichment = lazy(() => import("./pages/AdminSongEnrichment"));
const AdminStudio = lazy(() => import("./pages/AdminStudio"));
const AdminNews = lazy(() => import("./pages/AdminNews"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminMembershipProducts = lazy(() => import("./pages/AdminMembershipProducts"));

// Public/invitation pages
const PublicBandView = lazy(() => import("./pages/PublicBandView"));
const PublicLinkProxy = lazy(() => import("./pages/PublicLinkProxy"));
const Landing = lazy(() => import("./pages/Landing"));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));
const InvitedSignUp = lazy(() => import("./pages/InvitedSignUp"));
const JoinCommunity = lazy(() => import("./pages/JoinCommunity"));
const WorshipStudio = lazy(() => import("./pages/WorshipStudio"));
const EmailPreferencesPage = lazy(() => import("./pages/EmailPreferences"));

// Page loader component for Suspense fallback
const PageLoader = () => <FullScreenLoader />;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 1000, // 10 seconds default (conservative)
      gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
      refetchOnWindowFocus: true, // Keep true for collaboration features
      retry: 1, // Reduce from default 3
    },
  },
});

// Legal Consent Gate - shows modal if user needs to accept updated terms
const LegalConsentGate = ({ children }: { children: React.ReactNode }) => {
  const { needsConsent, pendingDocuments, needsCommunicationConsentOnly, isLoading, refetch } = useLegalConsent();
  const { session } = useAuth();
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  // 세션이 없으면 모달 표시 안 함 (ProtectedRoute가 처리)
  const hasSession = !!session;
  
  // Separate documents for different modals
  const termsAndPrivacyDocs = pendingDocuments.filter(d => d.type === "terms" || d.type === "privacy");
  const communicationsDoc = pendingDocuments.find(d => d.type === "communications") || null;
  
  // Show full legal modal if terms/privacy need consent
  const showFullLegalModal = hasSession && termsAndPrivacyDocs.length > 0;
  
  // Show communication-only modal if only communications needs consent
  const showCommunicationModal = hasSession && needsCommunicationConsentOnly && communicationsDoc;
  
  return (
    <>
      {children}
      <LegalConsentModal
        open={showFullLegalModal}
        pendingDocuments={pendingDocuments}
        onConsentComplete={() => refetch()}
      />
      <CommunicationConsentModal
        open={!!showCommunicationModal}
        communicationsDoc={communicationsDoc}
        onConsentComplete={() => refetch()}
      />
    </>
  );
};

// ProtectedRoute component - must be used inside AuthProvider
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isFullyLoaded } = useAuth();
  
  // Wait for initial auth check
  if (loading) {
    return <PageLoader />;
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Wait for profile and roles to be fully loaded before showing protected content
  // This prevents showing stale data from previous user
  if (!isFullyLoaded) {
    return <PageLoader />;
  }
  
  return (
    <LegalConsentGate>
      <GlobalRsvpPrompt />
      {children}
    </LegalConsentGate>
  );
};

const App = () => {
  return (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <MusicPlayerProvider>
          <SongCartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
            <ScrollToTop />
            <PageAnalyticsProvider />
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Landing Pages */}
              <Route path="/" element={<MobileAppLanding />} />
              <Route path="/app" element={<Landing />} />
              
              {/* Auth Routes */}
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/r/:referralCode" element={<ReferralRedirect />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/app-history" element={<AppHistory />} />
              <Route path="/features" element={<Features />} />
              <Route path="/press" element={<Press />} />
              <Route path="/news" element={<News />} />
              <Route path="/news/:slug" element={<NewsDetail />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/songs" element={<ProtectedRoute><SongLibrary /></ProtectedRoute>} />
              <Route path="/favorites" element={<Navigate to="/songs?filter=favorites" replace />} />
              <Route path="/worship-sets" element={<ProtectedRoute><WorshipSets /></ProtectedRoute>} />
              <Route path="/set-builder" element={<ProtectedRoute><SetBuilder /></ProtectedRoute>} />
              <Route path="/set-builder/:id" element={<ProtectedRoute><SetBuilder /></ProtectedRoute>} />
              <Route path="/request-worship-leader" element={<ProtectedRoute><RequestWorshipLeader /></ProtectedRoute>} />
              <Route path="/templates" element={<ProtectedRoute><TemplateManager /></ProtectedRoute>} />
              <Route path="/seeds" element={<ProtectedRoute><SeedHistory /></ProtectedRoute>} />
              <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
              <Route path="/rewards/store" element={<ProtectedRoute><RewardsStore /></ProtectedRoute>} />
              <Route path="/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
              <Route path="/kworship-info" element={<ProtectedRoute><KWorshipInfo /></ProtectedRoute>} />
              <Route path="/church-account" element={<ProtectedRoute><ChurchAccount /></ProtectedRoute>} />
              <Route path="/membership" element={<ProtectedRoute><Membership /></ProtectedRoute>} />
              <Route path="/community/search" element={<ProtectedRoute><CommunitySearch /></ProtectedRoute>} />
              <Route path="/community/:id" element={<ProtectedRoute><CommunityManagement /></ProtectedRoute>} />
              <Route path="/join/:token" element={<ProtectedRoute><JoinCommunity /></ProtectedRoute>} />
              <Route path="/rooms" element={<ProtectedRoute><WorshipStudio /></ProtectedRoute>} />
              <Route path="/rooms/:roomId" element={<ProtectedRoute><WorshipStudio /></ProtectedRoute>} />
              <Route path="/studio" element={<ProtectedRoute><WorshipStudio /></ProtectedRoute>} />
              <Route path="/studio/:roomId" element={<ProtectedRoute><WorshipStudio /></ProtectedRoute>} />
              <Route path="/invite/:invitationId" element={<InvitedSignUp />} /> {/* Public - dedicated signup for invited users */}
              <Route path="/accept-invitation/:invitationId" element={<ProtectedRoute><AcceptInvitation /></ProtectedRoute>} />
              <Route path="/band-view/:id" element={<BandView />} /> {/* Protected for team members */}
              <Route path="/public-view/:token" element={<PublicBandView />} /> {/* Public share link */}
              <Route path="/link/:token" element={<PublicLinkProxy />} /> {/* Short public link with OG tags */}
              <Route path="/email-preferences" element={<EmailPreferencesPage />} /> {/* Token-based email unsubscribe */}
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/communities" element={<AdminRoute><AdminCommunities /></AdminRoute>} />
              <Route path="/admin/church-accounts" element={<AdminRoute><AdminChurchAccounts /></AdminRoute>} />
              <Route path="/admin/applications" element={<AdminRoute><AdminWorshipLeaderApplications /></AdminRoute>} />
              <Route path="/admin/crm" element={<AdminRoute><AdminCRM /></AdminRoute>} />
              <Route path="/admin/rewards" element={<AdminRoute><AdminRewards /></AdminRoute>} />
              <Route path="/admin/email" element={<AdminRoute><AdminEmail /></AdminRoute>} />
              <Route path="/admin/features" element={<AdminRoute><AdminFeatures /></AdminRoute>} />
              <Route path="/admin/history" element={<AdminRoute><AdminHistory /></AdminRoute>} />
              <Route path="/admin/tier-guide" element={<AdminRoute><AdminTierGuide /></AdminRoute>} />
              <Route path="/admin/support" element={<AdminRoute><AdminSupport /></AdminRoute>} />
              <Route path="/admin/topics" element={<AdminRoute><AdminTopics /></AdminRoute>} />
              <Route path="/admin/song-enrichment" element={<AdminRoute><AdminSongEnrichment /></AdminRoute>} />
              <Route path="/admin/studio" element={<AdminRoute><AdminStudio /></AdminRoute>} />
              <Route path="/admin/news" element={<AdminRoute><AdminNews /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              <Route path="/admin/membership-products" element={<AdminRoute><AdminMembershipProducts /></AdminRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
              <GlobalMusicPlayer />
              </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </SongCartProvider>
        </MusicPlayerProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
  </HelmetProvider>
  );
};

export default App;
