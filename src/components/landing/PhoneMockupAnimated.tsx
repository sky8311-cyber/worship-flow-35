import { motion, AnimatePresence, MotionValue } from "framer-motion";
import { ReactNode } from "react";

interface PhoneMockupAnimatedProps {
  children: ReactNode;
  style?: {
    scale?: MotionValue<number>;
    x?: MotionValue<string> | MotionValue<number>;
    opacity?: MotionValue<number>;
  };
  className?: string;
}

export const PhoneMockupAnimated = ({ children, style, className = "" }: PhoneMockupAnimatedProps) => {
  return (
    <motion.div 
      style={style}
      className={`relative ${className}`}
    >
      {/* Phone Frame */}
      <div className="relative w-56 md:w-64 lg:w-72 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-black rounded-full z-20" />
        
        {/* Screen */}
        <div className="w-full aspect-[9/19] bg-background rounded-[2rem] overflow-hidden relative">
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Phone Shadow */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/20 blur-xl rounded-full" />
    </motion.div>
  );
};

interface ScreenWrapperProps {
  children: ReactNode;
  screenKey: string | number;
}

export const ScreenWrapper = ({ children, screenKey }: ScreenWrapperProps) => (
  <motion.div
    key={screenKey}
    initial={{ opacity: 0, scale: 1.05 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="absolute inset-0"
  >
    {children}
  </motion.div>
);
