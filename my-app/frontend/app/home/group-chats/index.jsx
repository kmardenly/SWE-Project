import { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { fetchGroupChats } from '@/lib/groupChats.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);

const DARK = '#5c3d3d';

function chatMatches(chat, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return chat.name.toLowerCase().includes(q) || chat.preview.toLowerCase().includes(q);
}

export default function GroupChatsScreen() {
  const [query, setQuery] = useState('');
  const [groupChats, setGroupChats] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetchGroupChats().then((data) => {
      if (mounted) setGroupChats(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredChats = useMemo(
    () => groupChats.filter((chat) => chatMatches(chat, query)),
    [groupChats, query]
  );

  return (
    <View style={styles.root}>
      <Image
        source={require('@/assets/images/explore_background.png')}
        resizeMode="cover"
        style={styles.backgroundLayer}
      />

      <View style={styles.foreground}>
        <Text style={styles.pageTitle}>Chats</Text>

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
              style={({ pressed }) => [styles.chatCard, pressed && styles.chatCardPressed]}>
              <View style={styles.avatarDot} />
              <View style={styles.chatTextBlock}>
                <Text style={styles.chatName}>{chat.name}</Text>
                <Text numberOfLines={1} style={styles.previewText}>
                  {chat.preview}
                </Text>
              </View>
              <Text style={styles.memberText}>{chat.memberCount}</Text>
            </Pressable>
          ))}

          {filteredChats.length === 0 ? (
            <Text style={styles.emptyText}>No chats found. Try another search.</Text>
          ) : null}
        </ScrollView>

      </View>
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
  pageTitle: {
    textAlign: 'center',
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(54, 42, 60),
    color: DARK,
    marginBottom: responsive(12, 10, 18),
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
    paddingBottom: 14,
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
    opacity: 0.9,
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
  chatName: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(30, 22, 36),
    color: DARK,
    lineHeight: responsive(36, 28, 42),
  },
  previewText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(31, 21, 35),
    color: '#8e7777',
    lineHeight: responsive(30, 24, 36),
    marginTop: 2,
  },
  memberText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(28, 20, 32),
    color: '#7f6a6a',
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
