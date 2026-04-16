import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";

export interface PlaylistItem {
  videoId: string;
  title: string;
  artist: string;
  position: number;
  lyrics?: string;
}

interface MusicPlayerState {
  playerState: 'closed' | 'full' | 'mini' | 'hidden';
  playlist: PlaylistItem[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  setTitle: string;
  setId: string;
}

interface MusicPlayerContextType extends MusicPlayerState {
  setPlayerState: (state: 'closed' | 'full' | 'mini' | 'hidden') => void;
  setCurrentIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  pendingPlayIntent: boolean;
  setPendingPlayIntent: (pending: boolean) => void;
  startPlaylist: (playlist: PlaylistItem[], setTitle: string, setId: string, startIndex?: number) => void;
  closePlayer: () => void;
  hidePlayer: () => void;
  showPlayer: () => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  sendCommand: (command: string, args?: any) => void;
  playerReady: boolean;
  setPlayerReady: (ready: boolean) => void;
}

const STORAGE_KEY = "k-worship-music-player";

const defaultState: MusicPlayerState = {
  playerState: 'closed',
  playlist: [],
  currentIndex: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  setTitle: "",
  setId: "",
};

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<MusicPlayerState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultState,
          ...parsed,
          isPlaying: false,
        };
      }
    } catch (e) {
      console.error('[MusicPlayerContext] Failed to restore state:', e);
    }
    return defaultState;
  });

  const [playerReady, setPlayerReady] = useState(false);
  const [pendingPlayIntent, setPendingPlayIntent] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Persist to localStorage on state changes (except when closed)
  useEffect(() => {
    if (state.playerState === 'closed') {
      localStorage.removeItem(STORAGE_KEY);
    } else if (state.playlist.length > 0) {
      const toSave = {
        playerState: state.playerState,
        playlist: state.playlist,
        currentIndex: state.currentIndex,
        currentTime: state.currentTime,
        setTitle: state.setTitle,
        setId: state.setId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [state.playerState, state.playlist, state.currentIndex, state.currentTime, state.setTitle, state.setId]);

  // Cleanup when player is closed
  useEffect(() => {
    if (state.playerState === 'closed') {
      const timer = setTimeout(() => {
        setPlayerReady(false);
        setPendingPlayIntent(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [state.playerState]);

  const sendCommand = useCallback((command: string, args?: any) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'command', command, args },
        '*'
      );
    }
  }, []);

  const setPlayerState = useCallback((playerState: 'closed' | 'full' | 'mini' | 'hidden') => {
    setState(prev => ({ ...prev, playerState }));
  }, []);

  const setCurrentIndex = useCallback((currentIndex: number) => {
    setState(prev => ({ ...prev, currentIndex }));
  }, []);

  const setIsPlaying = useCallback((isPlaying: boolean) => {
    setState(prev => ({ ...prev, isPlaying }));
  }, []);

  const setCurrentTime = useCallback((currentTime: number) => {
    setState(prev => ({ ...prev, currentTime }));
  }, []);

  const setDuration = useCallback((duration: number) => {
    setState(prev => ({ ...prev, duration }));
  }, []);

  const startPlaylist = useCallback((playlist: PlaylistItem[], setTitle: string, setId: string, startIndex = 0) => {
    setState(prev => ({
      ...prev,
      playlist,
      setTitle,
      setId,
      currentIndex: startIndex,
      currentTime: 0,
      duration: 0,
      playerState: 'full',
      isPlaying: false,
    }));
    setPlayerReady(false);
  }, []);

  const closePlayer = useCallback(() => {
    sendCommand('pause');
    setState({ ...defaultState });
    setPlayerReady(false);
    setPendingPlayIntent(false);
    localStorage.removeItem(STORAGE_KEY);
  }, [sendCommand]);

  const hidePlayer = useCallback(() => {
    setState(prev => ({ ...prev, playerState: 'hidden' }));
  }, []);

  const showPlayer = useCallback(() => {
    setState(prev => ({ ...prev, playerState: 'mini' }));
  }, []);

  return (
    <MusicPlayerContext.Provider
      value={{
        ...state,
        setPlayerState,
        setCurrentIndex,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        pendingPlayIntent,
        setPendingPlayIntent,
        startPlaylist,
        closePlayer,
        hidePlayer,
        showPlayer,
        iframeRef,
        sendCommand,
        playerReady,
        setPlayerReady,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
  }
  return context;
};
