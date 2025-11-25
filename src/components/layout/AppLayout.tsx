import { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { BottomTabNavigation } from "./BottomTabNavigation";

interface AppLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  backPath?: string;
  breadcrumb?: React.ReactNode;
}

export const AppLayout = ({ children, showBackButton, backPath, breadcrumb }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <AppHeader showBackButton={showBackButton} backPath={backPath} breadcrumb={breadcrumb} />
      
      {/* Main content with bottom padding for mobile nav */}
      <main className="pb-20 lg:pb-8">
        {children}
      </main>
      
      <BottomTabNavigation />
    </div>
  );
};
