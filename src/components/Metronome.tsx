import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetronomeProps {
  bpm: number | null;
  timeSignature?: string;
  onBpmChange?: (bpm: number) => void;
}

export const Metronome = ({ bpm, timeSignature = "4/4", onBpmChange }: MetronomeProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentBeat, setCurrentBeat] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIdRef = useRef<number | null>(null);
  const currentBeatRef = useRef(0);
  
  // Parse time signature to get beats per measure
  const beatsPerMeasure = parseInt(timeSignature?.split("/")[0] || "4") || 4;
  
  // Current BPM (default to 120 if not set)
  const currentBpm = bpm || 120;
  
  // Initialize audio context on first user interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);
  
  // Play a click sound
  const playClick = useCallback((isAccent: boolean) => {
    if (isMuted) return;
    
    const audioContext = audioContextRef.current;
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Higher pitch for accent (beat 1), lower for other beats
    oscillator.frequency.value = isAccent ? 1000 : 800;
    oscillator.type = "sine";
    
    // Quick attack and decay for a click sound
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(isAccent ? 0.3 : 0.15, now + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }, [isMuted]);
  
  // Scheduler function for precise timing
  const scheduler = useCallback(() => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;
    
    const secondsPerBeat = 60.0 / currentBpm;
    const scheduleAheadTime = 0.1; // Schedule 100ms ahead
    
    while (nextNoteTimeRef.current < audioContext.currentTime + scheduleAheadTime) {
      const isAccent = currentBeatRef.current === 0;
      
      // Schedule the visual update
      const beatToShow = currentBeatRef.current;
      setTimeout(() => {
        setCurrentBeat(beatToShow);
      }, (nextNoteTimeRef.current - audioContext.currentTime) * 1000);
      
      // Play the click
      playClick(isAccent);
      
      // Advance beat
      currentBeatRef.current = (currentBeatRef.current + 1) % beatsPerMeasure;
      nextNoteTimeRef.current += secondsPerBeat;
    }
  }, [currentBpm, beatsPerMeasure, playClick]);
  
  // Start/stop the metronome
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      // Stop
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
      setIsPlaying(false);
      setCurrentBeat(0);
      currentBeatRef.current = 0;
    } else {
      // Start
      const audioContext = initAudioContext();
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
      
      nextNoteTimeRef.current = audioContext.currentTime;
      currentBeatRef.current = 0;
      setCurrentBeat(0);
      
      timerIdRef.current = window.setInterval(scheduler, 25);
      setIsPlaying(true);
    }
  }, [isPlaying, initAudioContext, scheduler]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
      }
    };
  }, []);
  
  // Update scheduler when BPM changes
  useEffect(() => {
    if (isPlaying && timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = window.setInterval(scheduler, 25);
    }
  }, [currentBpm, scheduler, isPlaying]);
  
  // Handle BPM adjustment
  const adjustBpm = (delta: number) => {
    const newBpm = Math.max(40, Math.min(240, currentBpm + delta));
    onBpmChange?.(newBpm);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Beat indicator */}
      <div className="flex items-center gap-1">
        {Array.from({ length: beatsPerMeasure }).map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              isPlaying && currentBeat === i
                ? i === 0
                  ? "bg-primary"
                  : "bg-primary/70"
                : "bg-muted-foreground/30"
            )}
            animate={
              isPlaying && currentBeat === i
                ? { scale: [1, 1.5, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.15 }}
          />
        ))}
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={togglePlay}
          title={isPlaying ? "Stop" : "Start"}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7",
            isMuted && "text-muted-foreground"
          )}
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
      
      {/* BPM adjustment buttons (optional, shown when onBpmChange is provided) */}
      {onBpmChange && (
        <div className="flex items-center gap-0.5 text-xs">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-xs"
            onClick={() => adjustBpm(-5)}
          >
            -
          </Button>
          <span className="w-8 text-center text-muted-foreground">{currentBpm}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-xs"
            onClick={() => adjustBpm(5)}
          >
            +
          </Button>
        </div>
      )}
    </div>
  );
};
