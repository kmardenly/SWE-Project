export const GROUP_CHATS = [
  {
    id: 'big-cats',
    name: 'The Big Cats GC',
    preview: 'Does anyone know where to get paint?',
    memberCount: 42,
    unreadCount: 0,
    coverImage: null,
    members: ['Abby', 'Mina', 'Leo', 'Kay', 'Nora', 'Eli'],
    messages: [
      { id: 'm1', author: 'Abby', text: 'Does anyone know where to get paint?', image: null },
      { id: 'm2', author: 'Abby', text: 'Does anyone know where to get paint?', image: null },
      { id: 'm3', author: 'Abby', text: 'Does anyone know where to get paint?', image: null },
    ],
    settings: {
      description: 'Cozy craft chat for cat-themed creators.',
      isMuted: false,
    },
  },
  {
    id: 'crochet-club',
    name: 'Crochet Club',
    preview: 'I found a pastel yarn sale!',
    memberCount: 18,
    unreadCount: 0,
    coverImage: null,
    members: ['Jules', 'Nina', 'Rose'],
    messages: [
      { id: 'm1', author: 'Jules', text: 'I found a pastel yarn sale!', image: null },
      { id: 'm2', author: 'Nina', text: 'Please send link!', image: null },
    ],
    settings: {
      description: 'Patterns, tips, and cute yarn finds.',
      isMuted: false,
    },
  },
  {
    id: 'pottery-friends',
    name: 'Pottery Friends',
    preview: 'Who is free for wheel practice this weekend?',
    memberCount: 12,
    unreadCount: 0,
    coverImage: null,
    members: ['Ivy', 'Mara', 'Sage'],
    messages: [
      { id: 'm1', author: 'Ivy', text: 'Who is free for wheel practice this weekend?', image: null },
    ],
    settings: {
      description: 'Clay experiments and kiln updates.',
      isMuted: false,
    },
  },
];

export function getGroupChatById(chatId) {
  if (!chatId) return null;
  return GROUP_CHATS.find((chat) => chat.id === String(chatId)) ?? null;
}
