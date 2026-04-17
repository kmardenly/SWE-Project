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

async function normalizePost(post, media = []) {
  const parsed = parseContent(post?.content);
  const orderedMedia = [...(media || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const firstImage = orderedMedia.find((m) => m.media_type === 'image')?.media_url ?? null;

  return {
    id: String(post.post_id),
    creatorId: post.creator_id,
    title: parsed.title?.trim() || 'Untitled craft',
    craftType: parsed.craftType?.trim() || 'Craft',
    caption: parsed.caption?.trim() || '',
    tags: Array.isArray(parsed.tags) ? parsed.tags.filter(Boolean) : [],
    imageUrl: await resolveMediaUrl(firstImage),
    createdAt: post.created_at ?? null,
  };
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

  // React Native on iOS/Android cannot reliably fetch blob: URLs for <Image>.
  // Ignore them on native so the UI falls back to a placeholder instead of crashing.
  if (value.startsWith('blob:') && Platform.OS !== 'web') {
    return null;
  }

  // file:// URLs point to local device storage and are not shareable across users/devices.
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

  // Already renderable by React Native Image.
  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('file://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:')
  ) {
    return encodeURI(value);
  }

  // Stored as "bucket/path/to/file.jpg".
  const slashIndex = value.indexOf('/');
  if (slashIndex > 0 && supabase) {
    const bucket = value.slice(0, slashIndex);
    const objectPath = value.slice(slashIndex + 1);
    if (bucket && objectPath) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
      if (data?.publicUrl) return encodeURI(data.publicUrl);
    }
  }

  // Stored as "/storage/v1/object/public/bucket/path" (relative path).
  if (value.startsWith('/storage/v1/object/public/')) {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
    if (supabaseUrl) return encodeURI(`${supabaseUrl}${value}`);
  }

  // Last resort: return value as-is.
  return encodeURI(value);
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

  const postIds = posts.map((p) => p.post_id);
  const { data: mediaRows, error: mediaError } = await supabase
    .from('post_media')
    .select('post_id, media_url, media_type, "order"')
    .in('post_id', postIds);

  if (mediaError) throw mediaError;

  const mediaByPost = (mediaRows || []).reduce((acc, row) => {
    const key = String(row.post_id);
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  return Promise.all(
    posts.map((post) => normalizePost(post, mediaByPost[String(post.post_id)] || []))
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

  const { data: mediaRows, error: mediaError } = await supabase
    .from('post_media')
    .select('post_id, media_url, media_type, "order"')
    .eq('post_id', post.post_id);

  if (mediaError) throw mediaError;

  return await normalizePost(post, mediaRows || []);
}
