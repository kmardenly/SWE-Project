import { supabase } from '@/lib/supabase';

function mapJoinedUser(item, joinedUser, fallbackUserId) {
    return {
        user_id: joinedUser?.user_id || fallbackUserId,
        first_name: joinedUser?.first_name || '',
        last_name: joinedUser?.last_name || '',
        bio: joinedUser?.bio || '',
        created_at: item.created_at,
    };
}

export function getDisplayName(person) {
    const fullName = `${person?.first_name || ''} ${person?.last_name || ''}`.trim();
    return fullName || 'Crafter';
}

export async function getFollowersCount(userId) {
    const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('followed_id', userId);

    if (error) throw error;
    return count || 0;
}

export async function getFollowingCount(userId) {
    const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

    if (error) throw error;
    return count || 0;
}

export async function getFollowersList(userId) {
    const { data, error } = await supabase
        .from('follows')
        .select(`
      follower_id,
      created_at,
      users!follows_follower_id_fkey (
        user_id,
        first_name,
        last_name,
        bio
      )
    `)
        .eq('followed_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item) =>
        mapJoinedUser(item, item.users, item.follower_id)
    );
}

export async function getFollowingList(userId) {
    const { data, error } = await supabase
        .from('follows')
        .select(`
      followed_id,
      created_at,
      users!follows_followed_id_fkey (
        user_id,
        first_name,
        last_name,
        bio
      )
    `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item) =>
        mapJoinedUser(item, item.users, item.followed_id)
    );
}

export async function isFollowing(currentUserId, targetUserId) {
    const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', currentUserId)
        .eq('followed_id', targetUserId)
        .maybeSingle();

    if (error) throw error;
    return !!data;
}

export async function followUser(currentUserId, targetUserId) {
    if (!currentUserId || !targetUserId) {
        throw new Error('Missing user ids');
    }

    if (currentUserId === targetUserId) {
        throw new Error('You cannot follow yourself');
    }

    const { error } = await supabase
        .from('follows')
        .insert({
            follower_id: currentUserId,
            followed_id: targetUserId,
        });

    if (error) throw error;
    return true;
}

export async function unfollowUser(currentUserId, targetUserId) {
    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('followed_id', targetUserId);

    if (error) throw error;
    return true;
}

export async function removeFollower(currentUserId, followerUserId) {
    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerUserId)
        .eq('followed_id', currentUserId);

    if (error) throw error;
    return true;
}

export async function getUserProfile(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('user_id, first_name, last_name, bio')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data;
}