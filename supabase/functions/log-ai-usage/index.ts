import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_ACTION_TYPES = ['set_generation', 'institute_coach'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, action_type } = await req.json();

    if (!user_id || !action_type) {
      return new Response(
        JSON.stringify({ error: 'user_id and action_type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!VALID_ACTION_TYPES.includes(action_type)) {
      return new Response(
        JSON.stringify({ error: `Invalid action_type. Must be one of: ${VALID_ACTION_TYPES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert into ai_usage_log
    const { error: logError } = await supabase
      .from('ai_usage_log')
      .insert({ user_id, action_type });

    if (logError) {
      console.error('Failed to insert usage log:', logError);
      return new Response(
        JSON.stringify({ error: 'Failed to log usage', details: logError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert ai_usage_summary
    const { error: summaryError } = await supabase
      .from('ai_usage_summary')
      .upsert(
        {
          user_id,
          total_uses: 1,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    // If upsert worked but didn't increment, do a raw increment
    if (!summaryError) {
      await supabase.rpc('increment_ai_usage', { p_user_id: user_id });
    } else {
      console.error('Failed to upsert usage summary:', summaryError);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('log-ai-usage error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
