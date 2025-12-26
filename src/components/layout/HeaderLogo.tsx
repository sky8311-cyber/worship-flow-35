import logoMobile from "@/assets/kworship-logo-mobile.png";
import logoDesktop from "@/assets/kworship-logo-desktop.png";

export function HeaderLogo() {
  return (
    <>
      {/* Mobile/Tablet logo */}
      <img src={logoMobile} alt="K-Worship" className="h-10 md:hidden cursor-pointer" />
      {/* Desktop logo */}
      <img src={logoDesktop} alt="K-Worship" className="hidden md:block h-16 cursor-pointer" />
    </>
  );
}
