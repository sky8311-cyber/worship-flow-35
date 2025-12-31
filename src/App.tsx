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
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import SongLibrary from "./pages/SongLibrary";
import SetBuilder from "./pages/SetBuilder";
import BandView from "./pages/BandView";
import NotFound from "./pages/NotFound";
import SignUp from "./pages/auth/SignUp";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminCommunities from "./pages/AdminCommunities";
import AdminChurchAccounts from "./pages/AdminChurchAccounts";
import AdminWorshipLeaderApplications from "./pages/AdminWorshipLeaderApplications";
import AdminCRM from "./pages/AdminCRM";
import CommunitySearch from "./pages/CommunitySearch";
import CommunityManagement from "./pages/CommunityManagement";
import AcceptInvitation from "./pages/AcceptInvitation";
import InvitedSignUp from "./pages/InvitedSignUp";
import JoinCommunity from "./pages/JoinCommunity";
import FavoritesList from "./pages/FavoritesList";
import WorshipSets from "./pages/WorshipSets";
import RequestWorshipLeader from "./pages/RequestWorshipLeader";
import TemplateManager from "./pages/TemplateManager";
import ChurchAccount from "./pages/ChurchAccount";
import SeedHistory from "./pages/SeedHistory";
import PublicBandView from "./pages/PublicBandView";
import Settings from "./pages/Settings";
import MobileAppLanding from "./pages/MobileAppLanding";
import Help from "./pages/Help";

const queryClient = new QueryClient();

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
              <Route path="/favorites" element={<ProtectedRoute><FavoritesList /></ProtectedRoute>} />
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
            </BrowserRouter>
          </TooltipProvider>
        </SongCartProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
  );
};

export default App;
