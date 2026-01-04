import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FullScreenLoader } from "@/components/layout/FullScreenLoader";

const REFERRAL_STORAGE_KEY = "kworship_referral_code";
const REFERRAL_EXPIRY_KEY = "kworship_referral_expiry";
const REFERRAL_EXPIRY_DAYS = 30;

export const setReferralCode = (code: string) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + REFERRAL_EXPIRY_DAYS);
  
  localStorage.setItem(REFERRAL_STORAGE_KEY, code.toUpperCase());
  localStorage.setItem(REFERRAL_EXPIRY_KEY, expiryDate.toISOString());
};

export const getReferralCode = (): string | null => {
  const code = localStorage.getItem(REFERRAL_STORAGE_KEY);
  const expiry = localStorage.getItem(REFERRAL_EXPIRY_KEY);
  
  if (!code || !expiry) return null;
  
  // Check if expired
  if (new Date() > new Date(expiry)) {
    clearReferralCode();
    return null;
  }
  
  return code;
};

export const clearReferralCode = () => {
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
  localStorage.removeItem(REFERRAL_EXPIRY_KEY);
};

const ReferralRedirect = () => {
  const { referralCode } = useParams<{ referralCode: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (referralCode) {
      // Store referral code with 30-day expiry
      setReferralCode(referralCode);
      console.log("Referral code stored:", referralCode);
    }
    
    // Redirect to signup
    navigate("/signup", { replace: true });
  }, [referralCode, navigate]);

  return <FullScreenLoader />;
};

export default ReferralRedirect;
