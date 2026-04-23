import { GROUP_CHATS, getGroupChatById } from '@/constants/groupChats';
import { supabase } from '@/lib/supabaseClient';
import { resolveAvatarUrl } from '@/lib/resolveAvatarUrl';

/** Matches Postgres uuid text form so we skip Supabase for mock ids like `big-cats`. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeRouteChatId(raw) {
  if (raw == null) return '';
  const v = Array.isArray(raw) ? raw[0] : raw;
  return String(v ?? '').trim();
}

export function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value.trim());
}

function parseMessageContent(raw) {
  const fallback = { text: String(raw || ''), image: null, editedAt: null };
  if (typeof raw !== 'string') return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        text: String(parsed.text || ''),
        image: parsed.image || null,
        editedAt: parsed.editedAt || null,
      };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function serializeMessageContent(text, image, editedAt = null) {
  return JSON.stringify({
    text: String(text || ''),
    image: image || null,
    editedAt: editedAt || null,
  });
}

function parseGroupMetadata(rawDescription) {
  const fallback = {
    description: String(rawDescription || ''),
    image: null,
  };
  if (typeof rawDescription !== 'string' || !rawDescription.trim()) return fallback;
  try {
    const parsed = JSON.parse(rawDescription);
    if (parsed && typeof parsed === 'object') {
      return {
        description: String(parsed.description || ''),
        image: parsed.image || null,
      };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function serializeGroupMetadata(description, image) {
  return JSON.stringify({
    description: String(description || ''),
    image: image || null,
  });
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

async function resolveGroupImageUrl(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;

  const location = parseBucketAndPath(value);
  if (location && supabase) {
    const { bucket, objectPath } = location;
    const { data: signedData } = await supabase.storage
      .from(bucket)
      .createSignedUrl(objectPath, 60 * 60);
    if (signedData?.signedUrl) return signedData.signedUrl;

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    if (publicData?.publicUrl) return publicData.publicUrl;
  }

  return value;
}

async function getUserMap(userIds) {
  if (!supabase || !userIds?.length) return new Map();
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueIds.length) return new Map();

  const { data, error } = await supabase
    .from('users')
    .select('user_id, username, display_name, avatar_url')
    .in('user_id', uniqueIds);
  if (error) throw error;
  return new Map((data || []).map((row) => [row.user_id, row]));
}

async function ensureGeneralChannel(groupId) {
  if (!supabase || !groupId) return null;
  const { data: created, error } = await supabase
    .from('group_channels')
    .insert([{ group_id: groupId, name: 'general', description: '' }])
    .select('channel_id, name, created_at')
    .single();
  if (!error) return created;

  const { data: existing } = await supabase
    .from('group_channels')
    .select('channel_id, name, created_at')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing) return existing;

  console.warn('[groupChats] ensureGeneralChannel:', error.message);
  return null;
}

async function fetchUnreadCountsByChannelIds(channelIds) {
  const map = new Map();
  if (!supabase || !channelIds?.length) {
    return map;
  }
  const { data, error } = await supabase.rpc('get_group_unread_counts', {
    p_channel_ids: channelIds,
  });
  if (error) {
    console.warn('[groupChats] get_group_unread_counts:', error.message);
    return map;
  }
  for (const row of data || []) {
    if (row?.channel_id != null) {
      map.set(String(row.channel_id), Number(row.unread_count) || 0);
    }
  }
  return map;
}

/**
 * Marks the channel as read through the latest message (or now if empty).
 * Call when the user opens a group / DM chat.
 */
export async function markGroupChannelAsRead(userId, channelId) {
  if (!supabase || !userId || !channelId) {
    return;
  }
  const { data: lastRow, error: lastErr } = await supabase
    .from('group_messages')
    .select('created_at')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastErr) {
    console.warn('[groupChats] markGroupChannelAsRead last message:', lastErr.message);
    return;
  }
  const lastRead = lastRow?.created_at || new Date().toISOString();
  const { error } = await supabase.from('group_channel_read_state').upsert(
    {
      user_id: userId,
      channel_id: channelId,
      last_read_at: lastRead,
    },
    { onConflict: 'user_id,channel_id' }
  );
  if (error) {
    console.warn('[groupChats] markGroupChannelAsRead upsert:', error.message);
  }
}

