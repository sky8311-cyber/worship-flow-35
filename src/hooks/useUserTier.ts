import { useTierFeature, TIER_HIERARCHY } from "./useTierFeature";

/**
 * Returns numeric tier (0-3) for institute access control.
 * 0 = member, 1 = worship_leader, 2 = premium, 3 = church
 */
export function useUserTier() {
  const { tier, isLoading } = useTierFeature();
  return {
    userTier: TIER_HIERARCHY[tier] as number,
    tierKey: tier,
    isLoading,
  };
}

export const canAccess = (requiredTier: number, userTier: number) =>
  userTier >= requiredTier;

export const tierLabel = (requiredTier: number, language: string) => {
  const labels: Record<number, { ko: string; en: string }> = {
    1: { ko: "기본멤버(Basic Member)부터 수강 가능", en: "Available for Basic Member and above" },
    2: { ko: "정식멤버(Full Member)부터 수강 가능", en: "Available for Full Member and above" },
    3: { ko: "공동체계정(Community Account)부터 수강 가능", en: "Available for Community Account and above" },
  };
  return labels[requiredTier]?.[language === "ko" ? "ko" : "en"] || "";
};
