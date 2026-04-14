import { useEffect, useState } from 'react';
import {
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

import { fetchGroupChat } from '@/lib/groupChats.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);
const DARK = '#5c3d3d';

export default function GroupChatDetailsScreen() {
  const { chatId } = useLocalSearchParams();
  const [messageText, setMessageText] = useState('');
  const [chat, setChat] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchGroupChat(chatId).then((data) => {
      if (!mounted) return;
      if (!data) {
        router.replace('/home/group-chats');
        return;
      }
      setChat(data);
    });
    return () => {
      mounted = false;
    };
  }, [chatId]);

  if (!chat) return null;

  const messages = [...chat.messages];
  if (messageText.trim()) {
    messages.push({
      id: 'draft',
      author: 'You',
      text: messageText,
      image: null,
    });
  }

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
          {messages.map((message) => (
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
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Send a message..."
            placeholderTextColor="#9b8080"
          />
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
    paddingTop: responsive(58, 48, 70),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginBottom: 14,
    backgroundColor: '#f6f5e8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d8ccb8',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 8,
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(34, 24, 40),
    color: DARK,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 14,
  },
  messageWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatarDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#d8d8d8',
    marginTop: 3,
  },
  messageBlock: {
    flex: 1,
  },
  authorText: {
    fontFamily: 'Gaegu-Bold',
    color: DARK,
    fontSize: responsive(33, 22, 38),
    lineHeight: responsive(33, 25, 40),
  },
  messageText: {
    fontFamily: 'Gaegu-Bold',
    color: '#201818',
    fontSize: responsive(38, 24, 42),
    lineHeight: responsive(38, 28, 45),
  },
  messageImage: {
    marginTop: 8,
    width: responsive(150, 128, 190),
    height: responsive(150, 128, 190),
    borderRadius: 6,
    backgroundColor: '#ddd',
  },
  inputWrap: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 11,
    backgroundColor: '#e7d1d1',
    borderWidth: 1,
    borderColor: '#b49292',
    paddingHorizontal: 12,
  },
  input: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(37, 24, 42),
    color: DARK,
    paddingVertical: 8,
  },
});
