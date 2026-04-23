import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useUser } from '@/context/UserContext';

import {
  fetchGroupChat,
  markGroupChannelAsRead,
  normalizeRouteChatId,
  sendGroupMessage,
} from '@/lib/groupChats.service';
import {
  pickChatImageFromLibrary,
  resolveChatImageUriForMessage,
} from '@/lib/groupChatMedia.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);
const DARK = '#5c3d3d';

function formatMessageTimestamp(value) {
  if (!value) return '';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMessageDay = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const dayDiff = Math.round((startOfToday - startOfMessageDay) / 86400000);
  const timePart = dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (dayDiff === 0) return `Today at ${timePart}`;
  if (dayDiff === 1) return `Yesterday at ${timePart}`;
  const datePart = dt.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${datePart} at ${timePart}`;
}

export default function GroupChatDetailsScreen() {
  const params = useLocalSearchParams();
  const tabBarHeight = useBottomTabBarHeight();
  const chatId = normalizeRouteChatId(params.chatId);
  const { user } = useUser();
  const [messageText, setMessageText] = useState('');
  const [pendingImage, setPendingImage] = useState(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [chat, setChat] = useState(null);
  const [sentMessages, setSentMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [expandedImageUri, setExpandedImageUri] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoadError('');
    setChat(null);

    if (!chatId) {
      router.replace('/home/group-chats');
      return () => {
        mounted = false;
      };
    }

    fetchGroupChat(chatId, user?.id)
      .then((data) => {
        if (!mounted) return;
        if (!data) {
          router.replace('/home/group-chats');
          return;
        }
        setChat(data);
        setSentMessages(data.messages ?? []);
      })
      .catch((err) => {
        console.warn('[GroupChatDetails] load failed', err);
        if (!mounted) return;
        setLoadError(err?.message || 'Could not open this chat.');
      });

    return () => {
      mounted = false;
    };
  }, [chatId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (chat?.channelId && user?.id) {
        void markGroupChannelAsRead(user.id, chat.channelId);
      }
    }, [chat?.channelId, user?.id])
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (loadError) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Text style={styles.errorText}>{loadError}</Text>
        <Pressable style={styles.retryBtn} onPress={() => router.replace('/home/group-chats')}>
          <Text style={styles.retryBtnText}>Back to chats</Text>
        </Pressable>
      </View>
    );
  }

  if (!chat) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={DARK} />
      </View>
    );
  }

  const handleAttachImage = async () => {
    if (isPickingImage) return;
    setIsPickingImage(true);

    try {
      const picked = await pickChatImageFromLibrary();
      if (picked.cancelled) {
        if (picked.reason === 'permission_denied') {
          Alert.alert('Photo access needed', 'Allow photo library permission to add an image.');
        }
        return;
      }
      setPendingImage(picked);
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !pendingImage) return;
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to send messages.');
      return;
    }
    if (!chat?.channelId) {
      Alert.alert('Channel unavailable', 'Unable to send in this chat.');
      return;
    }
    if (sending) return;

    const resolvedImageUri = pendingImage
      ? await resolveChatImageUriForMessage(pendingImage)
      : null;

    try {
      setSending(true);
      const created = await sendGroupMessage({
        channelId: chat.channelId,
        userId: user.id,
        text: messageText.trim(),
        image: resolvedImageUri,
      });

      if (created) {
        setSentMessages((prev) => [...prev, created]);
        if (user?.id && chat?.channelId) {
          await markGroupChannelAsRead(user.id, chat.channelId);
        }
      }
      setMessageText('');
      setPendingImage(null);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const canSend = !sending && (!!messageText.trim() || !!pendingImage);
  const messagesBottomPadding = keyboardVisible ? 18 : tabBarHeight + 90;
  const composerBottomMargin = keyboardVisible ? 2 : tabBarHeight + 8;
  const isImageModalVisible = !!expandedImageUri;

  const handleMessageAuthorPress = (messageUserId) => {
    if (!messageUserId) return;
    if (messageUserId === user?.id) {
      router.push('/home/profile');
      return;
    }
    router.push({
      pathname: '/home/other.profile',
      params: { userId: messageUserId },
    });
  };

  return (
    <View style={styles.root}>
      <Image
        source={require('@/assets/images/explore_background.png')}
        resizeMode="cover"
        style={styles.backgroundLayer}
      />

      <KeyboardAvoidingView
        style={styles.foreground}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={30} color={DARK} />
          </Pressable>
          <Text style={styles.headerTitle}>{chat.name}</Text>
          <Pressable onPress={() => router.push(`/home/group-chats/${chat.id}/more`)} hitSlop={12}>
            <Ionicons name="ellipsis-horizontal" size={30} color={DARK} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.messagesScroll}
          contentContainerStyle={[styles.messagesContent, { paddingBottom: messagesBottomPadding }]}
          showsVerticalScrollIndicator={false}>
          {sentMessages.map((message) => (
            <View key={message.id} style={styles.messageWrap}>
              <Pressable onPress={() => handleMessageAuthorPress(message.userId)} hitSlop={8} disabled={!message.userId}>
                {message.avatarUrl ? (
                  <Image source={{ uri: message.avatarUrl }} style={styles.avatarDot} resizeMode="cover" />
                ) : (
                  <View style={styles.avatarDot} />
                )}
              </Pressable>
              <View style={styles.messageBlock}>
                <View style={styles.authorMetaRow}>
                  <Pressable
                    onPress={() => handleMessageAuthorPress(message.userId)}
                    hitSlop={6}
                    style={styles.authorPressable}
                    disabled={!message.userId}
                  >
                    <Text style={styles.authorText}>{message.author}</Text>
                  </Pressable>
                  {message.createdAt ? (
                    <Text style={styles.messageDateText}>{formatMessageTimestamp(message.createdAt)}</Text>
                  ) : null}
                </View>
                <Text style={styles.messageText}>{message.text}</Text>
                {message.image ? (
                  <Pressable onPress={() => setExpandedImageUri(message.image)} hitSlop={8}>
                    <Image source={{ uri: message.image }} style={styles.messageImage} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}
        </ScrollView>

        <View
          style={[
            styles.inputWrap,
            { marginBottom: composerBottomMargin },
          ]}>
          {pendingImage ? (
            <View style={styles.pendingImageBadge}>
              <Image source={{ uri: pendingImage.localUri }} style={styles.pendingImageThumb} />
              <Text style={styles.pendingImageText}>1 image ready</Text>
              <Pressable onPress={() => setPendingImage(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={DARK} />
              </Pressable>
            </View>
          ) : null}
          <View style={styles.inputRow}>
            <Pressable onPress={handleAttachImage} style={styles.attachButton} hitSlop={8}>
              <Ionicons name="image-outline" size={22} color={DARK} />
            </Pressable>
            <TextInput
              style={styles.input}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Send a message..."
              placeholderTextColor="#9b8080"
            />
            <Pressable
              onPress={handleSendMessage}
              style={[styles.sendButton, !canSend ? styles.sendButtonDisabled : null]}
              hitSlop={8}
              disabled={!canSend}>
              <Ionicons name="send" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={isImageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExpandedImageUri('')}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismissArea} onPress={() => setExpandedImageUri('')} />
          <Pressable style={styles.modalCloseButton} onPress={() => setExpandedImageUri('')} hitSlop={10}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          <Image source={{ uri: expandedImageUri }} style={styles.expandedImage} resizeMode="contain" />
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
    paddingTop: responsive(52, 42, 62),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#f6f5e8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8ccb8',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 8,
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(24, 20, 28),
    color: DARK,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  messageWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  avatarDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d8d8d8',
    marginTop: 3,
  },
  messageBlock: {
    flex: 1,
  },
  authorText: {
    fontFamily: 'Gaegu-Bold',
    color: DARK,
    fontSize: responsive(16, 14, 18),
    lineHeight: responsive(20, 18, 22),
  },
  authorPressable: {
    alignSelf: 'flex-start',
  },
  authorMetaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  messageDateText: {
    fontFamily: 'Gaegu',
    color: '#8e7777',
    fontSize: responsive(14, 12, 16),
    lineHeight: responsive(16, 14, 18),
    flexShrink: 1,
    textAlign: 'right',
  },
  messageText: {
    fontFamily: 'Gaegu-Bold',
    color: '#201818',
    fontSize: responsive(20, 16, 24),
    lineHeight: responsive(24, 20, 28),
  },
  messageImage: {
    marginTop: 8,
    width: responsive(148, 120, 180),
    height: responsive(148, 120, 180),
    borderRadius: 6,
    backgroundColor: '#ddd',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCloseButton: {
    position: 'absolute',
    top: responsive(56, 46, 66),
    right: 22,
    zIndex: 2,
  },
  expandedImage: {
    width: '100%',
    maxWidth: 520,
    height: '80%',
  },
  inputWrap: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 11,
    backgroundColor: '#e7d1d1',
    borderWidth: 1,
    borderColor: '#b49292',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pendingImageBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eddcdc',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  pendingImageText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(14, 12, 16),
    color: DARK,
  },
  pendingImageThumb: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#ddd',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3e3e3',
    borderWidth: 1,
    borderColor: '#b49292',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9f7f7f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccb4b4',
  },
  input: {
    flex: 1,
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(20, 16, 24),
    color: DARK,
    paddingVertical: 6,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(18, 16, 22),
    color: DARK,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#9f7f7f',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    fontFamily: 'Gaegu-Bold',
    color: '#fff',
    fontSize: responsive(16, 14, 20),
  },
});
