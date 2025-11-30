import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
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
import AdminWorshipLeaderApplications from "./pages/AdminWorshipLeaderApplications";
import CommunitySearch from "./pages/CommunitySearch";
import CommunityManagement from "./pages/CommunityManagement";
import AcceptInvitation from "./pages/AcceptInvitation";
import JoinCommunity from "./pages/JoinCommunity";
import FavoritesList from "./pages/FavoritesList";
import WorshipSets from "./pages/WorshipSets";
import RequestWorshipLeader from "./pages/RequestWorshipLeader";
import TemplateManager from "./pages/TemplateManager";

const queryClient = new QueryClient();

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public Landing Page */}
              <Route path="/" element={<Landing />} />
              
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
              <Route path="/community/search" element={<ProtectedRoute><CommunitySearch /></ProtectedRoute>} />
              <Route path="/community/:id" element={<ProtectedRoute><CommunityManagement /></ProtectedRoute>} />
              <Route path="/join/:token" element={<ProtectedRoute><JoinCommunity /></ProtectedRoute>} />
              <Route path="/accept-invitation/:invitationId" element={<ProtectedRoute><AcceptInvitation /></ProtectedRoute>} />
              <Route path="/band-view/:id" element={<BandView />} /> {/* Public for sharing */}
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/communities" element={<AdminRoute><AdminCommunities /></AdminRoute>} />
              <Route path="/admin/applications" element={<AdminRoute><AdminWorshipLeaderApplications /></AdminRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
