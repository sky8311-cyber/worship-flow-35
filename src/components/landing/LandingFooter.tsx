import { useTranslation } from "@/hooks/useTranslation";
import { motion, useScroll, useTransform } from "framer-motion";
import { Instagram, Youtube, Mail } from "lucide-react";

export const LandingFooter = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  
  const { scrollYProgress } = useScroll();
  
  // Footer reveal animation - activates in the last 15% of scroll
  const progress = useTransform(scrollYProgress, [0.85, 1], [0, 1]);
  const overlayOpacity = useTransform(progress, [0, 1], [1, 0]);
  const contentY = useTransform(progress, [0, 1], ["30%", "0%"]);
  const contentOpacity = useTransform(progress, [0, 0.5, 1], [0, 0.5, 1]);

  return (
    <footer className="sticky bottom-0 z-0 h-screen bg-primary text-primary-foreground overflow-hidden">
      {/* Dark overlay that fades out as you scroll */}
      <motion.div 
        className="absolute inset-0 bg-background pointer-events-none z-10"
        style={{ opacity: overlayOpacity }}
      />
      
      {/* Footer content that slides up */}
      <motion.div 
        className="container mx-auto px-4 h-full flex flex-col justify-center relative z-0"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="max-w-6xl mx-auto w-full">
          {/* Main footer grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-16">
            {/* Brand section */}
            <div className="lg:col-span-1">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">K-Worship</h3>
              <p className="text-primary-foreground/80 text-sm md:text-base leading-relaxed">
                {t("landing.hero.subtitle")}
              </p>
            </div>
            
            {/* Product links */}
            <nav className="space-y-3">
              <h4 className="font-semibold text-lg mb-4">Product</h4>
              <a href="#features" className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                How It Works
              </a>
              <a href="#community" className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Community
              </a>
            </nav>
            
            {/* Support links */}
            <nav className="space-y-3">
              <h4 className="font-semibold text-lg mb-4">Support</h4>
              <a href="#faq" className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                FAQs
              </a>
              <a href="mailto:hello@kworship.app" className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                {t("landing.footer.contact")}
              </a>
              <a href="mailto:hello@kworship.app" className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Help Center
              </a>
            </nav>
            
            {/* Legal links */}
            <nav className="space-y-3">
              <h4 className="font-semibold text-lg mb-4">Legal</h4>
              <button className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors text-left">
                {t("landing.footer.privacy")}
              </button>
              <button className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors text-left">
                {t("landing.footer.terms")}
              </button>
            </nav>
          </div>
          
          {/* Bottom bar */}
          <div className="border-t border-primary-foreground/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-primary-foreground/60">
              © {currentYear} K-Worship. All rights reserved.
            </div>
            
            {/* Social links */}
            <div className="flex items-center gap-6">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a 
                href="mailto:hello@kworship.app"
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
};
