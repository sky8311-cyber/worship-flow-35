import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsMobile } from "@/hooks/use-mobile";
import { AppLayout } from "@/components/layout/AppLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomSidebar } from "@/components/worship-rooms/RoomSidebar";
import { RoomView } from "@/components/worship-rooms/RoomView";
import { useWorshipRoom } from "@/hooks/useWorshipRoom";

const WorshipRooms = () => {
  const { roomId } = useParams<{ roomId?: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"my-room" | "discover" | "ambassadors">("my-room");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  
  // Get user's own room
  const { room: myRoom, isLoading: myRoomLoading } = useWorshipRoom(user?.id);
  
  // If roomId is passed in URL, use that
  useEffect(() => {
    if (roomId) {
      setSelectedRoomId(roomId);
    } else if (myRoom?.id) {
      setSelectedRoomId(myRoom.id);
    }
  }, [roomId, myRoom?.id]);

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    if (isMobile) {
      setActiveTab("my-room");
    }
  };

  if (isMobile) {
    return (
      <AppLayout>
        <SEOHead 
          title={t("rooms.title")} 
          description={t("rooms.description")}
        />
        <div className="flex flex-col h-full">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-3 mx-4 mt-4">
              <TabsTrigger value="my-room">{t("rooms.myRoom")}</TabsTrigger>
              <TabsTrigger value="discover">{t("rooms.discover")}</TabsTrigger>
              <TabsTrigger value="ambassadors">{t("rooms.ambassadors")}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-room" className="flex-1 overflow-y-auto">
              {selectedRoomId && (
                <RoomView 
                  roomId={selectedRoomId} 
                  isOwnRoom={selectedRoomId === myRoom?.id}
                />
              )}
            </TabsContent>
            
            <TabsContent value="discover" className="flex-1 overflow-y-auto p-4">
              <RoomSidebar 
                onRoomSelect={handleRoomSelect}
                showAmbassadors={false}
                showPublicRooms={true}
              />
            </TabsContent>
            
            <TabsContent value="ambassadors" className="flex-1 overflow-y-auto p-4">
              <RoomSidebar 
                onRoomSelect={handleRoomSelect}
                showAmbassadors={true}
                showPublicRooms={false}
              />
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    );
  }

  // Desktop/Tablet layout
  return (
    <AppLayout>
      <SEOHead 
        title={t("rooms.title")} 
        description={t("rooms.description")}
      />
      <div className="flex h-full">
        {/* Left Sidebar */}
        <div className="w-80 border-r border-border bg-card/50 overflow-y-auto">
          <RoomSidebar 
            onRoomSelect={handleRoomSelect}
            selectedRoomId={selectedRoomId}
            showAmbassadors={true}
            showPublicRooms={true}
          />
        </div>
        
        {/* Main Panel */}
        <div className="flex-1 overflow-y-auto">
          {selectedRoomId ? (
            <RoomView 
              roomId={selectedRoomId}
              isOwnRoom={selectedRoomId === myRoom?.id}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {myRoomLoading ? t("common.loading") : t("rooms.selectRoom")}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default WorshipRooms;
