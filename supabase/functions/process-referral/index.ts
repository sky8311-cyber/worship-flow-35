import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessReferralRequest {
  referralCode: string;
  referredUserId: string;
  source?: 'link' | 'email';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { referralCode, referredUserId, source = 'link' }: ProcessReferralRequest = await req.json();

    console.log(`Processing referral: code=${referralCode}, referredUserId=${referredUserId}, source=${source}`);

    if (!referralCode || !referredUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Find the referrer by referral code
    const { data: referrer, error: referrerError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (referrerError || !referrer) {
      console.log('Invalid referral code:', referralCode);
      return new Response(
        JSON.stringify({ error: 'Invalid referral code', success: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get referred user's email for self-referral check
    const { data: referredUser, error: referredUserError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', referredUserId)
      .single();

    if (referredUserError || !referredUser) {
      console.log('Referred user not found:', referredUserId);
      return new Response(
        JSON.stringify({ error: 'Referred user not found', success: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Block self-referral
    if (referrer.id === referredUserId) {
      console.log('Self-referral blocked');
      return new Response(
        JSON.stringify({ error: 'Self-referral not allowed', success: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Check if referred user already has a referral (first-touch only)
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', referredUserId)
      .single();

    if (existingReferral) {
      console.log('User already has a referral');
      return new Response(
        JSON.stringify({ error: 'User already referred', success: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Find matching email invite if exists
    let inviteId = null;
    if (referredUser.email) {
      const { data: invite } = await supabase
        .from('referral_invites')
        .select('id')
        .eq('inviter_id', referrer.id)
        .eq('email', referredUser.email.toLowerCase())
        .eq('status', 'sent')
        .single();
      
      if (invite) {
        inviteId = invite.id;
      }
    }

    // 6. Get reward amount from rewards_rules
    const { data: rewardRule } = await supabase
      .from('rewards_rules')
      .select('amount')
      .eq('code', 'invited_user_signed_up')
      .eq('enabled', true)
      .single();

    const rewardAmount = rewardRule?.amount || 100; // Default 100 if no rule

    // 7. Create the referral record
    const { data: referralRecord, error: referralError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: referredUserId,
        source: inviteId ? 'email' : source,
        invite_id: inviteId,
        reward_issued: false,
        reward_amount: rewardAmount
      })
      .select()
      .single();

    if (referralError) {
      console.error('Error creating referral:', referralError);
      return new Response(
        JSON.stringify({ error: 'Failed to create referral', success: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Issue K-Seed reward to referrer via rewards-credit function
    try {
      const rewardResponse = await fetch(`${supabaseUrl}/functions/v1/rewards-credit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          user_id: referrer.id,
          reason_code: 'invited_user_signed_up',
          ref_type: 'referral',
          ref_id: referralRecord.id,
          idempotency_key: `referral_signup_${referralRecord.id}`,
          meta: {
            referred_user_id: referredUserId,
            source: inviteId ? 'email' : source
          }
        }),
      });

      if (rewardResponse.ok) {
        // Update referral record to mark reward as issued
        await supabase
          .from('referrals')
          .update({ reward_issued: true })
          .eq('id', referralRecord.id);
        
        console.log('Reward issued successfully');
      } else {
        console.error('Reward issuance failed:', await rewardResponse.text());
      }
    } catch (rewardError) {
      console.error('Error issuing reward:', rewardError);
    }

    // 9. Update referral_invite status if applicable
    if (inviteId) {
      await supabase
        .from('referral_invites')
        .update({ 
          status: 'joined',
          referred_id: referredUserId,
          joined_at: new Date().toISOString()
        })
        .eq('id', inviteId);
    }

    console.log('Referral processed successfully');
    return new Response(
      JSON.stringify({ 
        success: true, 
        referralId: referralRecord.id,
        rewardAmount 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing referral:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
