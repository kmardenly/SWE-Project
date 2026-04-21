import { supabase } from '@/lib/supabaseClient';
import { Platform } from 'react-native';

function parseContent(content) {
  if (typeof content !== 'string' || !content.trim()) return {};
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeTagText(value) {
  return String(value || '').trim().replace(/^#/, '');
}

function dedupeTagStrings(values) {
  const seen = new Set();
  const result = [];

  for (const value of values || []) {
    const normalized = normalizeTagText(value);
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function normalizeTagObjects(tags) {
  const seen = new Set();
  const result = [];

  for (const tag of tags || []) {
    const id = tag?.id != null ? String(tag.id) : '';
    const name = normalizeTagText(tag?.name);
    const slug = normalizeTagText(tag?.slug || tag?.name).toLowerCase();

    if (!name) continue;

    const key = id || slug || name.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push({
      id,
      name,
      slug,
    });
  }

  return result;
}

async function fetchNormalizedTagsByPostIds(postIds) {
  const safePostIds = [...new Set((postIds || []).filter(Boolean))];
  const tagsByPostId = new Map();

  safePostIds.forEach((postId) => {
    tagsByPostId.set(String(postId), []);
  });

  if (!supabase || !safePostIds.length) return tagsByPostId;

  const { data: postTagRows, error: postTagError } = await supabase
      .from('post_tags')
      .select('post_id, tag_id')
      .in('post_id', safePostIds);

  if (postTagError) throw postTagError;
  if (!postTagRows?.length) return tagsByPostId;

  const tagIds = [...new Set(postTagRows.map((row) => row.tag_id).filter(Boolean))];
  if (!tagIds.length) return tagsByPostId;

  const { data: tagRows, error: tagError } = await supabase
      .from('tags')
      .select('tag_id, name, slug')
      .in('tag_id', tagIds);

  if (tagError) throw tagError;

  const tagsById = new Map(
      (tagRows || []).map((tag) => [
        tag.tag_id,
        {
          id: tag.tag_id,
          name: tag.name,
          slug: tag.slug,
        },
      ])
  );

  for (const row of postTagRows) {
    const postId = String(row.post_id);
    const tag = tagsById.get(row.tag_id);
    if (!tag) continue;

    const existing = tagsByPostId.get(postId) || [];
    existing.push(tag);
    tagsByPostId.set(postId, existing);
  }

  for (const [postId, tags] of tagsByPostId.entries()) {
    tagsByPostId.set(postId, normalizeTagObjects(tags));
  }

  return tagsByPostId;
}

async function normalizePost(post, media = [], dbTags = []) {
  const parsed = parseContent(post?.content);
  const orderedMedia = [...(media || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const firstImage = orderedMedia.find((m) => m.media_type === 'image')?.media_url ?? null;
  const creator = post?.users || null;

  const parsedTags = Array.isArray(parsed.tags) ? parsed.tags.filter(Boolean) : [];
  const normalizedDbTags = normalizeTagObjects(dbTags);
  const mergedTagNames = dedupeTagStrings([
    ...normalizedDbTags.map((tag) => tag.name),
    ...parsedTags,
  ]);

  return {
    id: String(post.post_id),
    creatorId: post.creator_id,
    creatorUsername: creator?.username || '',
    creatorDisplayName: creator?.display_name || '',
    creatorAvatarUrl: creator?.avatar_url || null,
    title: parsed.title?.trim() || 'Untitled craft',
    craftType: parsed.craftType?.trim() || 'Craft',
    caption: parsed.caption?.trim() || '',
    tags: mergedTagNames,
    tagObjects: normalizedDbTags,
    imageUrl: await resolveMediaUrl(firstImage),
    createdAt: post.created_at ?? null,
  };
}

async function attachCreatorProfiles(posts) {
  const safePosts = Array.isArray(posts) ? posts : [];
  if (!safePosts.length || !supabase) return safePosts;

  const creatorIds = [...new Set(safePosts.map((p) => p.creator_id).filter(Boolean))];
  if (!creatorIds.length) return safePosts;

  const { data: users, error } = await supabase
      .from('users')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', creatorIds);

  if (error) throw error;

  const usersById = new Map((users || []).map((u) => [u.user_id, u]));
  return safePosts.map((post) => ({
    ...post,
    users: usersById.get(post.creator_id) || null,
  }));
}

function parseBucketAndPath(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return null;

  const storagePathPattern = /\/storage\/v1\/object\/(?:public|authenticated|sign)\/([^/?#]+)\/([^?#]+)/;
  const storageMatch = normalized.match(storagePathPattern);
  if (storageMatch) {
    const bucket = storageMatch[1];
    const objectPath = decodeURIComponent(storageMatch[2]);
    if (bucket && objectPath) return { bucket, objectPath };
  }

  const slashIndex = normalized.indexOf('/');
  if (slashIndex > 0) {
    const bucket = normalized.slice(0, slashIndex);
    const objectPath = normalized.slice(slashIndex + 1);
    if (bucket && objectPath && !bucket.includes(':')) {
      return { bucket, objectPath };
    }
  }

  return null;
}

async function resolveMediaUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  const value = rawUrl.trim();
  if (!value) return null;

  if (value.startsWith('blob:') && Platform.OS !== 'web') {
    return null;
  }

  if (value.startsWith('file://') && Platform.OS !== 'web') {
    return null;
  }

  const storageLocation = parseBucketAndPath(value);
  if (storageLocation && supabase) {
    const { bucket, objectPath } = storageLocation;

    const { data: signedData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(objectPath, 60 * 60);

    if (signedData?.signedUrl) return encodeURI(signedData.signedUrl);

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    if (publicData?.publicUrl) return encodeURI(publicData.publicUrl);
  }

  if (
      value.startsWith('http://') ||
      value.startsWith('https://') ||
      value.startsWith('file://') ||
      value.startsWith('data:') ||
      value.startsWith('blob:')
  ) {
    return encodeURI(value);
  }

  const slashIndex = value.indexOf('/');
  if (slashIndex > 0 && supabase) {
    const bucket = value.slice(0, slashIndex);
    const objectPath = value.slice(slashIndex + 1);
    if (bucket && objectPath) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
      if (data?.publicUrl) return encodeURI(data.publicUrl);
    }
  }

  if (value.startsWith('/storage/v1/object/public/')) {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
    if (supabaseUrl) return encodeURI(`${supabaseUrl}${value}`);
  }

  return encodeURI(value);
}

async function fetchMediaByPostIds(postIds) {
  const safePostIds = [...new Set((postIds || []).filter(Boolean))];
  if (!supabase || !safePostIds.length) return {};

  const { data: mediaRows, error: mediaError } = await supabase
      .from('post_media')
      .select('post_id, media_url, media_type, "order"')
      .in('post_id', safePostIds);

  if (mediaError) throw mediaError;

  return (mediaRows || []).reduce((acc, row) => {
    const key = String(row.post_id);
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});
}

export async function fetchExploreItems() {
  if (!supabase) return [];

  const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('post_id, creator_id, content, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

  if (postsError) throw postsError;
  if (!posts?.length) return [];

  const postsWithUsers = await attachCreatorProfiles(posts);
  const postIds = postsWithUsers.map((p) => p.post_id);

  const [mediaByPost, tagsByPost] = await Promise.all([
    fetchMediaByPostIds(postIds),
    fetchNormalizedTagsByPostIds(postIds),
  ]);

  return Promise.all(
      postsWithUsers.map((post) =>
          normalizePost(
              post,
              mediaByPost[String(post.post_id)] || [],
              tagsByPost.get(String(post.post_id)) || []
          )
      )
  );
}

export async function fetchExploreItemById(id) {
  if (!supabase || !id) return null;

  const { data: post, error: postError } = await supabase
      .from('posts')
      .select('post_id, creator_id, content, created_at, deleted_at')
      .eq('post_id', id)
      .single();

  if (postError) throw postError;
  if (!post || post.deleted_at) return null;

  const [[postWithUser], mediaByPost, tagsByPost] = await Promise.all([
    attachCreatorProfiles([post]),
    fetchMediaByPostIds([post.post_id]),
    fetchNormalizedTagsByPostIds([post.post_id]),
  ]);

  return normalizePost(
      postWithUser,
      mediaByPost[String(post.post_id)] || [],
      tagsByPost.get(String(post.post_id)) || []
  );
}

export async function fetchPostsByCreatorId(creatorId) {
  if (!supabase || !creatorId) return [];

  const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('post_id, creator_id, content, created_at')
      .eq('creator_id', creatorId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

  if (postsError) throw postsError;
  if (!posts?.length) return [];

  const postsWithUsers = await attachCreatorProfiles(posts);
  const postIds = postsWithUsers.map((p) => p.post_id);

  const [mediaByPost, tagsByPost] = await Promise.all([
    fetchMediaByPostIds(postIds),
    fetchNormalizedTagsByPostIds(postIds),
  ]);

  return Promise.all(
      postsWithUsers.map((post) =>
          normalizePost(
              post,
              mediaByPost[String(post.post_id)] || [],
              tagsByPost.get(String(post.post_id)) || []
          )
      )
  );
}

export async function getPostLikeSummary(postId, userId) {
  if (!supabase || !postId) {
    return { likeCount: 0, likedByCurrentUser: false };
  }

  const [{ count, error: countError }, { data: likedRow, error: likedError }] = await Promise.all([
    supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId),
    userId
        ? supabase
            .from('post_likes')
            .select('like_id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
  ]);

  if (countError) throw countError;
  if (likedError) throw likedError;

  return {
    likeCount: count || 0,
    likedByCurrentUser: !!likedRow,
  };
}

export async function setPostLike(postId, userId, shouldLike) {
  if (!supabase || !postId || !userId) {
    throw new Error('Missing post or user information for like action.');
  }

  if (shouldLike) {
    const { data: existingRow, error: existingError } = await supabase
        .from('post_likes')
        .select('like_id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

    if (existingError) throw existingError;
    if (existingRow) return;

    const { error: insertError } = await supabase
        .from('post_likes')
        .insert([{ post_id: postId, user_id: userId }]);

    if (insertError) throw insertError;
    return;
  }

  const { error: deleteError } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

  if (deleteError) throw deleteError;
}

export async function getPostComments(postId) {
  if (!supabase || !postId) return [];

  const { data: rows, error } = await supabase
      .from('post_comments')
      .select('comment_id, post_id, user_id, content, created_at')
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

  if (error) throw error;
  if (!rows?.length) return [];

  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];
  const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', userIds);

  if (usersError) throw usersError;

  const usersById = new Map((users || []).map((u) => [u.user_id, u]));

  return rows.map((row) => {
    const author = usersById.get(row.user_id);
    return {
      id: row.comment_id,
      postId: row.post_id,
      userId: row.user_id,
      content: row.content || '',
      createdAt: row.created_at,
      username: author?.username || '',
      displayName: author?.display_name || '',
      avatarUrl: author?.avatar_url || null,
    };
  });
}

export async function createPostComment(postId, userId, content) {
  if (!supabase || !postId || !userId) {
    throw new Error('Missing post or user information for comment.');
  }

  const trimmed = String(content || '').trim();
  if (!trimmed) throw new Error('Comment cannot be empty.');

  const { data: inserted, error } = await supabase
      .from('post_comments')
      .insert([{ post_id: postId, user_id: userId, content: trimmed }])
      .select('comment_id, post_id, user_id, content, created_at')
      .single();

  if (error) throw error;

  const { data: author, error: authorError } = await supabase
      .from('users')
      .select('user_id, username, display_name, avatar_url')
      .eq('user_id', userId)
      .maybeSingle();

  if (authorError) throw authorError;

  return {
    id: inserted.comment_id,
    postId: inserted.post_id,
    userId: inserted.user_id,
    content: inserted.content || '',
    createdAt: inserted.created_at,
    username: author?.username || '',
    displayName: author?.display_name || '',
    avatarUrl: author?.avatar_url || null,
  };
}

export async function fetchSavedPostsByUserId(userId) {
  if (!supabase || !userId) return [];

  const { data: bookmarks, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('post_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

  if (bookmarksError) throw bookmarksError;
  if (!bookmarks?.length) return [];

  const postIds = bookmarks.map((row) => row.post_id);
  const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('post_id, creator_id, content, created_at, deleted_at')
      .in('post_id', postIds)
      .is('deleted_at', null);

  if (postsError) throw postsError;
  if (!posts?.length) return [];

  const postsWithUsers = await attachCreatorProfiles(posts);

  const [mediaByPost, tagsByPost] = await Promise.all([
    fetchMediaByPostIds(postIds),
    fetchNormalizedTagsByPostIds(postIds),
  ]);

  const normalized = await Promise.all(
      postsWithUsers.map((post) =>
          normalizePost(
              post,
              mediaByPost[String(post.post_id)] || [],
              tagsByPost.get(String(post.post_id)) || []
          )
      )
  );

  const bookmarkOrder = new Map(bookmarks.map((row, index) => [String(row.post_id), index]));
  return normalized.sort((a, b) => (bookmarkOrder.get(a.id) ?? 0) - (bookmarkOrder.get(b.id) ?? 0));
}

export async function getPostSavedByUser(postId, userId) {
  if (!supabase || !postId || !userId) return false;

  const { data, error } = await supabase
      .from('bookmarks')
      .select('bookmark_id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function setPostSaved(postId, userId, shouldSave) {
  if (!supabase || !postId || !userId) {
    throw new Error('Missing post or user information for save action.');
  }

  if (shouldSave) {
    const { data: existing, error: existingError } = await supabase
        .from('bookmarks')
        .select('bookmark_id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

    if (existingError) throw existingError;
    if (existing) return;

    const { error: insertError } = await supabase
        .from('bookmarks')
        .insert([{ post_id: postId, user_id: userId }]);

    if (insertError) throw insertError;
    return;
  }

  const { error: deleteError } = await supabase
      .from('bookmarks')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

  if (deleteError) throw deleteError;
}

export async function deletePostById(postId, userId) {
  if (!supabase || !postId || !userId) {
    throw new Error('Missing post or user information for delete action.');
  }

  const { data: post, error: readError } = await supabase
    .from('posts')
    .select('post_id, creator_id, deleted_at')
    .eq('post_id', postId)
    .maybeSingle();
  if (readError) throw readError;
  if (!post) throw new Error('Post not found.');
  if (post.creator_id !== userId) {
    throw new Error('You can only delete your own posts.');
  }
  if (post.deleted_at) return;

  const { error: updateError } = await supabase
    .from('posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('post_id', postId)
    .eq('creator_id', userId);
  if (updateError) throw updateError;
}