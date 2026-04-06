import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MembershipProduct {
  id: string;
  product_key: string;
  display_name_en: string;
  display_name_ko: string;
  description_en: string | null;
  description_ko: string | null;
  price_usd: number;
  price_krw: number;
  billing_cycle: "monthly" | "yearly";
  billing_cycle_label_en: string | null;
  billing_cycle_label_ko: string | null;
  trial_days: number;
  stripe_price_id_usd: string | null;
  stripe_price_id_krw: string | null;
  stripe_product_id: string | null;
  toss_plan_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useMembershipProducts() {
  return useQuery({
    queryKey: ["membership-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_products")
        .select("*")
        .eq("is_active", true)
        .order("product_key");
      
      if (error) throw error;
      return data as MembershipProduct[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

export function useMembershipProduct(productKey: string) {
  const { data: products, isLoading, error } = useMembershipProducts();
  
  const product = products?.find(p => p.product_key === productKey);
  
  return {
    product,
    isLoading,
    error,
  };
}

export function useAllMembershipProducts() {
  return useQuery({
    queryKey: ["membership-products-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_products")
        .select("*")
        .order("product_key");
      
      if (error) throw error;
      return data as MembershipProduct[];
    },
    staleTime: 30 * 1000, // 30 seconds for admin
  });
}

// Helper function to format price
export function formatPrice(cents: number, currency: "usd" | "krw"): string {
  if (currency === "usd") {
    return `$${(cents / 100).toFixed(2)}`;
  }
  return `₩${cents.toLocaleString()}`;
}
