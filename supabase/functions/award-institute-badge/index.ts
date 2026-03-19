import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await adminSupabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_id, certification_id } = await req.json();

    // Verify the requesting user matches
    if (user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!user_id || !certification_id) {
      return new Response(JSON.stringify({ error: 'user_id and certification_id are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Get all course_ids for this certification
    const { data: certCourses, error: certError } = await adminSupabase
      .from('institute_certification_courses')
      .select('course_id')
      .eq('certification_id', certification_id);

    if (certError) throw certError;
    if (!certCourses || certCourses.length === 0) {
      return new Response(JSON.stringify({ error: 'No courses found for this certification' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const courseIds = certCourses.map(c => c.course_id).filter(Boolean) as string[];

    // 2. Check all enrollments are completed
    const { data: enrollments, error: enrollError } = await adminSupabase
      .from('institute_enrollments')
      .select('course_id, completed_at')
      .eq('user_id', user_id)
      .in('course_id', courseIds);

    if (enrollError) throw enrollError;

    const enrollmentMap = new Map((enrollments || []).map(e => [e.course_id, e]));
    const incompleteCourseIds: string[] = [];

    for (const cid of courseIds) {
      const enrollment = enrollmentMap.get(cid);
      if (!enrollment || !enrollment.completed_at) {
        incompleteCourseIds.push(cid);
      }
    }

    if (incompleteCourseIds.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        reason: 'courses_incomplete',
        remaining_course_ids: incompleteCourseIds,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Check if badge already exists
    const { data: existingBadge } = await adminSupabase
      .from('institute_badges')
      .select('*')
      .eq('user_id', user_id)
      .eq('certification_id', certification_id)
      .maybeSingle();

    if (existingBadge) {
      return new Response(JSON.stringify({
        success: true,
        badge: existingBadge,
        already_awarded: true,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 4. Insert new badge
    const { data: newBadge, error: badgeError } = await adminSupabase
      .from('institute_badges')
      .insert({ user_id, certification_id })
      .select()
      .single();

    if (badgeError) throw badgeError;

    // Update all related enrollments assessment_passed
    await adminSupabase
      .from('institute_enrollments')
      .update({ assessment_passed: true })
      .eq('user_id', user_id)
      .in('course_id', courseIds);

    return new Response(JSON.stringify({
      success: true,
      badge: newBadge,
      already_awarded: false,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('award-institute-badge error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
