import { supabase } from '@/lib/supabaseClient';

const MIN_SUGGESTION_LENGTH = 2;
const DEFAULT_USER_LIMIT = 5;
const DEFAULT_TAG_LIMIT = 5;

function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
}

function normalizeTagValue(value) {
    return normalizeText(String(value || '').replace(/^#/, ''));
}

function escapeLike(value) {
    return String(value || '')
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
}

function dedupeBy(items, getKey) {
    const seen = new Set();
    const result = [];

    for (const item of items || []) {
        const key = getKey(item);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        result.push(item);
    }

    return result;
}

function rankUsernameMatch(username, query) {
    const normalizedUsername = normalizeText(username);
    const normalizedQuery = normalizeText(query);

    if (!normalizedUsername || !normalizedQuery) return Number.POSITIVE_INFINITY;

    if (normalizedUsername === normalizedQuery) return 0;
    if (normalizedUsername.startsWith(normalizedQuery)) return 1;

    const index = normalizedUsername.indexOf(normalizedQuery);
    if (index >= 0) return 10 + index;

    return Number.POSITIVE_INFINITY;
}

function rankTagMatch(tagName, query) {
    const normalizedTag = normalizeTagValue(tagName);
    const normalizedQuery = normalizeTagValue(query);

    if (!normalizedTag || !normalizedQuery) return Number.POSITIVE_INFINITY;

    if (normalizedTag === normalizedQuery) return 0;
    if (normalizedTag.startsWith(normalizedQuery)) return 1;

    const index = normalizedTag.indexOf(normalizedQuery);
    if (index >= 0) return 10 + index;

    return Number.POSITIVE_INFINITY;
}

function postMatchesText(item, submittedText) {
    const q = normalizeText(submittedText);
    if (!q) return true;

    const title = normalizeText(item?.title);
    const caption = normalizeText(item?.caption);
    const craftType = normalizeText(item?.craftType);
    const tags = Array.isArray(item?.tags) ? item.tags.map(normalizeTagValue) : [];

    return (
        title.includes(q) ||
        caption.includes(q) ||
        craftType.includes(q) ||
        tags.some((tag) => tag.includes(q))
    );
}

function postMatchesSelectedTags(item, submittedTags) {
    const normalizedSelectedTags = dedupeBy(
        (submittedTags || []).map((tag) => normalizeTagValue(tag)).filter(Boolean),
        (tag) => tag
    );

    if (!normalizedSelectedTags.length) return true;

    const postTags = Array.isArray(item?.tags)
        ? item.tags.map((tag) => normalizeTagValue(tag)).filter(Boolean)
        : [];

    if (!postTags.length) return false;

    return normalizedSelectedTags.some((selectedTag) => postTags.includes(selectedTag));
}

export async function getUserSuggestions(query, options = {}) {
    const trimmedQuery = String(query || '').trim();
    const normalizedQuery = normalizeText(trimmedQuery);
    const limit = options.limit ?? DEFAULT_USER_LIMIT;

    if (!supabase || normalizedQuery.length < MIN_SUGGESTION_LENGTH) {
        return [];
    }

    const likeValue = `%${escapeLike(normalizedQuery)}%`;

    const { data, error } = await supabase
        .from('users')
        .select('user_id, username, display_name, avatar_url')
        .ilike('username', likeValue)
        .limit(Math.max(limit * 3, 15));

    if (error) throw error;

    return (data || [])
        .filter((user) => normalizeText(user.username).includes(normalizedQuery))
        .map((user) => ({
            id: String(user.user_id),
            username: user.username || '',
            displayName: user.display_name || '',
            avatarUrl: user.avatar_url || null,
            rank: rankUsernameMatch(user.username, normalizedQuery),
        }))
        .filter((user) => Number.isFinite(user.rank))
        .sort((a, b) => {
            if (a.rank !== b.rank) return a.rank - b.rank;
            return normalizeText(a.username).localeCompare(normalizeText(b.username));
        })
        .slice(0, limit)
        .map(({ rank, ...user }) => user);
}

export async function getTagSuggestions(query, excludedTags = [], options = {}) {
    const trimmedQuery = String(query || '').trim();
    const normalizedQuery = normalizeTagValue(trimmedQuery);
    const limit = options.limit ?? DEFAULT_TAG_LIMIT;

    if (!supabase || normalizedQuery.length < MIN_SUGGESTION_LENGTH) {
        return [];
    }

    const excluded = new Set(
        (excludedTags || []).map((tag) => normalizeTagValue(tag)).filter(Boolean)
    );

    const likeValue = `%${escapeLike(normalizedQuery)}%`;

    const { data, error } = await supabase
        .from('tags')
        .select('tag_id, name, slug')
        .ilike('name', likeValue)
        .limit(Math.max(limit * 3, 15));

    if (error) throw error;

    return (data || [])
        .map((tag) => {
            const name = String(tag.name || '').trim();
            const slug = normalizeTagValue(tag.slug || tag.name);
            return {
                id: String(tag.tag_id),
                name,
                slug,
                rank: rankTagMatch(name, normalizedQuery),
            };
        })
        .filter((tag) => {
            if (!tag.name || !Number.isFinite(tag.rank)) return false;
            if (excluded.has(tag.slug)) return false;
            return true;
        })
        .sort((a, b) => {
            if (a.rank !== b.rank) return a.rank - b.rank;
            return normalizeTagValue(a.name).localeCompare(normalizeTagValue(b.name));
        })
        .slice(0, limit)
        .map(({ rank, ...tag }) => tag);
}

export function filterPostsBySearch(posts, submittedText = '', submittedTags = []) {
    const safePosts = Array.isArray(posts) ? posts : [];
    const hasText = !!normalizeText(submittedText);
    const normalizedSelectedTags = dedupeBy(
        (submittedTags || []).map((tag) => normalizeTagValue(tag)).filter(Boolean),
        (tag) => tag
    );
    const hasTags = normalizedSelectedTags.length > 0;

    if (!hasText && !hasTags) {
        return safePosts;
    }

    return safePosts.filter((item) => {
        const matchesText = postMatchesText(item, submittedText);
        const matchesTags = postMatchesSelectedTags(item, normalizedSelectedTags);
        return matchesText && matchesTags;
    });
}

export function shouldShowSuggestions(query) {
    return normalizeText(query).length >= MIN_SUGGESTION_LENGTH;
}

export function normalizeSelectedTag(tag) {
    return normalizeTagValue(tag);
}