import logoMobile from "@/assets/kworship-logo-mobile.png";
import logoDesktop from "@/assets/kworship-logo-desktop.png";

export function HeaderLogo() {
  return (
    <>
      {/* Mobile: Left aligned */}
      <div className="flex items-center md:hidden">
        <img src={logoMobile} alt="K-Worship" className="h-12 cursor-pointer" />
      </div>

      {/* Desktop: Center aligned */}
      <div className="hidden md:flex justify-center">
        <img src={logoDesktop} alt="K-Worship" className="h-16 cursor-pointer" />
      </div>
    </>
  );
}
