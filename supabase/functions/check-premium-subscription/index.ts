import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-PREMIUM-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ 
        subscribed: false, 
        status: "inactive",
        subscription_end: null,
        is_trial: false,
        trial_days_remaining: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions with premium metadata
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    const premiumSubscription = subscriptions.data.find((sub: { metadata?: Record<string, string> }) => 
      sub.metadata?.type === "premium"
    );

    if (!premiumSubscription) {
      // Check for trialing subscriptions
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 10,
      });
      
      const trialingSub = trialingSubscriptions.data.find((sub: { metadata?: Record<string, string> }) => 
        sub.metadata?.type === "premium"
      );

      if (trialingSub) {
        const trialEnd = new Date(trialingSub.trial_end! * 1000);
        const now = new Date();
        const trialDaysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        
        logStep("Found trialing subscription", { subscriptionId: trialingSub.id, trialEnd: trialEnd.toISOString() });
        
        // Update or create premium subscription record
        await supabaseClient
          .from("premium_subscriptions")
          .upsert({ 
            user_id: user.id,
            subscription_status: "trial",
            stripe_subscription_id: trialingSub.id,
            stripe_customer_id: customerId,
            trial_ends_at: trialEnd.toISOString(),
            current_period_end: new Date(trialingSub.current_period_end * 1000).toISOString(),
          }, { onConflict: 'user_id' });

        return new Response(JSON.stringify({
          subscribed: true,
          status: "trial",
          subscription_end: trialEnd.toISOString(),
          is_trial: true,
          trial_days_remaining: trialDaysRemaining
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      logStep("No active premium subscription found");
      
      // Update status to inactive
      await supabaseClient
        .from("premium_subscriptions")
        .upsert({ 
          user_id: user.id,
          subscription_status: "inactive",
          trial_ends_at: null,
          current_period_end: null,
        }, { onConflict: 'user_id' });

      return new Response(JSON.stringify({ 
        subscribed: false, 
        status: "inactive",
        subscription_end: null,
        is_trial: false,
        trial_days_remaining: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscriptionEnd = new Date(premiumSubscription.current_period_end * 1000).toISOString();
    logStep("Active subscription found", { subscriptionId: premiumSubscription.id, endDate: subscriptionEnd });

    // Update premium subscription record
    await supabaseClient
      .from("premium_subscriptions")
      .upsert({ 
        user_id: user.id,
        subscription_status: "active",
        stripe_subscription_id: premiumSubscription.id,
        stripe_customer_id: customerId,
        trial_ends_at: null,
        current_period_end: subscriptionEnd,
      }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({
      subscribed: true,
      status: "active",
      subscription_end: subscriptionEnd,
      is_trial: false,
      trial_days_remaining: 0
    }), {
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
