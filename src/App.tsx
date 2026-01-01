import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SongCartProvider } from "@/contexts/SongCartContext";
import { AdminRoute } from "@/components/AdminRoute";
import { ScrollToTop } from "@/components/ScrollToTop";

// Critical path - keep synchronous for fast initial load
import Landing from "./pages/Landing";
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
const RequestWorshipLeader = lazy(() => import("./pages/RequestWorshipLeader"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

// Admin pages - lazy loaded (only admins use these)
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminCommunities = lazy(() => import("./pages/AdminCommunities"));
const AdminChurchAccounts = lazy(() => import("./pages/AdminChurchAccounts"));
const AdminWorshipLeaderApplications = lazy(() => import("./pages/AdminWorshipLeaderApplications"));
const AdminCRM = lazy(() => import("./pages/AdminCRM"));

// Public/invitation pages
const PublicBandView = lazy(() => import("./pages/PublicBandView"));
const MobileAppLanding = lazy(() => import("./pages/MobileAppLanding"));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));
const InvitedSignUp = lazy(() => import("./pages/InvitedSignUp"));
const JoinCommunity = lazy(() => import("./pages/JoinCommunity"));

// Page loader component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

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

// ProtectedRoute component - must be used inside AuthProvider
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App = () => {
  return (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <SongCartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Landing Pages */}
              <Route path="/" element={<Landing />} />
              <Route path="/app" element={<MobileAppLanding />} />
              
              {/* Auth Routes */}
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
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
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
              <Route path="/church-account" element={<ProtectedRoute><ChurchAccount /></ProtectedRoute>} />
              <Route path="/community/search" element={<ProtectedRoute><CommunitySearch /></ProtectedRoute>} />
              <Route path="/community/:id" element={<ProtectedRoute><CommunityManagement /></ProtectedRoute>} />
              <Route path="/join/:token" element={<ProtectedRoute><JoinCommunity /></ProtectedRoute>} />
              <Route path="/invite/:invitationId" element={<InvitedSignUp />} /> {/* Public - dedicated signup for invited users */}
              <Route path="/accept-invitation/:invitationId" element={<ProtectedRoute><AcceptInvitation /></ProtectedRoute>} />
              <Route path="/band-view/:id" element={<BandView />} /> {/* Protected for team members */}
              <Route path="/public-view/:token" element={<PublicBandView />} /> {/* Public share link */}
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/communities" element={<AdminRoute><AdminCommunities /></AdminRoute>} />
              <Route path="/admin/church-accounts" element={<AdminRoute><AdminChurchAccounts /></AdminRoute>} />
              <Route path="/admin/applications" element={<AdminRoute><AdminWorshipLeaderApplications /></AdminRoute>} />
              <Route path="/admin/crm" element={<AdminRoute><AdminCRM /></AdminRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </SongCartProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
  );
};

export default App;
