import { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useUser } from '@/context/UserContext';

import {
  fetchGroupChats,
  markGroupChannelAsRead,
  markGroupChannelAsUnread,
} from '@/lib/groupChats.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);

const DARK = '#5c3d3d';

function formatPreviewTimestamp(value) {
  if (!value) return '';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  const diffMs = Date.now() - dt.getTime();
  if (diffMs < 0) return '0s';
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  const months = Math.floor(days / 30);
  return `${Math.max(months, 1)}mo`;
}

function chatMatches(chat, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return chat.name.toLowerCase().includes(q) || chat.preview.toLowerCase().includes(q);
}

export default function GroupChatsScreen() {
  const { user } = useUser();
  const [query, setQuery] = useState('');
  const [groupChats, setGroupChats] = useState([]);
  const [menuChat, setMenuChat] = useState(null);

  const loadChats = useCallback(() => {
    let mounted = true;
    fetchGroupChats(user?.id)
      .then((data) => {
        if (mounted) setGroupChats(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.warn('[GroupChats] list load failed', err);
        if (mounted) setGroupChats([]);
      });
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      const cleanup = loadChats();
      return cleanup;
    }, [loadChats])
  );

  const filteredChats = useMemo(
    () => groupChats.filter((chat) => chatMatches(chat, query)),
    [groupChats, query]
  );

  const handleToggleReadState = useCallback(async (chat, targetUnread) => {
    if (!user?.id || !chat?.channelId) {
      setMenuChat(null);
      return;
    }
    try {
      if (targetUnread) {
        await markGroupChannelAsUnread(user.id, chat.channelId);
      } else {
        await markGroupChannelAsRead(user.id, chat.channelId);
      }
      setMenuChat(null);
      loadChats();
    } catch (error) {
      setMenuChat(null);
    }
  }, [loadChats, user?.id]);

  const openChatLongPressMenu = useCallback((chat) => {
    setMenuChat(chat);
  }, []);

  return (
    <View style={styles.root}>
      <Image
        source={require('@/assets/images/explore_background.png')}
        resizeMode="cover"
        style={styles.backgroundLayer}
      />

      <View style={styles.foreground}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Chats</Text>
          <Pressable
            style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
            onPress={() => router.push('/home/group-chats/create')}>
            <Text style={styles.createButtonText}>Create</Text>
          </Pressable>
        </View>

        <View style={styles.searchShell}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search group chats..."
            placeholderTextColor="#9b7d7d"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {filteredChats.map((chat) => (
            <Pressable
              key={chat.id}
              onPress={() => router.push(`/home/group-chats/${chat.id}`)}
              onLongPress={() => openChatLongPressMenu(chat)}
              delayLongPress={260}
              style={({ pressed }) => [styles.chatCard, pressed && styles.chatCardPressed]}>
              {chat.coverImage ? (
                <Image source={{ uri: chat.coverImage }} style={styles.avatarDot} resizeMode="cover" />
              ) : (
                <View style={styles.avatarDot} />
              )}
              <View style={styles.chatTextBlock}>
                <View style={styles.chatNameRow}>
                  <Text style={styles.chatName} numberOfLines={1}>{chat.name}</Text>
                </View>
                <View style={styles.previewMetaRow}>
                  <Text numberOfLines={1} style={styles.previewText}>
                    {chat.preview}
                  </Text>
                  <Text style={styles.previewTimeText}>{formatPreviewTimestamp(chat.lastMessageAt)}</Text>
                </View>
              </View>
              {Number(chat.unreadCount) > 0 ? <View style={styles.unreadIndicatorDot} /> : null}
              {Number(chat.unreadCount) > 0 ? (
                <Text style={styles.unreadBadge}>
                  {Number(chat.unreadCount) > 99 ? '99+' : String(chat.unreadCount)}
                </Text>
              ) : null}
            </Pressable>
          ))}

          {filteredChats.length === 0 ? (
            <Text style={styles.emptyText}>No chats found. Try another search.</Text>
          ) : null}
        </ScrollView>

      </View>

      <Modal
        visible={!!menuChat}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuChat(null)}
      >
        <View style={styles.menuBackdrop}>
          <Pressable style={styles.menuDismissArea} onPress={() => setMenuChat(null)} />
          <View style={styles.menuCard}>
            <Text numberOfLines={1} style={styles.menuTitle}>{menuChat?.name || 'Chat options'}</Text>
            <Pressable
              style={({ pressed }) => [styles.menuActionButton, pressed && styles.menuActionButtonPressed]}
              onPress={() => {
                if (!menuChat) return;
                const isUnread = Number(menuChat.unreadCount) > 0;
                handleToggleReadState(menuChat, !isUnread);
              }}
            >
              <Text style={styles.menuActionText}>
                {Number(menuChat?.unreadCount) > 0 ? 'Mark as read' : 'Mark as unread'}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.menuCancelButton, pressed && styles.menuActionButtonPressed]}
              onPress={() => setMenuChat(null)}
            >
              <Text style={styles.menuCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f2e4e4',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  foreground: {
    flex: 1,
    paddingTop: responsive(72, 58, 86),
  },
  titleRow: {
    marginHorizontal: 22,
    marginBottom: responsive(12, 10, 18),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(54, 42, 60),
    color: DARK,
  },
  createButton: {
    backgroundColor: '#f5d0d0',
    borderWidth: 1,
    borderColor: '#caa7a7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  createButtonPressed: {
    opacity: 0.88,
  },
  createButtonText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(22, 16, 26),
    color: DARK,
  },
  searchShell: {
    marginHorizontal: 22,
    borderRadius: 14,
    backgroundColor: '#f6e4e4',
    borderWidth: 1,
    borderColor: '#bd9b9b',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(25, 19, 30),
    color: DARK,
    paddingVertical: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: responsive(150, 130, 180),
    gap: 12,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c6a6a6',
    backgroundColor: '#f5e1e1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  chatCardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.02,
    elevation: 0,
  },
  avatarDot: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#d9d9d9',
  },
  chatTextBlock: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  chatNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  chatName: {
    flex: 1,
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(30, 22, 36),
    color: DARK,
    lineHeight: responsive(36, 28, 42),
  },
  previewText: {
    flex: 1,
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(19, 15, 22),
    color: '#8e7777',
    lineHeight: responsive(22, 18, 26),
    marginTop: 2,
  },
  previewMetaRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  previewTimeText: {
    fontFamily: 'Gaegu',
    fontSize: responsive(14, 12, 16),
    color: '#8e7777',
  },
  unreadIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9c6c6',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  menuDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  menuCard: {
    width: '100%',
    maxWidth: 290,
    backgroundColor: '#f5dede',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#caa7a7',
    padding: 12,
    gap: 8,
  },
  menuTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(20, 16, 24),
    color: DARK,
    marginBottom: 2,
  },
  menuActionButton: {
    borderRadius: 10,
    backgroundColor: '#f7e7e7',
    borderWidth: 1,
    borderColor: '#d2b4b4',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuActionButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  menuActionText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(18, 15, 21),
    color: DARK,
    textAlign: 'center',
  },
  menuCancelButton: {
    borderRadius: 10,
    backgroundColor: '#efd2d2',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuCancelText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(17, 14, 20),
    color: '#7d5b5b',
    textAlign: 'center',
  },
  unreadBadge: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(28, 20, 32),
    color: '#5c3d3d',
    minWidth: responsive(28, 22, 34),
    textAlign: 'right',
  },
  emptyText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(24, 18, 28),
    color: DARK,
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 24,
  },
});
