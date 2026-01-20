import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    // Parse request body
    const { applicationId, profileUpdates } = await req.json();
    
    if (!applicationId) {
      return new Response(
        JSON.stringify({ error: 'Application ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client for bypassing RLS
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verify the application belongs to the user
    const { data: application, error: appError } = await serviceClient
      .from('worship_leader_applications')
      .select('id, user_id, church_name')
      .eq('id', applicationId)
      .eq('user_id', userId)
      .single();

    if (appError || !application) {
      return new Response(
        JSON.stringify({ error: 'Application not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check if worship_leader role already exists
    const { data: existingRole } = await serviceClient
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'worship_leader')
      .maybeSingle();

    // 3. Add worship_leader role if not exists
    if (!existingRole) {
      const { error: roleError } = await serviceClient
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'worship_leader',
        });

      if (roleError) {
        console.error('Failed to insert role:', roleError);
        return new Response(
          JSON.stringify({ error: 'Failed to add worship leader role' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 4. Update application status to approved (using service role to bypass RLS)
    const { error: updateError } = await serviceClient
      .from('worship_leader_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Failed to update application:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update application status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Update profile with application data if provided
    if (profileUpdates && Object.keys(profileUpdates).length > 0) {
      await serviceClient
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Worship leader application approved',
        churchName: application.church_name 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auto-approve error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
