import { supabase } from '@/lib/supabaseClient';

function normalizeTag(value) {
    return String(value || '')
        .trim()
        .replace(/^#/, '')
        .toLowerCase();
}

function uniqueNormalizedTags(values = []) {
    return [...new Set(values.map(normalizeTag).filter(Boolean))];
}

export async function syncPostTags(postId, rawTags = [], craftType = '') {
    if (!supabase) {
        throw new Error('Supabase is not configured.');
    }

    if (!postId) {
        throw new Error('Missing postId for tag sync.');
    }

    const normalizedTags = uniqueNormalizedTags([
        ...(Array.isArray(rawTags) ? rawTags : []),
        craftType,
    ]);

    if (!normalizedTags.length) {
        return [];
    }

    const upsertRows = normalizedTags.map((tag) => ({
        name: tag,
        slug: tag,
    }));

    const { error: upsertError } = await supabase
        .from('tags')
        .upsert(upsertRows, { onConflict: 'slug' });

    if (upsertError) {
        throw upsertError;
    }

    const { data: insertedTags, error: fetchTagsError } = await supabase
        .from('tags')
        .select('tag_id, name, slug')
        .in('slug', normalizedTags);

    if (fetchTagsError) {
        throw fetchTagsError;
    }

    const postTagRows = (insertedTags || []).map((tag) => ({
        post_id: postId,
        tag_id: tag.tag_id,
    }));

    if (postTagRows.length) {
        const { error: postTagsError } = await supabase
            .from('post_tags')
            .upsert(postTagRows, { onConflict: 'post_id,tag_id' });

        if (postTagsError) {
            throw postTagsError;
        }
    }

    return insertedTags || [];
}