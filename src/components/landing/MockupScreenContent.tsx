import { Music, Users, Calendar, Home, MessageCircle, Search, Play, Pause, SkipBack, SkipForward, Heart, Share2, Library, ListMusic, Globe } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/kworship-logo-mobile.png";

// Worship Sets Screen (Home)
export const WorshipSetsScreen = () => (
  <div className="h-full flex flex-col">
    {/* Status bar */}
    <div className="h-8 bg-card/50 flex items-center justify-between px-6 pt-1 shrink-0">
      <span className="text-[10px] font-medium text-foreground/70">9:41</span>
      <div className="flex gap-1">
        <div className="w-3 h-2 border border-foreground/50 rounded-sm">
          <div className="w-2 h-1 bg-foreground/50 rounded-sm m-[1px]" />
        </div>
      </div>
    </div>
    
    {/* App Content */}
    <div className="p-3 space-y-2 flex-1">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <img src={logo} alt="K-Worship" className="h-5 w-auto" />
      </div>
      
      {/* Worship Set Cards */}
      <motion.div 
        className="bg-card p-2.5 rounded-xl border border-border/50 shadow-sm"
        animate={{ opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Music className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-foreground">주일예배</p>
            <p className="text-[9px] text-muted-foreground">3곡 · 1월 26일</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500" />
        </div>
      </motion.div>
      
      <div className="bg-card p-2.5 rounded-xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-foreground">수요예배</p>
            <p className="text-[9px] text-muted-foreground">2곡 · 1월 29일</p>
          </div>
        </div>
      </div>
      
      <div className="bg-card p-2.5 rounded-xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-foreground">청년예배</p>
            <p className="text-[9px] text-muted-foreground">4곡 · 2월 2일</p>
          </div>
        </div>
      </div>
    </div>
    
    {/* Bottom Navigation */}
    <div className="h-10 bg-card/80 backdrop-blur-sm border-t border-border/30 flex items-center justify-around px-3 shrink-0">
      <Home className="w-3 h-3 text-primary" />
      <Calendar className="w-3 h-3 text-muted-foreground" />
      <Music className="w-3 h-3 text-muted-foreground" />
      <Users className="w-3 h-3 text-muted-foreground" />
      <MessageCircle className="w-3 h-3 text-muted-foreground" />
    </div>
  </div>
);

// Worship Library Screen
export const SongLibraryScreen = () => (
  <div className="h-full flex flex-col">
    {/* Status bar */}
    <div className="h-8 bg-card/50 flex items-center justify-between px-6 pt-1 shrink-0">
      <span className="text-[10px] font-medium text-foreground/70">9:41</span>
      <div className="flex gap-1">
        <div className="w-3 h-2 border border-foreground/50 rounded-sm">
          <div className="w-2 h-1 bg-foreground/50 rounded-sm m-[1px]" />
        </div>
      </div>
    </div>
    
    {/* Content */}
    <div className="p-3 space-y-2 flex-1">
      {/* Search bar */}
      <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 mb-2">
        <Search className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">찬양 검색...</span>
      </div>
      
      {/* Genre tags */}
      <div className="flex gap-1.5 overflow-hidden mb-2">
        <span className="text-[8px] px-2 py-0.5 bg-primary/10 text-primary rounded-full whitespace-nowrap">CCM</span>
        <span className="text-[8px] px-2 py-0.5 bg-muted rounded-full whitespace-nowrap">English</span>
        <span className="text-[8px] px-2 py-0.5 bg-muted rounded-full whitespace-nowrap">찬송가</span>
        <span className="text-[8px] px-2 py-0.5 bg-muted rounded-full whitespace-nowrap">복음</span>
      </div>
      
      {/* Song list */}
      <div className="space-y-1.5">
        <motion.div 
          className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/50"
          animate={{ backgroundColor: ["hsl(var(--card))", "hsl(var(--primary) / 0.05)", "hsl(var(--card))"] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-7 h-7 rounded bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Music className="w-3 h-3 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium truncate">주 품에 품으소서</p>
            <p className="text-[8px] text-muted-foreground">마커스워십</p>
          </div>
          <Heart className="w-3 h-3 text-muted-foreground" />
        </motion.div>
        
        <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/50">
          <div className="w-7 h-7 rounded bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
            <Music className="w-3 h-3 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium truncate">나의 가는 길</p>
            <p className="text-[8px] text-muted-foreground">어노인팅</p>
          </div>
          <Heart className="w-3 h-3 text-red-500 fill-red-500" />
        </div>
        
        <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/50">
          <div className="w-7 h-7 rounded bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Music className="w-3 h-3 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium truncate">Oceans</p>
            <p className="text-[8px] text-muted-foreground">Hillsong United</p>
          </div>
          <Heart className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
    </div>
    
    {/* Bottom Navigation */}
    <div className="h-10 bg-card/80 backdrop-blur-sm border-t border-border/30 flex items-center justify-around px-3 shrink-0">
      <Home className="w-3 h-3 text-muted-foreground" />
      <Calendar className="w-3 h-3 text-muted-foreground" />
      <Library className="w-3 h-3 text-primary" />
      <Users className="w-3 h-3 text-muted-foreground" />
      <MessageCircle className="w-3 h-3 text-muted-foreground" />
    </div>
  </div>
);

// Music Player Screen
export const MusicPlayerScreen = () => (
  <div className="h-full flex flex-col bg-gradient-to-b from-primary/5 to-background">
    {/* Status bar */}
    <div className="h-8 flex items-center justify-between px-6 pt-1 shrink-0">
      <span className="text-[10px] font-medium text-foreground/70">9:41</span>
      <div className="flex gap-1">
        <div className="w-3 h-2 border border-foreground/50 rounded-sm">
          <div className="w-2 h-1 bg-foreground/50 rounded-sm m-[1px]" />
        </div>
      </div>
    </div>
    
    {/* Now Playing */}
    <div className="flex-1 flex flex-col items-center justify-center px-4 gap-3">
      {/* Album Art */}
      <motion.div 
        className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10 flex items-center justify-center shadow-lg"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Music className="w-10 h-10 text-primary/60" />
      </motion.div>
      
      {/* Song Info */}
      <div className="text-center space-y-0.5">
        <p className="text-[12px] font-semibold">주 품에 품으소서</p>
        <p className="text-[9px] text-muted-foreground">마커스워십</p>
      </div>
      
      {/* Progress bar */}
      <div className="w-full max-w-[140px] space-y-1">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary rounded-full"
            initial={{ width: "20%" }}
            animate={{ width: "60%" }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>
        <div className="flex justify-between text-[8px] text-muted-foreground">
          <span>1:32</span>
          <span>4:15</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-4">
        <SkipBack className="w-4 h-4 text-foreground/70" />
        <motion.div 
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg"
          whileTap={{ scale: 0.95 }}
        >
          <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
        </motion.div>
        <SkipForward className="w-4 h-4 text-foreground/70" />
      </div>
      
      {/* Extra controls */}
      <div className="flex items-center gap-6 mt-1">
        <Heart className="w-3 h-3 text-red-500 fill-red-500" />
        <ListMusic className="w-3 h-3 text-muted-foreground" />
        <Share2 className="w-3 h-3 text-muted-foreground" />
      </div>
    </div>
    
    {/* Mini lyrics */}
    <div className="px-4 pb-12">
      <div className="bg-card/50 rounded-lg p-2 text-center">
        <p className="text-[9px] text-muted-foreground italic">"주님의 품에 안기네..."</p>
      </div>
    </div>
  </div>
);

// Community Feed Screen
export const CommunityScreen = () => (
  <div className="h-full flex flex-col">
    {/* Status bar */}
    <div className="h-8 bg-card/50 flex items-center justify-between px-6 pt-1 shrink-0">
      <span className="text-[10px] font-medium text-foreground/70">9:41</span>
      <div className="flex gap-1">
        <div className="w-3 h-2 border border-foreground/50 rounded-sm">
          <div className="w-2 h-1 bg-foreground/50 rounded-sm m-[1px]" />
        </div>
      </div>
    </div>
    
    {/* Header */}
    <div className="px-3 py-2 border-b border-border/50 shrink-0">
      <p className="text-[11px] font-semibold">커뮤니티</p>
    </div>
    
    {/* Posts */}
    <div className="p-3 space-y-2 flex-1 overflow-hidden">
      <motion.div 
        className="bg-card p-2.5 rounded-xl border border-border/50"
        animate={{ opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent" />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-medium">김예배</p>
            <p className="text-[8px] text-muted-foreground line-clamp-2 mt-0.5">
              이번 주일 찬양 세트 공유합니다! 🙏
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1">
                <Heart className="w-2.5 h-2.5 text-red-500 fill-red-500" />
                <span className="text-[8px] text-muted-foreground">12</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-2.5 h-2.5 text-muted-foreground" />
                <span className="text-[8px] text-muted-foreground">3</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      <div className="bg-card p-2.5 rounded-xl border border-border/50">
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-medium">박찬양</p>
            <p className="text-[8px] text-muted-foreground line-clamp-2 mt-0.5">
              마커스 새 앨범 추천합니다 ✨
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1">
                <Heart className="w-2.5 h-2.5 text-muted-foreground" />
                <span className="text-[8px] text-muted-foreground">8</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-2.5 h-2.5 text-muted-foreground" />
                <span className="text-[8px] text-muted-foreground">5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Bottom Navigation */}
    <div className="h-10 bg-card/80 backdrop-blur-sm border-t border-border/30 flex items-center justify-around px-3 shrink-0">
      <Home className="w-3 h-3 text-muted-foreground" />
      <Calendar className="w-3 h-3 text-muted-foreground" />
      <Music className="w-3 h-3 text-muted-foreground" />
      <Users className="w-3 h-3 text-primary" />
      <MessageCircle className="w-3 h-3 text-muted-foreground" />
    </div>
  </div>
);

// Desktop Dashboard Screen
export const DesktopDashboardScreen = () => (
  <div className="h-full bg-background flex">
    {/* Sidebar */}
    <div className="w-12 bg-card border-r border-border/50 flex flex-col items-center py-2 gap-2 shrink-0">
      <img src={logo} alt="K-Worship" className="h-4 w-auto mb-2" />
      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
        <Home className="w-3 h-3 text-primary" />
      </div>
      <div className="w-6 h-6 rounded-lg hover:bg-muted flex items-center justify-center">
        <Calendar className="w-3 h-3 text-muted-foreground" />
      </div>
      <div className="w-6 h-6 rounded-lg hover:bg-muted flex items-center justify-center">
        <Music className="w-3 h-3 text-muted-foreground" />
      </div>
      <div className="w-6 h-6 rounded-lg hover:bg-muted flex items-center justify-center">
        <Users className="w-3 h-3 text-muted-foreground" />
      </div>
    </div>
    
    {/* Main content */}
    <div className="flex-1 p-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] font-semibold">대시보드</p>
        <div className="flex items-center gap-1 bg-muted/50 rounded px-1.5 py-0.5">
          <Search className="w-2 h-2 text-muted-foreground" />
          <span className="text-[7px] text-muted-foreground">검색...</span>
        </div>
      </div>
      
      {/* Content grid */}
      <div className="grid grid-cols-2 gap-1.5">
        <motion.div 
          className="bg-card p-1.5 rounded-lg border border-border/50"
          animate={{ opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="w-2.5 h-2.5 text-primary" />
            <span className="text-[7px] font-medium">이번 주</span>
          </div>
          <p className="text-[10px] font-bold">3</p>
          <p className="text-[6px] text-muted-foreground">예배 세트</p>
        </motion.div>
        
        <div className="bg-card p-1.5 rounded-lg border border-border/50">
          <div className="flex items-center gap-1 mb-1">
            <Music className="w-2.5 h-2.5 text-accent" />
            <span className="text-[7px] font-medium">라이브러리</span>
          </div>
          <p className="text-[10px] font-bold">156</p>
          <p className="text-[6px] text-muted-foreground">저장된 곡</p>
        </div>
        
        <div className="col-span-2 bg-card p-1.5 rounded-lg border border-border/50">
          <p className="text-[7px] font-medium mb-1">다가오는 예배</p>
          <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded">
            <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
              <Music className="w-2.5 h-2.5 text-primary" />
            </div>
            <div>
              <p className="text-[7px] font-medium">주일예배</p>
              <p className="text-[6px] text-muted-foreground">1월 26일</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const screens = [
  { 
    component: WorshipSetsScreen, 
    titleKo: "예배 세트를 한눈에", 
    titleEn: "Manage worship sets at a glance",
    subtitleKo: "다가오는 예배를 쉽게 관리하세요",
    subtitleEn: "Easily organize your upcoming services"
  },
  { 
    component: SongLibraryScreen, 
    titleKo: "10,000+ 찬양 라이브러리", 
    titleEn: "10,000+ song library",
    subtitleKo: "CCM, 영어찬양, 찬송가 모두",
    subtitleEn: "CCM, English worship, Hymns & more"
  },
  { 
    component: MusicPlayerScreen, 
    titleKo: "끊김 없는 음악 재생", 
    titleEn: "Seamless music playback",
    subtitleKo: "연습과 예배를 위한 완벽한 플레이어",
    subtitleEn: "Perfect player for practice & worship",
    highlighted: true
  },
  { 
    component: CommunityScreen, 
    titleKo: "다른 워십팀과 연결", 
    titleEn: "Connect with other worship teams",
    subtitleKo: "아이디어를 공유하고 함께 성장하세요",
    subtitleEn: "Share ideas and grow together"
  },
];
