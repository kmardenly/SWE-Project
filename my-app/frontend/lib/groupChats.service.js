import { GROUP_CHATS, getGroupChatById } from '@/constants/groupChats';
import { supabase } from '@/lib/supabaseClient';

function parseMessageContent(raw) {
  const fallback = { text: String(raw || ''), image: null };
  if (typeof raw !== 'string') return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        text: String(parsed.text || ''),
        image: parsed.image || null,
      };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function serializeMessageContent(text, image) {
  return JSON.stringify({
    text: String(text || ''),
    image: image || null,
  });
}

async function getUserMap(userIds) {
  if (!supabase || !userIds?.length) return new Map();
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueIds.length) return new Map();

  const { data, error } = await supabase
    .from('users')
    .select('user_id, username, display_name')
    .in('user_id', uniqueIds);
  if (error) throw error;
  return new Map((data || []).map((row) => [row.user_id, row]));
}

export async function fetchGroupChats(currentUserId) {
  if (!supabase) return GROUP_CHATS;

  const { data: allGroups, error: groupsError } = await supabase
    .from('groups')
    .select('group_id, name, description, updated_at')
    .order('updated_at', { ascending: false });
  if (groupsError) throw groupsError;

  const groups = allGroups || [];
  const publicGroups = groups.filter((group) => !String(group.name || '').startsWith('dm:'));

  let userDmGroupIds = [];
  if (currentUserId) {
    const { data: memberships, error: membershipsError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', currentUserId);
    if (membershipsError) throw membershipsError;
    const membershipIds = new Set((memberships || []).map((row) => row.group_id));
    userDmGroupIds = groups
      .filter((group) => String(group.name || '').startsWith('dm:') && membershipIds.has(group.group_id))
      .map((group) => group.group_id);
  }

  const visibleGroups = groups.filter(
    (group) => !String(group.name || '').startsWith('dm:') || userDmGroupIds.includes(group.group_id)
  );
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

  const dbChats = visibleGroups.map((group) => {
    const channel = channelByGroup.get(group.group_id);
    const latestMessage = channel ? latestMessageByChannel.get(channel.channel_id) : null;
    const parsed = latestMessage ? parseMessageContent(latestMessage.content) : null;
    const memberNames = membersByGroup[group.group_id] || [];
    const isDirect = String(group.name || '').startsWith('dm:');
    const displayName = isDirect
      ? memberNames.find((member) => member && member !== (userMap.get(currentUserId)?.display_name || userMap.get(currentUserId)?.username)) ||
        'Direct message'
      : group.name;
    return {
      id: group.group_id,
      name: displayName,
      preview: parsed?.text || 'Start chatting...',
      memberCount: memberNames.length,
      coverImage: null,
      members: memberNames,
      messages: [],
      settings: {
        description: group.description || '',
        isMuted: false,
      },
    };
  });

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
  });

  return [...dbChats, ...legacyChats];
}

export async function fetchGroupChat(chatId, currentUserId) {
  if (!supabase || !chatId) return getGroupChatById(chatId);

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('group_id, name, description')
    .eq('group_id', chatId)
    .maybeSingle();
  if (groupError) throw groupError;
  if (!group) return getGroupChatById(chatId);

  const { data: channels, error: channelsError } = await supabase
    .from('group_channels')
    .select('channel_id, name, created_at')
    .eq('group_id', group.group_id)
    .order('created_at', { ascending: true });
  if (channelsError) throw channelsError;
  const channel = channels?.[0];
  if (!channel) {
    return {
      id: group.group_id,
      name: group.name,
      preview: 'Start chatting...',
      memberCount: 0,
      coverImage: null,
      members: [],
      messages: [],
      channelId: null,
      settings: {
        description: group.description || '',
        isMuted: false,
      },
    };
  }

  const { data: memberRows, error: membersError } = await supabase
    .from('group_members')
    .select('user_id')
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
  const currentUserName =
    userMap.get(currentUserId)?.display_name ||
    userMap.get(currentUserId)?.username ||
    '';
  const isDirect = String(group.name || '').startsWith('dm:');
  const displayName = isDirect
    ? members.find((name) => name && name !== currentUserName) || 'Direct message'
    : group.name;

  const messages = (messageRows || []).map((row) => {
    const user = userMap.get(row.user_id);
    const parsed = parseMessageContent(row.content);
    return {
      id: row.message_id,
      author: user?.display_name || user?.username || 'Crafter',
      text: parsed.text || '',
      image: parsed.image || null,
      userId: row.user_id,
      createdAt: row.created_at,
    };
  });

  return {
    id: group.group_id,
    name: displayName,
    preview: messages.length ? messages[messages.length - 1].text : 'Start chatting...',
    memberCount: members.length,
    coverImage: null,
    members,
    messages,
    channelId: channel.channel_id,
    settings: {
      description: group.description || '',
      isMuted: false,
    },
  };
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
  return {
    id: data.message_id,
    author: author?.display_name || author?.username || 'You',
    text: parsed.text || '',
    image: parsed.image || null,
    userId,
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
