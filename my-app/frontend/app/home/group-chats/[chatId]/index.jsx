import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/context/UserContext';

import { fetchGroupChat, normalizeRouteChatId, sendGroupMessage } from '@/lib/groupChats.service';
import {
  pickChatImageFromLibrary,
  resolveChatImageUriForMessage,
} from '@/lib/groupChatMedia.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);
const DARK = '#5c3d3d';

export default function GroupChatDetailsScreen() {
  const params = useLocalSearchParams();
  const chatId = normalizeRouteChatId(params.chatId);
  const { user } = useUser();
  const [messageText, setMessageText] = useState('');
  const [pendingImage, setPendingImage] = useState(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [chat, setChat] = useState(null);
  const [sentMessages, setSentMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState('');

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
      }
      setMessageText('');
      setPendingImage(null);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}>
          {sentMessages.map((message) => (
            <View key={message.id} style={styles.messageWrap}>
              <View style={styles.avatarDot} />
              <View style={styles.messageBlock}>
                <Text style={styles.authorText}>{message.author}</Text>
                <Text style={styles.messageText}>{message.text}</Text>
                {message.image ? <Image source={{ uri: message.image }} style={styles.messageImage} /> : null}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputWrap}>
          {pendingImage ? (
            <View style={styles.pendingImageBadge}>
              <Ionicons name="image-outline" size={16} color={DARK} />
              <Text style={styles.pendingImageText}>1 image ready</Text>
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
            <Pressable onPress={handleSendMessage} style={styles.sendButton} hitSlop={8} disabled={sending}>
              <Ionicons name="send" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
