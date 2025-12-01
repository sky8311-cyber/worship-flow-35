import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, Volume2, VolumeX, Check } from "lucide-react";
import { motion } from "framer-motion";
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
  const [workingBpm, setWorkingBpm] = useState(bpm || 120);
  const [hasChanges, setHasChanges] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIdRef = useRef<number | null>(null);
  const currentBeatRef = useRef(0);
  const isPlayingRef = useRef(false); // Sync ref to track playing state immediately
  
  // Parse time signature to get beats per measure
  const beatsPerMeasure = parseInt(timeSignature?.split("/")[0] || "4") || 4;
  
  // Sync workingBpm when prop changes externally
  useEffect(() => {
    if (bpm !== null && bpm !== workingBpm) {
      setWorkingBpm(bpm);
      setHasChanges(false);
    }
  }, [bpm]);
  
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
    
    const secondsPerBeat = 60.0 / workingBpm;
    const scheduleAheadTime = 0.1; // Schedule 100ms ahead
    
    while (nextNoteTimeRef.current < audioContext.currentTime + scheduleAheadTime) {
      const isAccent = currentBeatRef.current === 0;
      
      // Schedule the visual update - check ref to avoid updating after stop
      const beatToShow = currentBeatRef.current;
      setTimeout(() => {
        if (isPlayingRef.current) {
          setCurrentBeat(beatToShow);
        }
      }, (nextNoteTimeRef.current - audioContext.currentTime) * 1000);
      
      // Play the click
      playClick(isAccent);
      
      // Advance beat
      currentBeatRef.current = (currentBeatRef.current + 1) % beatsPerMeasure;
      nextNoteTimeRef.current += secondsPerBeat;
    }
  }, [workingBpm, beatsPerMeasure, playClick]);
  
  // Start/stop the metronome
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      // Stop
      isPlayingRef.current = false;
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
      
      isPlayingRef.current = true;
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
  }, [workingBpm, scheduler, isPlaying]);
  
  // Handle BPM adjustment by increment of 1
  const adjustBpm = (delta: number) => {
    const newBpm = Math.max(40, Math.min(240, workingBpm + delta));
    setWorkingBpm(newBpm);
    setHasChanges(newBpm !== bpm);
  };
  
  // Handle direct BPM input
  const handleBpmInput = (value: string) => {
    const newBpm = Math.max(40, Math.min(240, parseInt(value) || 120));
    setWorkingBpm(newBpm);
    setHasChanges(newBpm !== bpm);
  };
  
  // Save BPM and stop metronome
  const handleSave = () => {
    onBpmChange?.(workingBpm);
    setHasChanges(false);
    
    // Stop metronome on save - update ref first to stop scheduled callbacks
    isPlayingRef.current = false;
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    setIsPlaying(false);
    setCurrentBeat(0);
    currentBeatRef.current = 0;
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
      
      {/* Play/Pause and Mute controls */}
      <div className="flex items-center gap-0.5">
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
      
      {/* BPM controls - always visible */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-xs"
          onClick={() => adjustBpm(-1)}
        >
          -
        </Button>
        <Input
          type="number"
          value={workingBpm}
          onChange={(e) => handleBpmInput(e.target.value)}
          className="w-14 h-6 text-xs text-center px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          min={40}
          max={240}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-xs"
          onClick={() => adjustBpm(1)}
        >
          +
        </Button>
      </div>
      
      {/* Save button */}
      {onBpmChange && (
        <Button
          variant={hasChanges ? "default" : "ghost"}
          size="icon"
          className={cn(
            "h-7 w-7",
            hasChanges && "bg-primary text-primary-foreground"
          )}
          onClick={handleSave}
          title="Save BPM"
          disabled={!hasChanges}
        >
          <Check className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
};
