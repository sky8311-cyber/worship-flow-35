import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LockActionRequest {
  action: 'request_takeover' | 'cancel_takeover' | 'respond_takeover' | 'force_takeover' | 'release_lock' | 'update_last_saved'
  set_id: string
  session_id: string
  user_id?: string
  user_name?: string
  device?: string
  accept?: boolean // for respond_takeover
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // 1. Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[set-edit-lock-action] Missing or invalid Authorization header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user's auth token to validate
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
      console.error('[set-edit-lock-action] Auth validation failed:', claimsError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authenticatedUserId = claimsData.claims.sub as string
    console.log(`[set-edit-lock-action] Authenticated user: ${authenticatedUserId}`)

    // Admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const body: LockActionRequest = await req.json()
    const { action, set_id, session_id, user_name, device, accept } = body

    console.log(`[set-edit-lock-action] Action: ${action}, Set: ${set_id}, Session: ${session_id}, User: ${authenticatedUserId}`)

    if (!set_id || !session_id) {
      return new Response(
        JSON.stringify({ error: 'Missing set_id or session_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Verify user has access to this set
    const { data: setData, error: setError } = await supabaseAdmin
      .from('service_sets')
      .select('id, created_by, community_id, status')
      .eq('id', set_id)
      .single()

    if (setError || !setData) {
      console.error('[set-edit-lock-action] Set not found:', setError)
      return new Response(
        JSON.stringify({ error: 'Set not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has access to this set
    const isCreator = setData.created_by === authenticatedUserId
    
    // Check collaborator access
    const { data: collabData } = await supabaseAdmin
      .from('set_collaborators')
      .select('id')
      .eq('service_set_id', set_id)
      .eq('user_id', authenticatedUserId)
      .maybeSingle()
    const isCollaborator = !!collabData

    // Check community membership
    const { data: memberData } = await supabaseAdmin
      .from('community_members')
      .select('id, role')
      .eq('community_id', setData.community_id)
      .eq('user_id', authenticatedUserId)
      .maybeSingle()
    const isCommunityMember = !!memberData
    const isCommunityLeader = memberData?.role === 'community_leader' || memberData?.role === 'owner'

    const hasAccess = isCreator || isCollaborator || isCommunityLeader || 
                      (isCommunityMember && setData.status === 'published')

    if (!hasAccess) {
      console.error('[set-edit-lock-action] Access denied for user:', authenticatedUserId)
      return new Response(
        JSON.stringify({ error: 'Forbidden: No access to this set' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current lock state
    const { data: currentLock, error: fetchError } = await supabaseAdmin
      .from('set_edit_locks')
      .select('*')
      .eq('set_id', set_id)
      .maybeSingle()

    if (fetchError) {
      console.error('[set-edit-lock-action] Error fetching lock:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch lock state' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use authenticated user ID instead of trusting client-supplied user_id

    let result: { success: boolean; message: string; data?: any } = { success: false, message: 'Unknown action' }

    switch (action) {
      case 'request_takeover': {
        if (!currentLock) {
          result = { success: false, message: 'No lock exists to request takeover' }
          break
        }
        
        // Update takeover request fields
        const { error: updateError } = await supabaseAdmin
          .from('set_edit_locks')
          .update({
            takeover_requested_by: authenticatedUserId,
            takeover_requested_at: new Date().toISOString(),
            takeover_requester_name: user_name || 'Unknown'
          })
          .eq('set_id', set_id)

        if (updateError) {
          console.error('[set-edit-lock-action] Error updating takeover request:', updateError)
          result = { success: false, message: 'Failed to request takeover' }
        } else {
          console.log('[set-edit-lock-action] Takeover request recorded')
          result = { success: true, message: 'Takeover requested' }
        }
        break
      }

      case 'cancel_takeover': {
        if (!currentLock) {
          result = { success: false, message: 'No lock exists' }
          break
        }

        // Only the requester can cancel their own request
        if (currentLock.takeover_requested_by !== authenticatedUserId) {
          result = { success: false, message: 'Only the requester can cancel' }
          break
        }

        const { error: updateError } = await supabaseAdmin
          .from('set_edit_locks')
          .update({
            takeover_requested_by: null,
            takeover_requested_at: null,
            takeover_requester_name: null
          })
          .eq('set_id', set_id)

        if (updateError) {
          console.error('[set-edit-lock-action] Error canceling takeover:', updateError)
          result = { success: false, message: 'Failed to cancel takeover' }
        } else {
          result = { success: true, message: 'Takeover cancelled' }
        }
        break
      }

      case 'respond_takeover': {
        if (!currentLock) {
          result = { success: false, message: 'No lock exists' }
          break
        }

        // Only the lock holder can respond
        if (currentLock.holder_session_id !== session_id) {
          result = { success: false, message: 'Only the current editor can respond' }
          break
        }

        if (accept) {
          // Hand over - delete the lock so requester can acquire it
          const { error: deleteError } = await supabaseAdmin
            .from('set_edit_locks')
            .delete()
            .eq('set_id', set_id)

          if (deleteError) {
            console.error('[set-edit-lock-action] Error releasing lock:', deleteError)
            result = { success: false, message: 'Failed to hand over' }
          } else {
            console.log('[set-edit-lock-action] Lock released for handover')
            result = { success: true, message: 'Lock handed over' }
          }
        } else {
          // Decline - clear takeover request fields
          const { error: updateError } = await supabaseAdmin
            .from('set_edit_locks')
            .update({
              takeover_requested_by: null,
              takeover_requested_at: null,
              takeover_requester_name: null
            })
            .eq('set_id', set_id)

          if (updateError) {
            console.error('[set-edit-lock-action] Error declining takeover:', updateError)
            result = { success: false, message: 'Failed to decline' }
          } else {
            result = { success: true, message: 'Takeover declined' }
          }
        }
        break
      }

      case 'force_takeover': {
        if (!currentLock) {
          result = { success: false, message: 'No lock exists' }
          break
        }

        const now = new Date()
        const requestedAt = currentLock.takeover_requested_at ? new Date(currentLock.takeover_requested_at) : null
        const expiresAt = new Date(currentLock.expires_at)
        const lastActivity = new Date(currentLock.last_activity_at)
        
        // Allow force takeover if:
        // 1. Lock is expired
        // 2. Takeover was requested 10+ seconds ago
        // 3. Last activity was 30+ seconds ago (stale session)
        const lockExpired = now > expiresAt
        const takeoverTimeout = requestedAt && (now.getTime() - requestedAt.getTime() > 10000)
        const staleSession = (now.getTime() - lastActivity.getTime() > 30000)

        console.log(`[set-edit-lock-action] Force takeover check: expired=${lockExpired}, takeoverTimeout=${takeoverTimeout}, stale=${staleSession}`)

        if (!lockExpired && !takeoverTimeout && !staleSession) {
          result = { success: false, message: 'Cannot force takeover yet - wait for timeout or expiry' }
          break
        }

        // Force takeover - replace the lock holder
        const newExpiry = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes
        const { error: updateError } = await supabaseAdmin
          .from('set_edit_locks')
          .update({
            holder_user_id: authenticatedUserId,
            holder_session_id: session_id,
            holder_name: user_name || 'Unknown',
            holder_device: device || null,
            acquired_at: now.toISOString(),
            expires_at: newExpiry.toISOString(),
            last_activity_at: now.toISOString(),
            takeover_requested_by: null,
            takeover_requested_at: null,
            takeover_requester_name: null
          })
          .eq('set_id', set_id)

        if (updateError) {
          console.error('[set-edit-lock-action] Error forcing takeover:', updateError)
          result = { success: false, message: 'Failed to force takeover' }
        } else {
          console.log('[set-edit-lock-action] Force takeover successful')
          result = { success: true, message: 'Takeover successful' }
        }
        break
      }

      case 'release_lock': {
        if (!currentLock) {
          result = { success: true, message: 'No lock to release' }
          break
        }

        // Only release if this session holds the lock
        if (currentLock.holder_session_id !== session_id) {
          result = { success: false, message: 'This session does not hold the lock' }
          break
        }

        const { error: deleteError } = await supabaseAdmin
          .from('set_edit_locks')
          .delete()
          .eq('set_id', set_id)
          .eq('holder_session_id', session_id)

        if (deleteError) {
          console.error('[set-edit-lock-action] Error releasing lock:', deleteError)
          result = { success: false, message: 'Failed to release lock' }
        } else {
          console.log('[set-edit-lock-action] Lock released')
          result = { success: true, message: 'Lock released' }
        }
        break
      }

      case 'update_last_saved': {
        if (!currentLock || currentLock.holder_session_id !== session_id) {
          result = { success: false, message: 'Not the lock holder' }
          break
        }

        const { error: updateError } = await supabaseAdmin
          .from('set_edit_locks')
          .update({
            last_saved_at: new Date().toISOString()
          })
          .eq('set_id', set_id)
          .eq('holder_session_id', session_id)

        if (updateError) {
          console.error('[set-edit-lock-action] Error updating last_saved:', updateError)
          result = { success: false, message: 'Failed to update' }
        } else {
          result = { success: true, message: 'Updated' }
        }
        break
      }
    }

    return new Response(
      JSON.stringify(result),
      { status: result.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[set-edit-lock-action] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