/**
 * Marks a channel as unread by moving read state to epoch.
 * This makes every existing message count as unread.
 */
export async function markGroupChannelAsUnread(userId, channelId) {
  if (!supabase || !userId || !channelId) {
    return;
  }
  const { error } = await supabase.from('group_channel_read_state').upsert(
    {
      user_id: userId,
      channel_id: channelId,
      last_read_at: '1970-01-01T00:00:00.000Z',
    },
    { onConflict: 'user_id,channel_id' }
  );
  if (error) {
    console.warn('[groupChats] markGroupChannelAsUnread upsert:', error.message);
  }
}

export async function fetchGroupChats(currentUserId) {
  if (!supabase) return GROUP_CHATS;

  try {
  if (!currentUserId) return GROUP_CHATS;

  const { data: memberships, error: membershipsError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', currentUserId);
  if (membershipsError) throw membershipsError;
  const membershipIds = new Set((memberships || []).map((row) => row.group_id));
  if (!membershipIds.size) return GROUP_CHATS;

  const { data: allGroups, error: groupsError } = await supabase
    .from('groups')
    .select('group_id, name, description, updated_at')
    .order('updated_at', { ascending: false });
  if (groupsError) throw groupsError;

  const groups = allGroups || [];
  const visibleGroups = groups.filter((group) => membershipIds.has(group.group_id));
  const groupIds = visibleGroups.map((group) => group.group_id);
  if (!groupIds.length) return GROUP_CHATS;

  const { data: memberRows, error: memberRowsError } = await supabase
    .from('group_members')
    .select('group_id, user_id')
    .in('group_id', groupIds);
  if (memberRowsError) throw memberRowsError;

  const { data: channels, error: channelsError } = await supabase
    .from('group_channels')
    .select('channel_id, group_id, created_at')
    .in('group_id', groupIds)
    .order('created_at', { ascending: true });
  if (channelsError) throw channelsError;

  const channelByGroup = new Map();
  for (const channel of channels || []) {
    if (!channelByGroup.has(channel.group_id)) {
      channelByGroup.set(channel.group_id, channel);
    }
  }

  const channelIds = (channels || []).map((c) => c.channel_id);
  let messages = [];
  if (channelIds.length) {
    const { data: messageRows, error: messageError } = await supabase
      .from('group_messages')
      .select('message_id, channel_id, user_id, content, created_at')
      .in('channel_id', channelIds)
      .order('created_at', { ascending: false });
    if (messageError) throw messageError;
    messages = messageRows || [];
  }

  const latestMessageByChannel = new Map();
  for (const message of messages) {
    if (!latestMessageByChannel.has(message.channel_id)) {
      latestMessageByChannel.set(message.channel_id, message);
    }
  }

  const memberIds = (memberRows || []).map((row) => row.user_id);
  const messageUserIds = messages.map((row) => row.user_id);
  const userMap = await getUserMap([...memberIds, ...messageUserIds]);

  const membersByGroup = (memberRows || []).reduce((acc, row) => {
    if (!acc[row.group_id]) acc[row.group_id] = [];
    const user = userMap.get(row.user_id);
    acc[row.group_id].push(user?.display_name || user?.username || 'Crafter');
    return acc;
  }, {});
  const memberUserIdsByGroup = (memberRows || []).reduce((acc, row) => {
    if (!acc[row.group_id]) acc[row.group_id] = [];
    acc[row.group_id].push(row.user_id);
    return acc;
  }, {});

  const channelIdList = visibleGroups
    .map((g) => channelByGroup.get(g.group_id)?.channel_id)
    .filter(Boolean);
  const unreadByChannel = await fetchUnreadCountsByChannelIds(channelIdList);

  const dbChats = await Promise.all(visibleGroups.map(async (group) => {
    const channel = channelByGroup.get(group.group_id);
    const latestMessage = channel ? latestMessageByChannel.get(channel.channel_id) : null;
    const parsed = latestMessage ? parseMessageContent(latestMessage.content) : null;
    const memberNames = membersByGroup[group.group_id] || [];
    const memberUserIds = memberUserIdsByGroup[group.group_id] || [];
    const isDirect = String(group.name || '').startsWith('dm:');
    const otherUserId = isDirect
      ? memberUserIds.find((id) => id && id !== currentUserId)
      : null;
    const otherUser = otherUserId ? userMap.get(otherUserId) : null;
    const displayName = isDirect
      ? otherUser?.display_name || otherUser?.username || 'Direct message'
      : group.name;
    const metadata = parseGroupMetadata(group.description);
    const resolvedCoverImage = isDirect
      ? await resolveAvatarUrl(otherUser?.avatar_url || '')
      : await resolveGroupImageUrl(metadata.image);
    const chId = channel?.channel_id;
    const unreadCount = chId != null ? (unreadByChannel.get(String(chId)) ?? 0) : 0;
    return {
      id: group.group_id,
      name: displayName,
      preview: parsed?.text || 'Start chatting...',
      lastMessageAt: latestMessage?.created_at || null,
      channelId: chId || null,
      memberCount: memberNames.length,
      unreadCount,
      coverImage: resolvedCoverImage || null,
      members: memberNames,
      messages: [],
      settings: {
        description: metadata.description || '',
        isMuted: false,
      },
    };
  }));

  const existingKeys = new Set(
    dbChats.map((chat) => String(chat.id))
  );
  const existingNames = new Set(
    dbChats.map((chat) => String(chat.name || '').trim().toLowerCase())
  );
  const legacyChats = GROUP_CHATS.filter((chat) => {
    const chatId = String(chat.id || '');
    const nameKey = String(chat.name || '').trim().toLowerCase();
    return !existingKeys.has(chatId) && !existingNames.has(nameKey);
  }).map((c) => ({ ...c, unreadCount: Number(c.unreadCount) || 0, channelId: c.channelId || null }));

  return [...dbChats, ...legacyChats];
  } catch (err) {
    console.warn('[groupChats] fetchGroupChats failed, using local seed list:', err?.message || err);
    return GROUP_CHATS;
  }
}

export async function fetchGroupChat(chatId, currentUserId) {
  const id = normalizeRouteChatId(chatId);
  if (!id) return null;

  if (!isUuid(id)) {
    return getGroupChatById(id);
  }

  if (!supabase) return getGroupChatById(id);

  try {
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('group_id, name, description')
    .eq('group_id', id)
    .maybeSingle();
  if (groupError) throw groupError;
  if (!group) return null;

  const { data: channels, error: channelsError } = await supabase
    .from('group_channels')
    .select('channel_id, name, created_at')
    .eq('group_id', group.group_id)
    .order('created_at', { ascending: true });
  if (channelsError) throw channelsError;
  let channel = channels?.[0];
  if (!channel) {
    channel = await ensureGeneralChannel(group.group_id);
  }
  if (!channel) {
    const metadata = parseGroupMetadata(group.description);
    const resolvedCoverImage = await resolveGroupImageUrl(metadata.image);
    return {
      id: group.group_id,
      name: group.name,
      preview: 'Start chatting...',
      memberCount: 0,
      coverImage: resolvedCoverImage || null,
      members: [],
      messages: [],
      memberUserIds: [],
      memberRoles: [],
      channelId: null,
      settings: {
        description: metadata.description || '',
        isMuted: false,
      },
    };
  }

  const { data: memberRows, error: membersError } = await supabase
    .from('group_members')
    .select('user_id, role')
    .eq('group_id', group.group_id);
  if (membersError) throw membersError;

  const { data: messageRows, error: messagesError } = await supabase
    .from('group_messages')
    .select('message_id, user_id, content, created_at')
    .eq('channel_id', channel.channel_id)
    .order('created_at', { ascending: true });
  if (messagesError) throw messagesError;

  const userIds = [...(memberRows || []).map((row) => row.user_id), ...(messageRows || []).map((row) => row.user_id)];
  const userMap = await getUserMap(userIds);

  const members = (memberRows || []).map((row) => {
    const user = userMap.get(row.user_id);
    return user?.display_name || user?.username || 'Crafter';
  });
  const isDirect = String(group.name || '').startsWith('dm:');
  const metadata = parseGroupMetadata(group.description);
  const otherUserId = isDirect
    ? (memberRows || []).map((row) => row.user_id).find((id) => id && id !== currentUserId)
    : null;
  const otherUser = otherUserId ? userMap.get(otherUserId) : null;
  const resolvedCoverImage = isDirect
    ? await resolveAvatarUrl(otherUser?.avatar_url || '')
    : await resolveGroupImageUrl(metadata.image);
  const displayName = isDirect
    ? otherUser?.display_name || otherUser?.username || 'Direct message'
    : group.name;

  const messages = await Promise.all((messageRows || []).map(async (row) => {
    const user = userMap.get(row.user_id);
    const parsed = parseMessageContent(row.content);
    const avatarUrl = await resolveAvatarUrl(user?.avatar_url || '');
    return {
      id: row.message_id,
      author: user?.display_name || user?.username || 'Crafter',
      avatarUrl: avatarUrl || null,
      text: parsed.text || '',
      image: parsed.image || null,
      editedAt: parsed.editedAt || null,
      userId: row.user_id,
      createdAt: row.created_at,
    };
  }));

  return {
    id: group.group_id,
    name: displayName,
    preview: messages.length ? messages[messages.length - 1].text : 'Start chatting...',
    lastMessageAt: messages.length ? messages[messages.length - 1].createdAt : null,
    memberCount: members.length,
    coverImage: resolvedCoverImage || null,
    members,
    memberUserIds: (memberRows || []).map((row) => row.user_id),
    memberRoles: (memberRows || []).map((row) => String(row.role || 'member')),
    messages,
    channelId: channel.channel_id,
    settings: {
      description: metadata.description || '',
      isMuted: false,
    },
  };
  } catch (err) {
    console.warn('[groupChats] fetchGroupChat failed:', err?.message || err);
    return null;
  }
}

export async function sendGroupMessage({ channelId, userId, text, image }) {
  if (!supabase || !channelId || !userId) {
    throw new Error('Missing message send data.');
  }
  const trimmed = String(text || '').trim();
  if (!trimmed && !image) return null;

  const { data, error } = await supabase
    .from('group_messages')
    .insert([
      {
        channel_id: channelId,
        user_id: userId,
        content: serializeMessageContent(trimmed || ' ', image || null),
      },
    ])
    .select('message_id, user_id, content, created_at')
    .single();
  if (error) throw error;

  const userMap = await getUserMap([userId]);
  const author = userMap.get(userId);
  const parsed = parseMessageContent(data.content);
  const avatarUrl = await resolveAvatarUrl(author?.avatar_url || '');
  return {
    id: data.message_id,
    author: author?.display_name || author?.username || 'You',
    avatarUrl: avatarUrl || null,
    text: parsed.text || '',
    image: parsed.image || null,
    editedAt: parsed.editedAt || null,
    userId,
    createdAt: data.created_at,
  };
}

export async function updateGroupMessage({ messageId, text, image }) {
  if (!supabase || !messageId) {
    throw new Error('Missing message update data.');
  }
  const editedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('group_messages')
    .update({
      content: serializeMessageContent(String(text || '').trim(), image || null, editedAt),
    })
    .eq('message_id', messageId)
    .select('message_id, content, created_at')
    .single();
  if (error) throw error;
  const parsed = parseMessageContent(data.content);
  return {
    id: data.message_id,
    text: parsed.text || '',
    image: parsed.image || null,
    editedAt: parsed.editedAt || editedAt,
    createdAt: data.created_at,
  };
}

export async function getOrCreateDirectMessageChat(currentUserId, otherUserId) {
  if (!supabase || !currentUserId || !otherUserId) {
    throw new Error('Missing users for direct message.');
  }
  if (currentUserId === otherUserId) {
    throw new Error('Cannot start a direct message with yourself.');
  }

  const sortedIds = [currentUserId, otherUserId].sort();
  const dmName = `dm:${sortedIds[0]}:${sortedIds[1]}`;

  const { data: existingGroup, error: existingError } = await supabase
    .from('groups')
    .select('group_id')
    .eq('name', dmName)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existingGroup?.group_id) return existingGroup.group_id;

  const { data: createdGroup, error: createGroupError } = await supabase
    .from('groups')
    .insert([
      {
        name: dmName,
        description: 'Direct message',
        owner_id: currentUserId,
      },
    ])
    .select('group_id')
    .single();
  if (createGroupError) throw createGroupError;

  const groupId = createdGroup.group_id;
  const { error: membersError } = await supabase
    .from('group_members')
    .insert([
      { group_id: groupId, user_id: currentUserId, role: 'admin' },
      { group_id: groupId, user_id: otherUserId, role: 'member' },
    ]);
  if (membersError) throw membersError;

  const { error: channelError } = await supabase
    .from('group_channels')
    .insert([{ group_id: groupId, name: 'general', description: 'Direct messages' }]);
  if (channelError) throw channelError;

  return groupId;
}

