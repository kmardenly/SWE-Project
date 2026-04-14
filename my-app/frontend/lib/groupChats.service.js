import { GROUP_CHATS, getGroupChatById } from '@/constants/groupChats';

// This file is intentionally thin so backend integration can
// replace these functions without changing the UI components.
export async function fetchGroupChats() {
  return GROUP_CHATS;
}

export async function fetchGroupChat(chatId) {
  return getGroupChatById(chatId);
}
