import { useTranslation } from "@/hooks/useTranslation";
import { motion, useScroll, useTransform } from "framer-motion";
import { Instagram, Youtube, Mail, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const LandingFooter = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  
  const { scrollYProgress } = useScroll();
  
  // Footer reveal animation - activates in the last 15% of scroll
  const progress = useTransform(scrollYProgress, [0.85, 1], [0, 1]);
  const overlayOpacity = useTransform(progress, [0, 1], [1, 0]);
  const contentY = useTransform(progress, [0, 1], ["30%", "0%"]);
  const contentOpacity = useTransform(progress, [0, 0.5, 1], [0, 0.5, 1]);

  const productLinks = [
    { href: "#features", label: t("landing.footer.features") },
    { href: "#how-it-works", label: t("landing.footer.howItWorks") },
    { href: "#community", label: t("landing.footer.community") },
  ];

  const supportLinks = [
    { href: "#faq", label: t("landing.footer.faqs") },
    { href: "mailto:hello@kworship.app", label: t("landing.footer.contact") },
    { href: "mailto:hello@kworship.app", label: t("landing.footer.helpCenter") },
  ];

  const legalLinks = [
    { to: "/legal", label: t("landing.footer.privacy") },
    { to: "/legal", label: t("landing.footer.terms") },
  ];

  return (
    <footer className="sticky bottom-0 z-0 min-h-screen bg-primary text-primary-foreground overflow-hidden">
      {/* Dark overlay that fades out as you scroll */}
      <motion.div 
        className="absolute inset-0 bg-background pointer-events-none z-10"
        style={{ opacity: overlayOpacity }}
      />
      
      {/* Footer content that slides up */}
      <motion.div 
        className="container mx-auto px-4 h-full flex flex-col justify-center relative z-0 py-16"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="max-w-6xl mx-auto w-full">
          {/* Brand section */}
          <div className="mb-12">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">K-Worship</h3>
            <p className="text-primary-foreground/80 text-sm md:text-base leading-relaxed max-w-md">
              {t("landing.hero.subtitle")}
            </p>
          </div>

          {/* Mobile: Accordion layout */}
          <div className="md:hidden mb-12">
            <Accordion type="multiple" className="space-y-2">
              {/* Product Section */}
              <AccordionItem value="product" className="border-primary-foreground/20">
                <AccordionTrigger className="text-primary-foreground hover:no-underline py-4 text-lg font-semibold">
                  {t("landing.footer.product")}
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <nav className="space-y-3">
                    {productLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    ))}
                  </nav>
                </AccordionContent>
              </AccordionItem>

              {/* Support Section */}
              <AccordionItem value="support" className="border-primary-foreground/20">
                <AccordionTrigger className="text-primary-foreground hover:no-underline py-4 text-lg font-semibold">
                  {t("landing.footer.support")}
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <nav className="space-y-3">
                    {supportLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    ))}
                  </nav>
                </AccordionContent>
              </AccordionItem>

              {/* Legal Section */}
              <AccordionItem value="legal" className="border-primary-foreground/20">
                <AccordionTrigger className="text-primary-foreground hover:no-underline py-4 text-lg font-semibold">
                  {t("landing.footer.legal")}
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <nav className="space-y-3">
                    {legalLinks.map((link) => (
                      <Link
                        key={link.label}
                        to={link.to}
                        className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden md:grid md:grid-cols-3 gap-8 lg:gap-12 mb-16">
            {/* Product links */}
            <nav className="space-y-3">
              <h4 className="font-semibold text-lg mb-4">{t("landing.footer.product")}</h4>
              {productLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            
            {/* Support links */}
            <nav className="space-y-3">
              <h4 className="font-semibold text-lg mb-4">{t("landing.footer.support")}</h4>
              {supportLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            
            {/* Legal links */}
            <nav className="space-y-3">
              <h4 className="font-semibold text-lg mb-4">{t("landing.footer.legal")}</h4>
              {legalLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Bottom bar */}
          <div className="border-t border-primary-foreground/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-primary-foreground/60 text-center md:text-left">
              <p>© {currentYear} Goodpapa Inc. All rights reserved.</p>
              <p className="mt-1">K-Worship™ is a trademark of Goodpapa Inc.</p>
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
