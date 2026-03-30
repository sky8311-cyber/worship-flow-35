import { useState, useEffect, useCallback } from "react";

interface TypewriterLine {
  text: string;
  className?: string;
}

interface TypewriterTextProps {
  lines: TypewriterLine[];
  speed?: number;
  delayBetweenLines?: number;
  startDelay?: number;
  onComplete?: () => void;
}

export const TypewriterText = ({
  lines,
  speed = 60,
  delayBetweenLines = 300,
  startDelay = 300,
  onComplete,
}: TypewriterTextProps) => {
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [started, setStarted] = useState(false);

  // Start delay
  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(timer);
  }, [startDelay]);

  const advance = useCallback(() => {
    if (!started || isComplete) return;

    const line = lines[currentLine];
    if (!line) return;

    if (currentChar < line.text.length) {
      setCurrentChar((c) => c + 1);
    } else if (currentLine < lines.length - 1) {
      // Move to next line after delay
      setTimeout(() => {
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
      }, delayBetweenLines);
      return; // Don't set interval for this tick
    } else {
      setIsComplete(true);
      onComplete?.();
      return;
    }
  }, [started, isComplete, currentLine, currentChar, lines, delayBetweenLines, onComplete]);

  useEffect(() => {
    if (!started || isComplete) return;
    const timer = setTimeout(advance, speed);
    return () => clearTimeout(timer);
  }, [advance, speed, started, isComplete]);

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const displayText =
          i < currentLine
            ? line.text
            : i === currentLine
              ? line.text.slice(0, currentChar)
              : "";

        if (!displayText && i > currentLine) return null;

        return (
          <div key={i} className={line.className}>
            <span>{displayText}</span>
            {/* Blinking cursor on current line */}
            {i === currentLine && !isComplete && (
              <span className="inline-block w-[2px] h-[1em] bg-[#1F1F1F] ml-0.5 align-middle animate-pulse" />
            )}
            {/* Final cursor blink on last line when complete */}
            {isComplete && i === lines.length - 1 && (
              <span
                className="inline-block w-[2px] h-[1em] ml-0.5 align-middle"
                style={{
                  backgroundColor: "#1F1F1F",
                  animation: "blink 1s step-end infinite",
                }}
              />
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};
