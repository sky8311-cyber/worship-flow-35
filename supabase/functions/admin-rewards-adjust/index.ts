import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdjustRequest {
  user_id: string;
  direction: 'credit' | 'debit';
  amount: number;
  reason: string;
  meta?: Record<string, unknown>;
  override_caps?: boolean;
}

interface AdjustResponse {
  success: boolean;
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
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify admin status
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: adminRole } = await supabaseUser
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Now use service role for the actual operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: AdjustRequest = await req.json();
    const { user_id, direction, amount, reason, meta = {}, override_caps = false } = body;

    // Validate required fields
    if (!user_id || !direction || !amount || !reason) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: user_id, direction, amount, reason' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['credit', 'debit'].includes(direction)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Direction must be credit or debit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Amount must be positive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get settings for cap checks
    const { data: settings } = await supabase
      .from('rewards_settings')
      .select('*')
      .eq('id', 1)
      .single();

    // Check max_single_tx_amount unless overridden
    if (!override_caps && settings && amount > settings.max_single_tx_amount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Amount ${amount} exceeds max single tx amount ${settings.max_single_tx_amount}. Use override_caps=true to bypass.` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create wallet
    const { data: wallet, error: walletError } = await supabase
      .rpc('get_or_create_rewards_wallet', { p_user_id: user_id });

    if (walletError) {
      console.error('Failed to get wallet:', walletError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get wallet' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For debits, check sufficient balance
    if (direction === 'debit' && wallet.balance < amount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Insufficient balance. Required: ${amount}, Available: ${wallet.balance}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate idempotency key for admin adjustments
    const idempotency_key = `admin_${user.id}_${user_id}_${direction}_${amount}_${Date.now()}`;

    const reason_code = direction === 'credit' ? 'admin_manual_credit' : 'admin_manual_debit';

    // Insert ledger entry
    const { data: ledgerEntry, error: ledgerError } = await supabase
      .from('rewards_ledger')
      .insert({
        user_id,
        direction,
        amount,
        reason_code,
        ref_type: 'admin',
        ref_id: user.id, // Admin user ID
        meta: {
          ...meta,
          reason,
          admin_id: user.id,
          admin_email: user.email,
          override_caps
        },
        created_by: user.id,
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

    // Calculate new balance and lifetime values
    let newBalance: number;
    let updates: Record<string, unknown>;

    if (direction === 'credit') {
      newBalance = wallet.balance + amount;
      updates = {
        balance: newBalance,
        lifetime_earned: wallet.lifetime_earned + amount,
        updated_at: new Date().toISOString()
      };
    } else {
      newBalance = wallet.balance - amount;
      updates = {
        balance: newBalance,
        lifetime_spent: wallet.lifetime_spent + amount,
        updated_at: new Date().toISOString()
      };
    }

    // Update wallet
    const { error: walletUpdateError } = await supabase
      .from('rewards_wallets')
      .update(updates)
      .eq('user_id', user_id);

    if (walletUpdateError) {
      console.error('Failed to update wallet:', walletUpdateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update wallet balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update daily totals
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyTotals } = await supabase
      .from('rewards_daily_user_totals')
      .select('total_earned, total_spent')
      .eq('user_id', user_id)
      .eq('date', today)
      .single();

    const dailyUpdates = {
      user_id,
      date: today,
      total_earned: (dailyTotals?.total_earned || 0) + (direction === 'credit' ? amount : 0),
      total_spent: (dailyTotals?.total_spent || 0) + (direction === 'debit' ? amount : 0)
    };

    await supabase
      .from('rewards_daily_user_totals')
      .upsert(dailyUpdates, { onConflict: 'user_id,date' });

    // Log the admin action
    console.log(`Admin adjust: admin=${user.email}, target=${user_id}, direction=${direction}, amount=${amount}, reason=${reason}, override=${override_caps}`);

    const response: AdjustResponse = {
      success: true,
      ledger_id: ledgerEntry.id,
      new_balance: newBalance
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in admin-rewards-adjust:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
