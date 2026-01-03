import { Variants } from "framer-motion";

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

// StringTune-style reveal animations
export const revealOnScroll: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 1.5,
    clipPath: "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)"
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    transition: { 
      duration: 1.2, 
      ease: [0.86, 0, 0.31, 1]
    }
  }
};

export const revealCard: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 1.1,
    clipPath: "polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)"
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    transition: { 
      duration: 1.0, 
      ease: [0.35, 0.35, 0, 1]
    }
  }
};

export const revealText: Variants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)"
  },
  visible: { 
    opacity: 1, 
    y: 0,
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    transition: { 
      duration: 0.8, 
      ease: [0.86, 0, 0.31, 1]
    }
  }
};

export const revealStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.15
    }
  }
};

export const viewportOptions = {
  once: true,
  margin: "-50px"
};

export const revealViewportOptions = {
  once: true,
  margin: "-100px"
};
