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
import { useLegalConsent } from "@/hooks/useLegalConsent";
import { GlobalMusicPlayer } from "@/components/music-player/GlobalMusicPlayer";
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

// Public/invitation pages
const PublicBandView = lazy(() => import("./pages/PublicBandView"));
const PublicLinkProxy = lazy(() => import("./pages/PublicLinkProxy"));
const Landing = lazy(() => import("./pages/Landing"));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));
const InvitedSignUp = lazy(() => import("./pages/InvitedSignUp"));
const JoinCommunity = lazy(() => import("./pages/JoinCommunity"));
const WorshipRooms = lazy(() => import("./pages/WorshipRooms"));

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
  const { needsConsent, pendingDocuments, isLoading, refetch } = useLegalConsent();
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  return (
    <>
      {children}
      <LegalConsentModal
        open={needsConsent}
        pendingDocuments={pendingDocuments}
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
  
  return <LegalConsentGate>{children}</LegalConsentGate>;
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
              <Route path="/church-account" element={<ProtectedRoute><ChurchAccount /></ProtectedRoute>} />
              <Route path="/community/search" element={<ProtectedRoute><CommunitySearch /></ProtectedRoute>} />
              <Route path="/community/:id" element={<ProtectedRoute><CommunityManagement /></ProtectedRoute>} />
              <Route path="/join/:token" element={<ProtectedRoute><JoinCommunity /></ProtectedRoute>} />
              <Route path="/rooms" element={<ProtectedRoute><WorshipRooms /></ProtectedRoute>} />
              <Route path="/rooms/:roomId" element={<ProtectedRoute><WorshipRooms /></ProtectedRoute>} />
              <Route path="/invite/:invitationId" element={<InvitedSignUp />} /> {/* Public - dedicated signup for invited users */}
              <Route path="/accept-invitation/:invitationId" element={<ProtectedRoute><AcceptInvitation /></ProtectedRoute>} />
              <Route path="/band-view/:id" element={<BandView />} /> {/* Protected for team members */}
              <Route path="/public-view/:token" element={<PublicBandView />} /> {/* Public share link */}
              <Route path="/link/:token" element={<PublicLinkProxy />} /> {/* Short public link with OG tags */}
              
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
