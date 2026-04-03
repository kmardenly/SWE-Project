const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend environment');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function slugifyTag(tagName) {
    return tagName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

async function getOrCreateTags(tagNames) {
    if (!tagNames.length) return [];

    const normalizedNames = [...new Set(tagNames.map((tag) => tag.trim()))];

    const { data: existingTags, error: existingError } = await supabase
        .from('tags')
        .select('tag_id, name, slug')
        .in('name', normalizedNames);

    if (existingError) {
        throw new Error(`Failed to fetch existing tags: ${existingError.message}`);
    }

    const existingByName = new Map(
        (existingTags || []).map((tag) => [tag.name, tag])
    );

    const missingNames = normalizedNames.filter((name) => !existingByName.has(name));

    let insertedTags = [];
    if (missingNames.length) {
        const rowsToInsert = missingNames.map((name) => ({
            name,
            slug: slugifyTag(name),
        }));

        const { data: newTags, error: insertTagsError } = await supabase
            .from('tags')
            .insert(rowsToInsert)
            .select('tag_id, name, slug');

        if (insertTagsError) {
            throw new Error(`Failed to create tags: ${insertTagsError.message}`);
        }

        insertedTags = newTags || [];
    }

    return [...(existingTags || []), ...insertedTags];
}

async function createPostService(payload) {
    const { creatorId, title, caption, craftType, tags, media } = payload;

    // Temporary mapping because current posts table only has "content"
    const content = JSON.stringify({
        title,
        caption,
        craftType,
    });

    const { data: createdPost, error: postError } = await supabase
        .from('posts')
        .insert([
            {
                creator_id: creatorId,
                content,
            },
        ])
        .select()
        .single();

    if (postError) {
        throw new Error(`Failed to create post: ${postError.message}`);
    }

    const postId = createdPost.post_id;

    const { error: postDataError } = await supabase
        .from('post_data')
        .insert([
            {
                post_id: postId,
                like_count: 0,
                comment_count: 0,
                share_count: 0,
                view_count: 0,
            },
        ]);

    if (postDataError) {
        throw new Error(`Failed to create post_data row: ${postDataError.message}`);
    }

    if (media.length) {
        const mediaRows = media.map((item) => ({
            post_id: postId,
            media_url: item.mediaUrl,
            media_type: item.mediaType,
            width: item.width ?? null,
            height: item.height ?? null,
            order: item.order ?? 0,
        }));

        const { error: mediaError } = await supabase
            .from('post_media')
            .insert(mediaRows);

        if (mediaError) {
            throw new Error(`Failed to create post media: ${mediaError.message}`);
        }
    }

    if (tags.length) {
        const tagRecords = await getOrCreateTags(tags);

        const postTagRows = tagRecords.map((tag) => ({
            post_id: postId,
            tag_id: tag.tag_id,
        }));

        const { error: postTagsError } = await supabase
            .from('post_tags')
            .insert(postTagRows);

        if (postTagsError) {
            throw new Error(`Failed to attach tags: ${postTagsError.message}`);
        }
    }

    return {
        postId,
        creatorId,
        title,
        caption,
        craftType,
        tags,
        media,
        createdAt: createdPost.created_at,
    };
}

module.exports = {
    createPostService,
};