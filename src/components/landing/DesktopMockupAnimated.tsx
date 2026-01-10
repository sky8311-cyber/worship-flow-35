import { motion, MotionValue } from "framer-motion";
import { ReactNode } from "react";

interface DesktopMockupAnimatedProps {
  children: ReactNode;
  style?: {
    scale?: MotionValue<number>;
    opacity?: MotionValue<number>;
    x?: MotionValue<string> | MotionValue<number>;
  };
  className?: string;
}

export const DesktopMockupAnimated = ({ children, style, className = "" }: DesktopMockupAnimatedProps) => {
  return (
    <motion.div 
      style={style}
      className={`relative ${className}`}
    >
      {/* Browser Frame */}
      <div className="relative w-80 md:w-96 lg:w-[480px] bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl p-1 shadow-2xl">
        {/* Title Bar */}
        <div className="h-6 bg-gray-800 rounded-t-lg flex items-center px-2 gap-1.5">
          {/* Traffic lights */}
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          
          {/* URL Bar */}
          <div className="flex-1 mx-2">
            <div className="bg-gray-700 rounded h-3.5 flex items-center px-2">
              <span className="text-[8px] text-gray-400">kworship.app</span>
            </div>
          </div>
        </div>
        
        {/* Screen Content */}
        <div className="w-full aspect-[16/10] bg-background rounded-b-lg overflow-hidden">
          {children}
        </div>
      </div>
      
      {/* Desktop Shadow */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-6 bg-black/15 blur-2xl rounded-full" />
    </motion.div>
  );
};
