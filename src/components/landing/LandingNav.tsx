import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { smoothScrollTo } from "@/lib/smoothScroll";
import { useScrollObserver } from "@/hooks/useScrollObserver";
import { motion, AnimatePresence } from "framer-motion";

export const LandingNav = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrolled = useScrollObserver(50);

  const navItems = [
    { label: "비전", id: "vision" },
    { label: "기능 소개", id: "features" },
    { label: "어떻게 쓰이나요", id: "how-it-works" },
    { label: "워십리더와 팀", id: "team" },
    { label: "자주 묻는 질문", id: "faq" },
  ];

  const handleNavClick = (id: string) => {
    smoothScrollTo(id);
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
            >
              K-Worship
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                {item.label}
              </button>
            ))}
            <Button
              onClick={() => handleNavClick("waitlist")}
              size="sm"
              className="ml-4"
            >
              얼리 액세스 신청
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className="text-left text-sm font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                >
                  {item.label}
                </button>
              ))}
              <Button
                onClick={() => handleNavClick("waitlist")}
                className="w-full"
              >
                얼리 액세스 신청
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
