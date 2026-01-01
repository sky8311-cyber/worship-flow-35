import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DebitRequest {
  user_id: string;
  item_code: string;
  meta?: Record<string, unknown>;
  idempotency_key: string;
}

interface DebitResponse {
  success: boolean;
  redemption_id?: string;
  ledger_id?: string;
  new_balance?: number;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: DebitRequest = await req.json();
    const { user_id, item_code, meta = {}, idempotency_key } = body;

    // Validate required fields
    if (!user_id || !item_code || !idempotency_key) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: user_id, item_code, idempotency_key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
        JSON.stringify({ success: false, error: 'Rewards system is disabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get the store item
    const { data: storeItem, error: itemError } = await supabase
      .from('rewards_store_items')
      .select('*')
      .eq('code', item_code)
      .eq('enabled', true)
      .single();

    if (itemError || !storeItem) {
      return new Response(
        JSON.stringify({ success: false, error: `Store item not found or disabled: ${item_code}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cost = storeItem.cost;

    // 3. Check stock if applicable
    if (storeItem.stock !== null && storeItem.stock <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Item is out of stock' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Get wallet and check balance
    const { data: wallet, error: walletError } = await supabase
      .rpc('get_or_create_rewards_wallet', { p_user_id: user_id });

    if (walletError) {
      console.error('Failed to get wallet:', walletError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get wallet' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (wallet.status === 'frozen') {
      return new Response(
        JSON.stringify({ success: false, error: 'Wallet is frozen' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (wallet.balance < cost) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Insufficient balance. Required: ${cost}, Available: ${wallet.balance}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Check idempotency
    const { data: existingEntry } = await supabase
      .from('rewards_ledger')
      .select('id')
      .eq('idempotency_key', idempotency_key)
      .single();

    if (existingEntry) {
      // Get the associated redemption
      const { data: existingRedemption } = await supabase
        .from('rewards_redemptions')
        .select('id')
        .eq('user_id', user_id)
        .eq('item_code', item_code)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return new Response(
        JSON.stringify({ 
          success: true, 
          ledger_id: existingEntry.id,
          redemption_id: existingRedemption?.id,
          new_balance: wallet.balance,
          error: 'Already processed (idempotent)'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Create redemption record (pending)
    const { data: redemption, error: redemptionError } = await supabase
      .from('rewards_redemptions')
      .insert({
        user_id,
        item_code,
        cost,
        status: 'pending',
        meta: {
          ...meta,
          item_name: storeItem.name,
          item_name_ko: storeItem.name_ko
        }
      })
      .select('id')
      .single();

    if (redemptionError) {
      console.error('Failed to create redemption:', redemptionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create redemption record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Insert ledger entry (debit)
    const { data: ledgerEntry, error: ledgerError } = await supabase
      .from('rewards_ledger')
      .insert({
        user_id,
        direction: 'debit',
        amount: cost,
        reason_code: 'redemption',
        ref_type: 'redemption',
        ref_id: redemption.id,
        meta: {
          item_code,
          item_name: storeItem.name,
          ...meta
        },
        idempotency_key
      })
      .select('id')
      .single();

    if (ledgerError) {
      console.error('Failed to insert ledger entry:', ledgerError);
      // Cancel the redemption
      await supabase
        .from('rewards_redemptions')
        .update({ status: 'cancelled' })
        .eq('id', redemption.id);
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create ledger entry' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Update wallet balance
    const newBalance = wallet.balance - cost;
    const newLifetimeSpent = wallet.lifetime_spent + cost;

    const { error: walletUpdateError } = await supabase
      .from('rewards_wallets')
      .update({
        balance: newBalance,
        lifetime_spent: newLifetimeSpent,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id);

    if (walletUpdateError) {
      console.error('Failed to update wallet:', walletUpdateError);
      // Cancel everything
      await supabase.from('rewards_redemptions').update({ status: 'cancelled' }).eq('id', redemption.id);
      // Note: ledger entry remains for audit - marked as failed in production
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update wallet balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Update daily totals
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyTotals } = await supabase
      .from('rewards_daily_user_totals')
      .select('total_earned, total_spent')
      .eq('user_id', user_id)
      .eq('date', today)
      .single();

    await supabase
      .from('rewards_daily_user_totals')
      .upsert({
        user_id,
        date: today,
        total_earned: dailyTotals?.total_earned || 0,
        total_spent: (dailyTotals?.total_spent || 0) + cost
      }, {
        onConflict: 'user_id,date'
      });

    // 10. Update stock if applicable
    if (storeItem.stock !== null) {
      await supabase
        .from('rewards_store_items')
        .update({ stock: storeItem.stock - 1 })
        .eq('code', item_code);
    }

    // 11. Mark redemption as completed
    await supabase
      .from('rewards_redemptions')
      .update({ status: 'completed' })
      .eq('id', redemption.id);

    const response: DebitResponse = {
      success: true,
      redemption_id: redemption.id,
      ledger_id: ledgerEntry.id,
      new_balance: newBalance
    };

    console.log(`Debit successful: user=${user_id}, item=${item_code}, cost=${cost}, new_balance=${newBalance}`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in rewards-debit:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