export async function createGroupChat({ ownerId, name, description, memberIds = [] }) {
  if (!supabase || !ownerId) {
    throw new Error('Missing group creation data.');
  }
  const trimmedName = String(name || '').trim();
  if (!trimmedName) {
    throw new Error('Group name is required.');
  }

  const uniqueMemberIds = [...new Set([ownerId, ...memberIds].filter(Boolean))];

  const { data: createdGroup, error: createGroupError } = await supabase
    .from('groups')
    .insert([
      {
        name: trimmedName,
        description: serializeGroupMetadata(String(description || '').trim(), null),
        owner_id: ownerId,
      },
    ])
    .select('group_id')
    .single();
  if (createGroupError) throw createGroupError;

  const groupId = createdGroup.group_id;
  const membershipRows = uniqueMemberIds.map((userId) => ({
    group_id: groupId,
    user_id: userId,
    role: userId === ownerId ? 'admin' : 'member',
  }));
  const { error: membersError } = await supabase.from('group_members').insert(membershipRows);
  if (membersError) throw membersError;

  const { error: channelError } = await supabase
    .from('group_channels')
    .insert([{ group_id: groupId, name: 'general', description: 'Group chat channel' }]);
  if (channelError) throw channelError;

  return groupId;
}

export async function updateGroupDetails({ groupId, name, description, image }) {
  if (!supabase || !groupId) {
    throw new Error('Missing group update data.');
  }
  const trimmedName = String(name || '').trim();
  if (!trimmedName) {
    throw new Error('Group name is required.');
  }
  const payload = {
    name: trimmedName,
    description: serializeGroupMetadata(String(description || '').trim(), image || null),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('groups').update(payload).eq('group_id', groupId);
  if (error) throw error;
  return true;
}

export async function addMembersToGroup({ groupId, userIds = [] }) {
  if (!supabase || !groupId) throw new Error('Missing group id.');
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueIds.length) return 0;
  const rows = uniqueIds.map((userId) => ({
    group_id: groupId,
    user_id: userId,
    role: 'member',
  }));
  const { error } = await supabase
    .from('group_members')
    .upsert(rows, { onConflict: 'group_id,user_id', ignoreDuplicates: true });
  if (error) throw error;
  return uniqueIds.length;
}

export async function removeGroupMember({ groupId, userId }) {
  if (!supabase || !groupId || !userId) throw new Error('Missing member removal data.');
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) throw error;
  return true;
}

export async function deleteGroupMessage({ messageId }) {
  if (!supabase || !messageId) throw new Error('Missing message delete data.');
  const { error } = await supabase
    .from('group_messages')
    .delete()
    .eq('message_id', messageId);
  if (error) throw error;
  return true;
}

export async function leaveGroup({ groupId, userId }) {
  if (!supabase || !groupId || !userId) throw new Error('Missing leave group data.');
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) throw error;
  return true;
}
