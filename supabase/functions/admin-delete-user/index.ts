import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DeleteUserRequest {
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the request is from an authenticated admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roles, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roles) {
      throw new Error("Not authorized - admin only");
    }

    const { userId }: DeleteUserRequest = await req.json();

    if (!userId) {
      throw new Error("User ID is required");
    }

    console.log(`Starting deletion process for user: ${userId}`);

    // Step 1: Set author_id/created_by to NULL to retain content
    // This preserves posts, comments, worship sets, and calendar events

    // Update community_posts - set author_id to null
    const { error: postsError } = await supabaseAdmin
      .from("community_posts")
      .update({ author_id: null })
      .eq("author_id", userId);
    
    if (postsError) {
      console.error("Error updating community_posts:", postsError);
    }

    // Update post_comments - set author_id to null
    const { error: commentsError } = await supabaseAdmin
      .from("post_comments")
      .update({ author_id: null })
      .eq("author_id", userId);
    
    if (commentsError) {
      console.error("Error updating post_comments:", commentsError);
    }

    // Update service_sets - set created_by to null
    const { error: setsError } = await supabaseAdmin
      .from("service_sets")
      .update({ created_by: null })
      .eq("created_by", userId);
    
    if (setsError) {
      console.error("Error updating service_sets:", setsError);
    }

    // Update calendar_events - set created_by to null
    const { error: eventsError } = await supabaseAdmin
      .from("calendar_events")
      .update({ created_by: null })
      .eq("created_by", userId);
    
    if (eventsError) {
      console.error("Error updating calendar_events:", eventsError);
    }

    // Step 2: Delete user-specific data that should not be retained

    // Delete from community_members (removes user from all communities)
    const { error: membersError } = await supabaseAdmin
      .from("community_members")
      .delete()
      .eq("user_id", userId);
    
    if (membersError) {
      console.error("Error deleting community_members:", membersError);
    }

    // Delete from set_collaborators
    const { error: collaboratorsError } = await supabaseAdmin
      .from("set_collaborators")
      .delete()
      .eq("user_id", userId);
    
    if (collaboratorsError) {
      console.error("Error deleting set_collaborators:", collaboratorsError);
    }

    // Delete from set_comments
    const { error: setCommentsError } = await supabaseAdmin
      .from("set_comments")
      .delete()
      .eq("user_id", userId);
    
    if (setCommentsError) {
      console.error("Error deleting set_comments:", setCommentsError);
    }

    // Delete from post_likes
    const { error: likesError } = await supabaseAdmin
      .from("post_likes")
      .delete()
      .eq("user_id", userId);
    
    if (likesError) {
      console.error("Error deleting post_likes:", likesError);
    }

    // Delete from user_favorite_songs
    const { error: favoritesError } = await supabaseAdmin
      .from("user_favorite_songs")
      .delete()
      .eq("user_id", userId);
    
    if (favoritesError) {
      console.error("Error deleting user_favorite_songs:", favoritesError);
    }

    // Delete from notifications
    const { error: notificationsError } = await supabaseAdmin
      .from("notifications")
      .delete()
      .eq("user_id", userId);
    
    if (notificationsError) {
      console.error("Error deleting notifications:", notificationsError);
    }

    // Delete from worship_leader_applications
    const { error: applicationsError } = await supabaseAdmin
      .from("worship_leader_applications")
      .delete()
      .eq("user_id", userId);
    
    if (applicationsError) {
      console.error("Error deleting worship_leader_applications:", applicationsError);
    }

    // Delete from worship_leader_profiles
    const { error: profilesError } = await supabaseAdmin
      .from("worship_leader_profiles")
      .delete()
      .eq("user_id", userId);
    
    if (profilesError) {
      console.error("Error deleting worship_leader_profiles:", profilesError);
    }

    console.log(`User data cleanup completed for user: ${userId}`);

    // Step 3: Delete user using admin API (will cascade delete profiles and user_roles)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      throw deleteError;
    }

    console.log(`User ${userId} deleted successfully`);

    return new Response(
      JSON.stringify({ success: true, message: "User deleted successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in admin-delete-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
