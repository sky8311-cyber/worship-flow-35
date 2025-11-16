export const LandingFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-accent/5 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {currentYear} K-Worship. All rights reserved.
          </div>

          <div className="flex items-center gap-6 text-sm">
            <a
              href="mailto:hello@kworship.app"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
            <span className="text-muted-foreground">•</span>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </button>
            <span className="text-muted-foreground">•</span>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </button>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <a href="mailto:hello@kworship.app" className="hover:text-foreground transition-colors">
            hello@kworship.app
          </a>
        </div>
      </div>
    </footer>
  );
};
