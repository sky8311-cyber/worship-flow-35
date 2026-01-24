import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading, isFullyLoaded } = useAuth();
  
  // 기본 인증 로딩 대기
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // 인증되지 않은 경우 로그인으로 리다이렉트
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // 프로필과 역할이 완전히 로드될 때까지 대기 (ProtectedRoute와 동일한 패턴)
  if (!isFullyLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // 역할 로딩 완료 후 admin 권한 확인
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};
