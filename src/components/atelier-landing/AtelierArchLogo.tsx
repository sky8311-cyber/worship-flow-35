import { motion } from "framer-motion";

interface AtelierArchLogoProps {
  onArchComplete?: () => void;
  className?: string;
  delay?: number;
  startDrawing?: boolean;
  showStar?: boolean;
}

export const AtelierArchLogo = ({ onArchComplete, className = "", delay = 0, startDrawing = true, showStar = false }: AtelierArchLogoProps) => {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 -30 660 610"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Outer arch */}
        <motion.path
          d="M150 520 L150 200 Q150 130 200 90 L280 20 Q330 -20 380 20 L460 90 Q510 130 510 200 L510 520"
          stroke="#1F1F1F"
          strokeWidth="24"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={startDrawing ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 1.2, delay: delay, ease: "easeInOut" }}
        />

        {/* Inner arch */}
        <motion.path
          d="M195 520 L195 230 Q195 170 230 140 L290 90 Q330 60 370 90 L430 140 Q465 170 465 230 L465 520"
          stroke="#1F1F1F"
          strokeWidth="24"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={startDrawing ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 1.2, delay: delay + 0.5, ease: "easeInOut" }}
          onAnimationComplete={() => {
            if (startDrawing) onArchComplete?.();
          }}
        />

        {/* Gold Star - controlled by showStar prop */}
        <motion.g transform="translate(500,-10)">
          <motion.path
            d="M0 28 C14 28 28 14 28 0 C28 14 42 28 56 28 C42 28 28 42 28 56 C28 42 14 28 0 28Z"
            fill="#B8902A"
            initial={{ scale: 0, opacity: 0 }}
            animate={showStar ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{
              duration: 0.35,
              ease: [0.175, 0.885, 0.32, 1.275],
            }}
            style={{ transformOrigin: "28px 28px" }}
          />
        </motion.g>
      </svg>
    </div>
  );
};
