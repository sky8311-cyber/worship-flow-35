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
      
      {/* Main content with bottom padding for mobile nav */}
      <main className="pb-28 lg:pb-8">
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
