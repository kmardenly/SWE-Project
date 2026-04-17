import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {homeStyles} from '../../constants/homeStyles';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {useUser} from '@/context/UserContext';
import { supabase } from '@/lib/supabaseClient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NotificationModal from '@/components/notificationScreen';
import StreakModal from '@/components/streakModal';
import CatWindow from '@/components/cat-widget';
import PostCard from '@/components/post-card';

const MOCK_NOTIFICATIONS = [
  { id: '1', message: 'Your project "Oak Table" was saved.', time: '2m ago' },
  { id: '2', message: 'New comment on "Walnut Shelf".', time: '1h ago' },
  { id: '3', message: 'Material restock reminder: Pine boards.', time: '3h ago' },
];

const MOCK_POSTS = [
  {
    id: '1',
    username: '@posting_user',
    caption: 'caption here xxxxxxxxxxxxxxxx',
    tags: ['tag 1', 'tag 2', 'etc. tags'],
    comments: [
      { id: 'c1', username: '@commenter', text: 'comment goes here', time: 'x days ago' },
    ],
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.replace('/');
  };

  const [search, setSearch] = useState('');
  const [notifVisible, setNotifVisible] = useState(false);
  const [streakVisible, setStreakVisible] = useState(false);

  let user_text = ""
  if (user !== null && user !== undefined){
    user_text = user.user_metadata?.display_name || user.email || '<User_Placeholder>'
  } else {
    user_text = "<User_Placeholder>"
  }

  return (
    <View style={homeStyles.container}>
      <Image
        source={require('@/assets/images/explore_background.png')}
        resizeMode="cover"
        style={homeStyles.backgroundLayer}
      />
      <View style={[homeStyles.foreground, { paddingTop: insets.top + 12 }]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
        <View style={homeStyles.header}>
          <Text style={homeStyles.title}>My Craft</Text>
          <View style={homeStyles.headerRight}>
            <View style={homeStyles.searchContainer}>
              <Ionicons name="search-outline" size={16} color="#888"/>
              <TextInput
                style={homeStyles.searchInput}
                placeholder="Search!"
                placeholderTextColor="#888"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color="#888"/>
                </Pressable>
              )}
            </View>
            <Pressable style={homeStyles.logoutIconButton} onPress={handleLogout} hitSlop={8}>
              <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <Text style={homeStyles.welcome}>Welcome back, {user_text}!</Text>

        <View style={homeStyles.quickActionsRow}>
          <View style={homeStyles.leftActionsColumn}>
            <Pressable style={homeStyles.homebuttons} onPress={() => setNotifVisible(true)}>
              <Ionicons name="notifications-outline" size={16} color="#888" />
              <Text style={homeStyles.notificationsText}>notifications</Text>
            </Pressable>

            <Pressable style={homeStyles.homebuttons} onPress={() => setStreakVisible(true)}>
              <Ionicons name="flame-outline" size={16} color="#888" />
              <Text style={homeStyles.streaksText}>craft streaks</Text>
            </Pressable>

            <Pressable style={homeStyles.homebuttons} onPress={() => router.push('/home/projects')}>
              <Ionicons name="folder-open-outline" size={16} color="#888" />
              <Text style={homeStyles.projectsText}>my projects</Text>
            </Pressable>
          </View>

          <View style={homeStyles.catColumn}>
            <CatWindow mood="happy" />
          </View>
        </View>

        <Text style={homeStyles.subtitle}>You are logged in.</Text>

        {MOCK_POSTS.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
        </ScrollView>
      </View>

      <NotificationModal
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        notifications={MOCK_NOTIFICATIONS}
      />
      <StreakModal
        visible={streakVisible}
        onClose={() => setStreakVisible(false)}
        streak={5}
      />

    </View>
  );
}