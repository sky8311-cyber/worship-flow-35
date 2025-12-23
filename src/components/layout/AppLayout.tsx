import { ReactNode, useState } from "react";
import { AppHeader } from "./AppHeader";
import { BottomTabNavigation } from "./BottomTabNavigation";
import { FloatingChatButton } from "@/components/chat/FloatingChatButton";
import { FloatingChatBox } from "@/components/chat/FloatingChatBox";

interface AppLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  backPath?: string;
  breadcrumb?: React.ReactNode;
}

export const AppLayout = ({ children, showBackButton, backPath, breadcrumb }: AppLayoutProps) => {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-soft">
      <AppHeader showBackButton={showBackButton} backPath={backPath} breadcrumb={breadcrumb} />
      
      {/* Main content with bottom padding for mobile nav + safe area */}
      <main 
        className="pb-36 lg:pb-8"
        style={{ paddingBottom: 'max(9rem, calc(6rem + env(safe-area-inset-bottom, 0px)))' }}
      >
        {children}
      </main>
      
      <BottomTabNavigation />
      
      {/* Desktop floating chat */}
      <FloatingChatButton 
        onClick={() => setChatOpen(!chatOpen)} 
        isOpen={chatOpen} 
      />
      <FloatingChatBox 
        isOpen={chatOpen} 
        onClose={() => setChatOpen(false)} 
      />
    </div>
  );
};
