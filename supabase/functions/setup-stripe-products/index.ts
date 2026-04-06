import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SETUP-STRIPE-PRODUCTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: verify user JWT + admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Verify user identity
    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !userData?.user) {
      logStep("Auth failed", { error: userError?.message });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: isAdmin, error: roleError } = await anonClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (roleError || !isAdmin) {
      logStep("Forbidden: not admin", { userId: userData.user.id });
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Authorized as admin", { userId: userData.user.id });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    // Service-role client for DB writes (key never exposed in response)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const result: Record<string, Record<string, string>> = {};

    // ─── Product 1: Full Membership ───
    logStep("Processing Full Membership");

    // Check if already configured
    const { data: fmRows } = await supabase
      .from("membership_products")
      .select("product_key, stripe_product_id, stripe_price_id_usd, stripe_price_id_krw")
      .in("product_key", ["full_membership", "full_membership_yearly"]);

    const fmMonthly = fmRows?.find((r: any) => r.product_key === "full_membership");
    const fmYearly = fmRows?.find((r: any) => r.product_key === "full_membership_yearly");

    let fmProductId = fmMonthly?.stripe_product_id || fmYearly?.stripe_product_id;

    // Create product if needed
    if (!fmProductId) {
      const product = await stripe.products.create({
        name: "K-Worship Full Membership",
        metadata: { product_key: "full_membership" },
      });
      fmProductId = product.id;
      logStep("Created Full Membership product", { id: fmProductId });
    } else {
      logStep("Full Membership product exists", { id: fmProductId });
    }

    // Create prices as needed
    let fmUsdMonthly = fmMonthly?.stripe_price_id_usd;
    let fmUsdYearly = fmYearly?.stripe_price_id_usd;
    let fmKrwMonthly = fmMonthly?.stripe_price_id_krw;
    let fmKrwYearly = fmYearly?.stripe_price_id_krw;

    if (!fmUsdMonthly) {
      const price = await stripe.prices.create({
        product: fmProductId,
        unit_amount: 499,
        currency: "usd",
        recurring: { interval: "month" },
      });
      fmUsdMonthly = price.id;
      logStep("Created FM USD monthly", { id: fmUsdMonthly });
    }

    if (!fmUsdYearly) {
      const price = await stripe.prices.create({
        product: fmProductId,
        unit_amount: 4999,
        currency: "usd",
        recurring: { interval: "year" },
      });
      fmUsdYearly = price.id;
      logStep("Created FM USD yearly", { id: fmUsdYearly });
    }

    if (!fmKrwMonthly) {
      const price = await stripe.prices.create({
        product: fmProductId,
        unit_amount: 5900,
        currency: "krw",
        recurring: { interval: "month" },
      });
      fmKrwMonthly = price.id;
      logStep("Created FM KRW monthly", { id: fmKrwMonthly });
    }

    if (!fmKrwYearly) {
      const price = await stripe.prices.create({
        product: fmProductId,
        unit_amount: 59000,
        currency: "krw",
        recurring: { interval: "year" },
      });
      fmKrwYearly = price.id;
      logStep("Created FM KRW yearly", { id: fmKrwYearly });
    }

    // Update DB
    await supabase
      .from("membership_products")
      .update({
        stripe_product_id: fmProductId,
        stripe_price_id_usd: fmUsdMonthly,
        stripe_price_id_krw: fmKrwMonthly,
      })
      .eq("product_key", "full_membership");

    await supabase
      .from("membership_products")
      .update({
        stripe_product_id: fmProductId,
        stripe_price_id_usd: fmUsdYearly,
        stripe_price_id_krw: fmKrwYearly,
      })
      .eq("product_key", "full_membership_yearly");

    result.full_membership = {
      product_id: fmProductId,
      usd_monthly: fmUsdMonthly!,
      usd_yearly: fmUsdYearly!,
      krw_monthly: fmKrwMonthly!,
      krw_yearly: fmKrwYearly!,
    };

    // ─── Product 2: Community Account ───
    logStep("Processing Community Account");

    const caProductId = "prod_TWHESCjhfmk4c0";
    const caUsdMonthly = "price_1SZEgWD3OASKwHF09K8qTBaf";

    const { data: caRows } = await supabase
      .from("membership_products")
      .select("product_key, stripe_product_id, stripe_price_id_usd, stripe_price_id_krw")
      .in("product_key", ["community_account", "community_account_yearly"]);

    const caMonthly = caRows?.find((r: any) => r.product_key === "community_account");
    const caYearly = caRows?.find((r: any) => r.product_key === "community_account_yearly");

    let caUsdYearly = caYearly?.stripe_price_id_usd;
    let caKrwMonthly = caMonthly?.stripe_price_id_krw;
    let caKrwYearly = caYearly?.stripe_price_id_krw;

    if (!caUsdYearly) {
      const price = await stripe.prices.create({
        product: caProductId,
        unit_amount: 39900,
        currency: "usd",
        recurring: { interval: "year" },
      });
      caUsdYearly = price.id;
      logStep("Created CA USD yearly", { id: caUsdYearly });
    }

    if (!caKrwMonthly) {
      const price = await stripe.prices.create({
        product: caProductId,
        unit_amount: 39900,
        currency: "krw",
        recurring: { interval: "month" },
      });
      caKrwMonthly = price.id;
      logStep("Created CA KRW monthly", { id: caKrwMonthly });
    }

    if (!caKrwYearly) {
      const price = await stripe.prices.create({
        product: caProductId,
        unit_amount: 399000,
        currency: "krw",
        recurring: { interval: "year" },
      });
      caKrwYearly = price.id;
      logStep("Created CA KRW yearly", { id: caKrwYearly });
    }

    // Update DB
    await supabase
      .from("membership_products")
      .update({
        stripe_product_id: caProductId,
        stripe_price_id_usd: caUsdMonthly,
        stripe_price_id_krw: caKrwMonthly,
      })
      .eq("product_key", "community_account");

    await supabase
      .from("membership_products")
      .update({
        stripe_product_id: caProductId,
        stripe_price_id_usd: caUsdYearly,
        stripe_price_id_krw: caKrwYearly,
      })
      .eq("product_key", "community_account_yearly");

    result.community_account = {
      product_id: caProductId,
      usd_monthly: caUsdMonthly,
      usd_yearly: caUsdYearly!,
      krw_monthly: caKrwMonthly!,
      krw_yearly: caKrwYearly!,
    };

    logStep("All done", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
