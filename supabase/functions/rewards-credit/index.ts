import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreditRequest {
  user_id: string;
  reason_code: string;
  ref_type: string;
  ref_id?: string;
  meta?: Record<string, unknown>;
  idempotency_key: string;
}

interface CreditResponse {
  success: boolean;
  ledger_id?: string;
  new_balance?: number;
  error?: string;
  skipped?: boolean;
  skip_reason?: string;
}

// Milestone-based reward codes that should only be awarded once per ref_id
const MILESTONE_REWARD_CODES = [
  'first_community_post',
  'community_posts_10_milestone',
  'song_metadata_complete',
  // Profile & onboarding milestones
  'profile_photo_added',
  'profile_bio_added',
  'profile_complete',
  'cover_photo_added',
  'first_community_join',
  // Team activity milestones
  'position_signup',
  // Community engagement milestones
  'welcome_post_created'
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create service role client for privileged operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CreditRequest = await req.json();
    const { user_id, reason_code, ref_type, ref_id, meta = {}, idempotency_key } = body;

    // Validate required fields
    if (!user_id || !reason_code || !ref_type || !idempotency_key) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: user_id, reason_code, ref_type, idempotency_key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing credit request: user=${user_id}, reason=${reason_code}, ref_id=${ref_id}`);

    // 1. Check if rewards system is enabled
    const { data: settings, error: settingsError } = await supabase
      .from('rewards_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (settingsError || !settings) {
      console.error('Failed to fetch settings:', settingsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch rewards settings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!settings.rewards_enabled) {
      return new Response(
        JSON.stringify({ success: false, skipped: true, skip_reason: 'Rewards system is disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get or create wallet and check status
    const { data: wallet, error: walletError } = await supabase
      .rpc('get_or_create_rewards_wallet', { p_user_id: user_id });

    if (walletError) {
      console.error('Failed to get wallet:', walletError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get or create wallet' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (wallet.status === 'frozen') {
      return new Response(
        JSON.stringify({ success: false, skipped: true, skip_reason: 'Wallet is frozen' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get the rule and check if enabled
    const { data: rule, error: ruleError } = await supabase
      .from('rewards_rules')
      .select('*')
      .eq('code', reason_code)
      .single();

    if (ruleError || !rule) {
      console.error('Rule not found:', reason_code);
      return new Response(
        JSON.stringify({ success: false, error: `Rule not found: ${reason_code}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!rule.enabled) {
      return new Response(
        JSON.stringify({ success: false, skipped: true, skip_reason: 'Rule is disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amount = rule.amount;

    // Check max_single_tx_amount
    if (amount > settings.max_single_tx_amount) {
      return new Response(
        JSON.stringify({ success: false, error: `Amount ${amount} exceeds max single tx amount ${settings.max_single_tx_amount}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Check milestone-based rewards (one-time per ref_id)
    if (MILESTONE_REWARD_CODES.includes(reason_code) && ref_id) {
      const { data: existingMilestone } = await supabase
        .from('rewards_milestones')
        .select('id')
        .eq('user_id', user_id)
        .eq('milestone_code', reason_code)
        .eq('ref_id', ref_id)
        .single();

      if (existingMilestone) {
        console.log(`Milestone already achieved: user=${user_id}, code=${reason_code}, ref=${ref_id}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            skipped: true, 
            skip_reason: `Milestone already achieved for this ${ref_type}` 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 5. Check cooldown (if applicable)
    if (rule.cooldown_seconds > 0 && ref_id) {
      const cooldownDate = new Date(Date.now() - rule.cooldown_seconds * 1000).toISOString();
      
      const { data: recentEntry } = await supabase
        .from('rewards_ledger')
        .select('id, created_at')
        .eq('user_id', user_id)
        .eq('reason_code', reason_code)
        .eq('ref_id', ref_id)
        .eq('direction', 'credit')
        .gte('created_at', cooldownDate)
        .limit(1);

      if (recentEntry && recentEntry.length > 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            skipped: true, 
            skip_reason: `Cooldown active. Last entry: ${recentEntry[0].created_at}` 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 6. Check daily caps
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's totals
    const { data: dailyTotals } = await supabase
      .from('rewards_daily_user_totals')
      .select('total_earned')
      .eq('user_id', user_id)
      .eq('date', today)
      .single();

    const todayEarned = dailyTotals?.total_earned || 0;

    // Check global daily cap
    if (todayEarned + amount > settings.max_daily_earn_per_user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          skipped: true, 
          skip_reason: `Daily global cap reached. Earned today: ${todayEarned}, Cap: ${settings.max_daily_earn_per_user}` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rule-specific daily cap
    if (rule.daily_cap_amount > 0) {
      const { data: ruleEarnings } = await supabase
        .from('rewards_ledger')
        .select('amount')
        .eq('user_id', user_id)
        .eq('reason_code', reason_code)
        .eq('direction', 'credit')
        .gte('created_at', `${today}T00:00:00Z`);

      const ruleEarnedToday = ruleEarnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      if (ruleEarnedToday + amount > rule.daily_cap_amount) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            skipped: true, 
            skip_reason: `Rule daily cap reached. Earned today for ${reason_code}: ${ruleEarnedToday}, Cap: ${rule.daily_cap_amount}` 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 7. Check idempotency - if already exists, return the existing entry
    const { data: existingEntry } = await supabase
      .from('rewards_ledger')
      .select('id')
      .eq('idempotency_key', idempotency_key)
      .single();

    if (existingEntry) {
      // Already processed - return success without creating duplicate
      return new Response(
        JSON.stringify({ 
          success: true, 
          ledger_id: existingEntry.id, 
          new_balance: wallet.balance,
          skipped: true,
          skip_reason: 'Already processed (idempotent)'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Record milestone if applicable
    if (MILESTONE_REWARD_CODES.includes(reason_code) && ref_id) {
      const { error: milestoneError } = await supabase
        .from('rewards_milestones')
        .insert({
          user_id,
          milestone_code: reason_code,
          ref_id
        });

      if (milestoneError) {
        console.error('Failed to record milestone:', milestoneError);
        // If it's a unique violation, the milestone was already recorded
        if (milestoneError.code === '23505') {
          return new Response(
            JSON.stringify({ 
              success: false, 
              skipped: true, 
              skip_reason: `Milestone already achieved (concurrent request)` 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // For other errors, continue but log
      } else {
        console.log(`Milestone recorded: user=${user_id}, code=${reason_code}, ref=${ref_id}`);
      }
    }

    // 9. Execute the credit transaction
    // Insert ledger entry
    const { data: ledgerEntry, error: ledgerError } = await supabase
      .from('rewards_ledger')
      .insert({
        user_id,
        direction: 'credit',
        amount,
        reason_code,
        ref_type,
        ref_id: ref_id || null,
        meta,
        idempotency_key
      })
      .select('id')
      .single();

    if (ledgerError) {
      console.error('Failed to insert ledger entry:', ledgerError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create ledger entry' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update wallet balance
    const newBalance = wallet.balance + amount;
    const newLifetimeEarned = wallet.lifetime_earned + amount;

    const { error: walletUpdateError } = await supabase
      .from('rewards_wallets')
      .update({
        balance: newBalance,
        lifetime_earned: newLifetimeEarned,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id);

    if (walletUpdateError) {
      console.error('Failed to update wallet:', walletUpdateError);
      // Note: In production, we'd want to rollback the ledger entry here
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update wallet balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update daily totals
    const { error: dailyError } = await supabase
      .from('rewards_daily_user_totals')
      .upsert({
        user_id,
        date: today,
        total_earned: todayEarned + amount,
        total_spent: 0
      }, {
        onConflict: 'user_id,date'
      });

    if (dailyError) {
      console.error('Failed to update daily totals:', dailyError);
      // Non-critical, continue
    }

    // 10. Velocity detection - check for abuse
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentCredits } = await supabase
      .from('rewards_ledger')
      .select('amount')
      .eq('user_id', user_id)
      .eq('direction', 'credit')
      .gte('created_at', tenMinutesAgo);

    const recentTotal = recentCredits?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    if (recentTotal > 500) {
      // Flag for potential abuse (increased threshold due to higher rewards)
      await supabase
        .from('rewards_abuse_flags')
        .insert({
          user_id,
          flag_type: 'velocity_exceeded',
          description: `Earned ${recentTotal} seeds in 10 minutes`,
          meta: { threshold: 500, actual: recentTotal, last_reason_code: reason_code }
        });

      console.warn(`Velocity flag created for user ${user_id}: ${recentTotal} seeds in 10 min`);
    }

    const response: CreditResponse = {
      success: true,
      ledger_id: ledgerEntry.id,
      new_balance: newBalance
    };

    console.log(`Credit successful: user=${user_id}, amount=${amount}, reason=${reason_code}, new_balance=${newBalance}`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in rewards-credit:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
