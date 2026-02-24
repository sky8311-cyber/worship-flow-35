import { useTranslation } from "@/hooks/useTranslation";
import { Instagram, Youtube, Mail, AtSign } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import logoDesktop from "@/assets/kworship-logo-desktop.png";

export const LandingFooter = () => {
  const { t, language } = useTranslation();
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { to: "/features", label: language === "ko" ? "주요 기능" : "Key Features" },
  ];

  const companyLinks = [
    { to: "/news", label: language === "ko" ? "뉴스" : "News" },
    { to: "/app-history", label: language === "ko" ? "앱 히스토리" : "App History" },
    { to: "/press", label: language === "ko" ? "브랜드에셋" : "Brand Assets" },
  ];

  const supportLinks = [
    { href: "mailto:hello@kworship.app", label: t("landing.footer.contact") },
  ];

  const legalLinks = [
    { to: "/legal", label: t("landing.footer.privacy") },
    { to: "/legal", label: t("landing.footer.terms") },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto w-full">
          {/* Brand section */}
          <div className="mb-12">
            <Link to="/" className="inline-block mb-4">
              <img 
                src={logoDesktop} 
                alt="K-Worship" 
                className="h-12 md:h-14 brightness-0 invert" 
              />
            </Link>
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
                      <Link
                        key={link.to}
                        to={link.to}
                        className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </AccordionContent>
              </AccordionItem>

              {/* Company Section */}
              <AccordionItem value="company" className="border-primary-foreground/20">
                <AccordionTrigger className="text-primary-foreground hover:no-underline py-4 text-lg font-semibold">
                  {language === "ko" ? "회사" : "Company"}
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <nav className="space-y-3">
                    {companyLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
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
          <div className="hidden md:grid md:grid-cols-4 gap-8 lg:gap-12 mb-16">
            {/* Product links */}
            <nav className="space-y-3">
              <h4 className="font-semibold text-lg mb-4">{t("landing.footer.product")}</h4>
              {productLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Company links */}
            <nav className="space-y-3">
              <h4 className="font-semibold text-lg mb-4">{language === "ko" ? "회사" : "Company"}</h4>
              {companyLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {link.label}
                </Link>
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
            <div className="text-sm text-primary-foreground/60 text-center md:text-left space-y-2">
              <div>
                <p>© {currentYear} Goodpapa Inc. All rights reserved.</p>
                <p className="mt-1">K-Worship™ is a trademark of Goodpapa Inc.</p>
              </div>
              <div className="text-xs leading-relaxed">
                <p>
                  {language === "ko" ? "법인명" : "Company"}: Goodpapa Inc. | {language === "ko" ? "대표" : "CEO"}: Kwang Choi
                </p>
                <p>
                  {language === "ko" ? "사업자등록번호" : "Business Registration No."}: 743833147
                </p>
                <p>
                  {language === "ko" ? "소재지" : "Address"}: #1250-329 Howe Street, Vancouver, BC V6C 3N2 Canada
                </p>
                <p>
                  {language === "ko" ? "연락처" : "Contact"}:{" "}
                  <a href="mailto:hello@goodpapa.org" className="underline hover:text-primary-foreground transition-colors">
                    hello@goodpapa.org
                  </a>
                  {" | "}
                  <a href="tel:+16042451007" className="underline hover:text-primary-foreground transition-colors">
                    1-604-245-1007
                  </a>
                </p>
              </div>
            </div>
            
            {/* Social links */}
            <div className="flex items-center gap-6">
              <a 
                href="https://www.instagram.com/kworship.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://www.threads.net/@kworship.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                aria-label="Threads"
              >
                <AtSign className="w-5 h-5" />
              </a>
              <a 
                href="https://www.youtube.com/@kworship_app" 
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
      </div>
    </footer>
  );
};
