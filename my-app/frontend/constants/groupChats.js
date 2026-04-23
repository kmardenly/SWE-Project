export const GROUP_CHATS = [
  {
    id: 'big-cats',
    name: 'The Big Cats GC',
    preview: 'Does anyone know where to get paint?',
    memberCount: 42,
    unreadCount: 0,
    coverImage: null,
    members: ['Abby', 'Mina', 'Leo', 'Kay', 'Nora', 'Eli'],
    lastMessageAt: '2026-04-22T22:15:00.000Z',
    messages: [
      { id: 'm1', author: 'Abby', text: 'Does anyone know where to get paint?', image: null, createdAt: '2026-04-22T22:01:00.000Z' },
      { id: 'm2', author: 'Abby', text: 'Does anyone know where to get paint?', image: null, createdAt: '2026-04-22T22:08:00.000Z' },
      { id: 'm3', author: 'Abby', text: 'Does anyone know where to get paint?', image: null, createdAt: '2026-04-22T22:15:00.000Z' },
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
    lastMessageAt: '2026-04-21T16:40:00.000Z',
    messages: [
      { id: 'm1', author: 'Jules', text: 'I found a pastel yarn sale!', image: null, createdAt: '2026-04-21T16:32:00.000Z' },
      { id: 'm2', author: 'Nina', text: 'Please send link!', image: null, createdAt: '2026-04-21T16:40:00.000Z' },
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
    lastMessageAt: '2026-04-20T12:24:00.000Z',
    messages: [
      { id: 'm1', author: 'Ivy', text: 'Who is free for wheel practice this weekend?', image: null, createdAt: '2026-04-20T12:24:00.000Z' },
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
