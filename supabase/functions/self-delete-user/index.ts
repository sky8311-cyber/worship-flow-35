import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CommunityOwnershipInfo {
  communityId: string;
  communityName: string;
  action: "transfer" | "delete";
  newOwnerName?: string;
  newOwnerId?: string;
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

    // Verify the request is from the authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const userId = user.id;
    console.log(`Starting self-deletion process for user: ${userId}`);

    // Parse request body for optional preview mode
    let previewOnly = false;
    try {
      const body = await req.json();
      previewOnly = body?.previewOnly === true;
    } catch {
      // No body or invalid JSON, proceed with deletion
    }

    // Step 1: Handle community ownership transfer/deletion
    const communityResults: CommunityOwnershipInfo[] = [];
    
    // Find communities where user is owner
    const { data: ownedCommunities, error: ownedError } = await supabaseAdmin
      .from("community_members")
      .select("community_id, worship_communities(id, name)")
      .eq("user_id", userId)
      .eq("role", "owner");

    if (ownedError) {
      console.error("Error fetching owned communities:", ownedError);
    }

    if (ownedCommunities && ownedCommunities.length > 0) {
      for (const membership of ownedCommunities) {
        const communityId = membership.community_id;
        const communityName = (membership.worship_communities as any)?.name || "Unknown";

        // Find the oldest member who is not the current user
        const { data: otherMembers, error: membersError } = await supabaseAdmin
          .from("community_members")
          .select("user_id, joined_at")
          .eq("community_id", communityId)
          .neq("user_id", userId)
          .order("joined_at", { ascending: true })
          .limit(1);

        if (membersError) {
          console.error(`Error fetching members for community ${communityId}:`, membersError);
          continue;
        }

        if (otherMembers && otherMembers.length > 0) {
          // Transfer ownership to oldest member
          const newOwnerId = otherMembers[0].user_id;
          
          // Fetch profile info separately (no FK relationship between community_members and profiles)
          const { data: profileData } = await supabaseAdmin
            .from("profiles")
            .select("full_name")
            .eq("id", newOwnerId)
            .single();
          
          const newOwnerName = profileData?.full_name || "Unknown Member";

          communityResults.push({
            communityId,
            communityName,
            action: "transfer",
            newOwnerId,
            newOwnerName,
          });

          if (!previewOnly) {
            // Update community_members: set new owner role
            const { error: updateMemberError } = await supabaseAdmin
              .from("community_members")
              .update({ role: "owner" })
              .eq("community_id", communityId)
              .eq("user_id", newOwnerId);

            if (updateMemberError) {
              console.error(`Error updating member role for ${communityId}:`, updateMemberError);
            }

            // Update worship_communities: set leader_id
            const { error: updateCommunityError } = await supabaseAdmin
              .from("worship_communities")
              .update({ leader_id: newOwnerId })
              .eq("id", communityId);

            if (updateCommunityError) {
              console.error(`Error updating community leader for ${communityId}:`, updateCommunityError);
            }

            console.log(`Transferred ownership of ${communityName} to ${newOwnerName}`);
          }
        } else {
          // No other members, mark for deletion
          communityResults.push({
            communityId,
            communityName,
            action: "delete",
          });

          if (!previewOnly) {
            // Delete the community (CASCADE will handle related data)
            const { error: deleteCommunityError } = await supabaseAdmin
              .from("worship_communities")
              .delete()
              .eq("id", communityId);

            if (deleteCommunityError) {
              console.error(`Error deleting community ${communityId}:`, deleteCommunityError);
            } else {
              console.log(`Deleted community ${communityName} (no other members)`);
            }
          }
        }
      }
    }

    // If preview only, return the community info without deleting
    if (previewOnly) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          previewOnly: true,
          communityActions: communityResults 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Step 2: Handle songs
    // Delete private songs
    const { error: deletePrivateSongsError } = await supabaseAdmin
      .from("songs")
      .delete()
      .eq("created_by", userId)
      .eq("is_private", true);

    if (deletePrivateSongsError) {
      console.error("Error deleting private songs:", deletePrivateSongsError);
    } else {
      console.log("Deleted private songs");
    }

    // Set created_by to null for public songs
    const { error: updatePublicSongsError } = await supabaseAdmin
      .from("songs")
      .update({ created_by: null })
      .eq("created_by", userId);

    if (updatePublicSongsError) {
      console.error("Error updating public songs:", updatePublicSongsError);
    } else {
      console.log("Updated public songs (created_by → null)");
    }

    // Step 3: Set attribution to null for content that should be preserved
    // Update service_sets - set created_by to null
    const { error: setsError } = await supabaseAdmin
      .from("service_sets")
      .update({ created_by: null })
      .eq("created_by", userId);

    if (setsError) {
      console.error("Error updating service_sets:", setsError);
    }

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

    // Update calendar_events - set created_by to null
    const { error: eventsError } = await supabaseAdmin
      .from("calendar_events")
      .update({ created_by: null })
      .eq("created_by", userId);

    if (eventsError) {
      console.error("Error updating calendar_events:", eventsError);
    }

    // Update worship_set_templates - set created_by to null
    const { error: templatesError } = await supabaseAdmin
      .from("worship_set_templates")
      .update({ created_by: null })
      .eq("created_by", userId);

    if (templatesError) {
      console.error("Error updating worship_set_templates:", templatesError);
    }

    // Step 4: Delete user-specific data
    // Delete from community_members
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

    // Delete from community_join_requests
    const { error: joinRequestsError } = await supabaseAdmin
      .from("community_join_requests")
      .delete()
      .eq("user_id", userId);

    if (joinRequestsError) {
      console.error("Error deleting community_join_requests:", joinRequestsError);
    }

    // Delete from church_account_members
    const { error: churchMembersError } = await supabaseAdmin
      .from("church_account_members")
      .delete()
      .eq("user_id", userId);

    if (churchMembersError) {
      console.error("Error deleting church_account_members:", churchMembersError);
    }

    // Delete from team_rotation_members
    const { error: rotationMembersError } = await supabaseAdmin
      .from("team_rotation_members")
      .delete()
      .eq("user_id", userId);

    if (rotationMembersError) {
      console.error("Error deleting team_rotation_members:", rotationMembersError);
    }

    // Delete from worship_set_signups
    const { error: signupsError } = await supabaseAdmin
      .from("worship_set_signups")
      .delete()
      .eq("user_id", userId);

    if (signupsError) {
      console.error("Error deleting worship_set_signups:", signupsError);
    }

    // Delete seed-related data
    const { error: seedAchievementsError } = await supabaseAdmin
      .from("seed_achievements")
      .delete()
      .eq("user_id", userId);

    if (seedAchievementsError) {
      console.error("Error deleting seed_achievements:", seedAchievementsError);
    }

    const { error: seedDailyCapsError } = await supabaseAdmin
      .from("seed_daily_caps")
      .delete()
      .eq("user_id", userId);

    if (seedDailyCapsError) {
      console.error("Error deleting seed_daily_caps:", seedDailyCapsError);
    }

    const { error: seedTransactionsError } = await supabaseAdmin
      .from("seed_transactions")
      .delete()
      .eq("user_id", userId);

    if (seedTransactionsError) {
      console.error("Error deleting seed_transactions:", seedTransactionsError);
    }

    const { error: userSeedsError } = await supabaseAdmin
      .from("user_seeds")
      .delete()
      .eq("user_id", userId);

    if (userSeedsError) {
      console.error("Error deleting user_seeds:", userSeedsError);
    }

    // Update church_role_assignments - set assigned_by to null if this user assigned roles
    const { error: roleAssignmentsError } = await supabaseAdmin
      .from("church_role_assignments")
      .update({ assigned_by: null })
      .eq("assigned_by", userId);

    if (roleAssignmentsError) {
      console.error("Error updating church_role_assignments:", roleAssignmentsError);
    }

    // Delete church_role_assignments where user has roles
    const { error: deleteRoleAssignmentsError } = await supabaseAdmin
      .from("church_role_assignments")
      .delete()
      .eq("user_id", userId);

    if (deleteRoleAssignmentsError) {
      console.error("Error deleting church_role_assignments:", deleteRoleAssignmentsError);
    }

    // Update community_invitations - set invited_by to null
    const { error: invitationsError } = await supabaseAdmin
      .from("community_invitations")
      .update({ invited_by: null } as any)
      .eq("invited_by", userId);

    if (invitationsError) {
      console.error("Error updating community_invitations:", invitationsError);
    }

    console.log(`User data cleanup completed for user: ${userId}`);

    // Step 5: Delete user using admin API (will cascade delete profiles and user_roles)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      throw deleteError;
    }

    console.log(`User ${userId} deleted successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account deleted successfully",
        communityActions: communityResults
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in self-delete-user function:", error);
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
