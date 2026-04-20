import { supabase } from '@/lib/supabaseClient';

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

/**
 * Returns a displayable URL for an avatar stored in Supabase Storage or an absolute URL.
 */
export async function resolveAvatarUrl(rawUrl) {
  const value = String(rawUrl || '').trim();
  if (!value) return '';

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  const location = parseBucketAndPath(value);
  if (!location || !supabase) return value;

  const { bucket, objectPath } = location;
  const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 60 * 60);

  if (signedData?.signedUrl) return signedData.signedUrl;

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  if (publicData?.publicUrl) return publicData.publicUrl;

  return value;
}
