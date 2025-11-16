import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import SongLibrary from "./pages/SongLibrary";
import SetBuilder from "./pages/SetBuilder";
import BandView from "./pages/BandView";
import NotFound from "./pages/NotFound";
import SignUpChoice from "./pages/auth/SignUpChoice";
import SignUp from "./pages/auth/SignUp";
import SignUpWorshipLeader from "./pages/auth/SignUpWorshipLeader";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

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
            <Routes>
              {/* Public Landing Page */}
              <Route path="/" element={<Landing />} />
              
              {/* Auth Routes */}
              <Route path="/signup-choice" element={<SignUpChoice />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signup-worship-leader" element={<SignUpWorshipLeader />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/songs" element={<ProtectedRoute><SongLibrary /></ProtectedRoute>} />
              <Route path="/set-builder" element={<ProtectedRoute><SetBuilder /></ProtectedRoute>} />
              <Route path="/set-builder/:id" element={<ProtectedRoute><SetBuilder /></ProtectedRoute>} />
              <Route path="/band-view/:id" element={<BandView />} /> {/* Public for sharing */}
              
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
