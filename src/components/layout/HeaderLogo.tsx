import { useLocation } from "react-router-dom";
import logoMobile from "@/assets/kworship-logo-mobile.png";
import logoDesktop from "@/assets/kworship-logo-desktop.png";
import instituteLogo from "@/assets/kworship-institute-logo.png";

export function HeaderLogo() {
  const location = useLocation();
  const isInstitute = location.pathname.startsWith("/institute");

  if (isInstitute) {
    return (
      <img src={instituteLogo} alt="K-Worship Institute" className="h-[90px] md:h-[132px] cursor-pointer" />
    );
  }

  return (
    <>
      <img src={logoMobile} alt="K-Worship" className="h-10 md:hidden cursor-pointer" />
      <img src={logoDesktop} alt="K-Worship" className="hidden md:block h-16 cursor-pointer" />
    </>
  );
}
