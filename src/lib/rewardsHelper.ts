import { supabase } from "@/integrations/supabase/client";

export interface CreditRewardParams {
  user_id: string;
  reason_code: string;
  ref_type: string;
  ref_id?: string;
  meta?: Record<string, unknown>;
}

export interface CreditRewardResult {
  success: boolean;
  ledger_id?: string;
  new_balance?: number;
  error?: string;
  skipped?: boolean;
  skip_reason?: string;
}

/**
 * Credit K-Seeds to a user for a specific action
 * This function is fire-and-forget - it won't throw errors
 * and is designed to be called without blocking the main flow
 */
export async function creditReward(params: CreditRewardParams): Promise<CreditRewardResult> {
  try {
    // Generate idempotency key based on user, action, and ref
    const idempotencyKey = `${params.user_id}_${params.reason_code}_${params.ref_id || 'no-ref'}_${Date.now()}`;

    const { data, error } = await supabase.functions.invoke('rewards-credit', {
      body: {
        ...params,
        idempotency_key: idempotencyKey
      }
    });

    if (error) {
      console.error('Reward credit error:', error);
      return { success: false, error: error.message };
    }

    if (data?.success) {
      console.log(`K-Seed reward credited: ${params.reason_code}, amount: ${data.new_balance}`);
    } else if (data?.skipped) {
      console.log(`K-Seed reward skipped: ${params.reason_code}, reason: ${data.skip_reason}`);
    }

    return data as CreditRewardResult;
  } catch (err) {
    console.error('Unexpected error crediting reward:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Credit reward for inviter when a user accepts an invitation
 */
export async function creditInviterReward(inviterId: string, inviteeName?: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: inviterId,
    reason_code: 'invited_user_signed_up',
    ref_type: 'user',
    meta: { invitee_name: inviteeName }
  });
}

/**
 * Credit reward for creating a new worship set
 */
export async function creditSetCreatedReward(userId: string, setId: string, setName?: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'set_created',
    ref_type: 'worship_set',
    ref_id: setId,
    meta: { set_name: setName }
  });
}

/**
 * Credit reward for publishing a worship set
 */
export async function creditSetPublishedReward(userId: string, setId: string, setName?: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'set_published',
    ref_type: 'worship_set',
    ref_id: setId,
    meta: { set_name: setName }
  });
}

/**
 * Credit reward for adding a new song to library
 */
export async function creditSongAddedReward(userId: string, songId: string, songTitle?: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'song_added_to_library',
    ref_type: 'song',
    ref_id: songId,
    meta: { song_title: songTitle }
  });
}

/**
 * Credit reward for completing all song metadata
 */
export async function creditSongMetadataCompleteReward(userId: string, songId: string, songTitle?: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'song_metadata_complete',
    ref_type: 'song',
    ref_id: songId,
    meta: { song_title: songTitle }
  });
}

/**
 * Credit reward for first community post
 */
export async function creditFirstCommunityPostReward(userId: string, communityId: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'first_community_post',
    ref_type: 'community',
    ref_id: communityId
  });
}

/**
 * Credit reward for reaching 10 community posts milestone
 */
export async function creditCommunityPosts10MilestoneReward(userId: string, communityId: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'community_posts_10_milestone',
    ref_type: 'community',
    ref_id: communityId
  });
}

/**
 * Check if song has complete metadata for bonus reward
 */
export function isSongMetadataComplete(song: {
  title?: string | null;
  default_key?: string | null;
  lyrics?: string | null;
  youtube_url?: string | null;
  category?: string | null;
  language?: string | null;
  score_file_url?: string | null;
}): boolean {
  return !!(
    song.title &&
    song.default_key &&
    song.lyrics &&
    song.youtube_url &&
    song.category &&
    song.language &&
    song.score_file_url
  );
}

// ============================================
// Profile & Onboarding Rewards
// ============================================

/**
 * Credit reward for adding profile photo (one-time)
 */
export async function creditProfilePhotoReward(userId: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'profile_photo_added',
    ref_type: 'profile',
    ref_id: userId
  });
}

/**
 * Credit reward for adding bio (one-time)
 */
export async function creditProfileBioReward(userId: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'profile_bio_added',
    ref_type: 'profile',
    ref_id: userId
  });
}

/**
 * Credit reward for completing all profile fields (one-time)
 */
export async function creditProfileCompleteReward(userId: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'profile_complete',
    ref_type: 'profile',
    ref_id: userId
  });
}

/**
 * Credit reward for adding cover photo (one-time)
 */
export async function creditCoverPhotoReward(userId: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'cover_photo_added',
    ref_type: 'profile',
    ref_id: userId
  });
}

/**
 * Credit reward for joining first community (one-time)
 */
export async function creditFirstCommunityJoinReward(userId: string, communityId: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'first_community_join',
    ref_type: 'community',
    ref_id: communityId
  });
}

// ============================================
// Team Member Activity Rewards
// ============================================

/**
 * Credit reward for viewing a worship set (with cooldown per set)
 */
export async function creditSetViewedReward(userId: string, setId: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'set_viewed',
    ref_type: 'worship_set',
    ref_id: setId
  });
}

/**
 * Credit reward for opening Band View (with cooldown per set)
 */
export async function creditBandViewOpenedReward(userId: string, setId: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'bandview_opened',
    ref_type: 'worship_set',
    ref_id: setId
  });
}

/**
 * Credit reward for downloading sheet music (with cooldown per song)
 */
export async function creditScoreDownloadedReward(userId: string, songId: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'score_downloaded',
    ref_type: 'song',
    ref_id: songId
  });
}

/**
 * Credit reward for signing up for a team position (one-time per set)
 */
export async function creditPositionSignupReward(userId: string, setId: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'position_signup',
    ref_type: 'worship_set',
    ref_id: setId
  });
}

// ============================================
// Community Engagement Rewards
// ============================================

/**
 * Credit reward for sending a chat message (with cooldown)
 */
export async function creditChatMessageReward(userId: string, communityId: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'chat_message_sent',
    ref_type: 'community',
    ref_id: communityId
  });
}

/**
 * Credit reward for liking a post
 */
export async function creditPostLikedReward(userId: string, postId: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'post_liked',
    ref_type: 'post',
    ref_id: postId
  });
}

/**
 * Credit reward for commenting on a post (with cooldown)
 */
export async function creditPostCommentReward(userId: string, postId: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'post_comment',
    ref_type: 'post',
    ref_id: postId
  });
}

/**
 * Credit reward for creating a welcome post (one-time per welcomed user)
 */
export async function creditWelcomePostReward(userId: string, welcomedUserId: string): Promise<CreditRewardResult> {
  return creditReward({
    user_id: userId,
    reason_code: 'welcome_post_created',
    ref_type: 'user',
    ref_id: welcomedUserId
  });
}

// ============================================
// Daily Engagement Rewards
// ============================================

/**
 * Credit reward for daily login (once per day)
 */
export async function creditDailyLoginReward(userId: string): Promise<CreditRewardResult> {
  const today = new Date().toISOString().split('T')[0];
  return creditReward({
    user_id: userId,
    reason_code: 'daily_login',
    ref_type: 'login',
    ref_id: today
  });
}
