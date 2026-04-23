import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/context/UserContext';

import { fetchGroupChat, leaveGroup, normalizeRouteChatId } from '@/lib/groupChats.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const clamp = (min, preferred, max) => Math.max(min, Math.min(preferred, max));
const responsive = (size, min, max) => clamp(min, (SCREEN_WIDTH / BASE_WIDTH) * size, max);
const DARK = '#5c3d3d';

function SettingsRow({ icon, label, value }) {
  return (
    <View style={styles.settingsRow}>
      <Ionicons name={icon} size={26} color={DARK} />
      <Text style={styles.settingsLabel}>{label}</Text>
      <Text style={styles.settingsValue}>{value}</Text>
    </View>
  );
}

export default function GroupChatMoreScreen() {
  const params = useLocalSearchParams();
  const chatId = normalizeRouteChatId(params.chatId);
  const { user } = useUser();
  const [chat, setChat] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      if (!chatId) {
        router.back();
        return () => {
          mounted = false;
        };
      }
      fetchGroupChat(chatId, user?.id)
        .then((data) => {
          if (mounted) setChat(data);
        })
        .catch(() => {
          if (mounted) setChat(null);
        });
      return () => {
        mounted = false;
      };
    }, [chatId, user?.id])
  );

  async function handleLeaveGroup() {
    if (!chatId || !user?.id) return;
    Alert.alert('Leave group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveGroup({ groupId: chatId, userId: user.id });
            router.replace('/home/group-chats');
          } catch (error) {
            Alert.alert('Error', error?.message || 'Could not leave group.');
          }
        },
      },
    ]);
  }

  function handleMemberPress(memberUserId) {
    if (!memberUserId) return;
    if (memberUserId === user?.id) {
      router.push('/home/profile');
      return;
    }
    router.push({
      pathname: '/home/other.profile',
      params: { userId: memberUserId },
    });
  }

  if (!chat) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={DARK} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Image
        source={require('@/assets/images/explore_background.png')}
        resizeMode="cover"
        style={styles.backgroundLayer}
      />

      <ScrollView style={styles.foreground} contentContainerStyle={styles.foregroundContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={30} color={DARK} />
          </Pressable>
          <Text style={styles.headerTitle}>Group Details</Text>
          <View style={styles.spacer} />
        </View>

        {chat.coverImage ? (
          <Image source={{ uri: chat.coverImage }} style={styles.avatarCircle} />
        ) : (
          <View style={styles.avatarCircle} />
        )}

        <View style={styles.iconRow}>
          <Pressable style={styles.iconBtn} onPress={() => router.push(`/home/group-chats/${chat.id}/edit`)}>
            <Ionicons name="create-outline" size={34} color={DARK} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => router.push(`/home/group-chats/${chat.id}/add-people`)}>
            <Ionicons name="person-add-outline" size={34} color={DARK} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={handleLeaveGroup}>
            <Ionicons name="exit-outline" size={34} color={DARK} />
          </Pressable>
        </View>

        <View style={styles.membersHeader}>
          <Text style={styles.membersHeaderText}>Group Members | {chat.memberCount}</Text>
        </View>

        <View style={styles.membersCard}>
          <View style={styles.membersContent}>
          {chat.members.map((member, index) => {
            const memberUserId = chat.memberUserIds?.[index];
            return (
              <Pressable
                key={`${member}-${memberUserId || index}`}
                style={styles.memberPressable}
                onPress={() => handleMemberPress(memberUserId)}
                disabled={!memberUserId}
              >
                <View style={styles.memberRow}>
                  <View style={styles.memberDot} />
                  <Text style={styles.memberName}>{member}</Text>
                </View>
              </Pressable>
            );
          })}
          </View>
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Customization</Text>
          <SettingsRow icon="document-text-outline" label="Description" value={chat.settings.description} />
          <SettingsRow icon="notifications-outline" label="Mute" value={chat.settings.isMuted ? 'On' : 'Off'} />
        </View>
      </ScrollView>
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
  },
  foregroundContent: {
    paddingTop: responsive(58, 48, 70),
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(40, 28, 44),
    color: DARK,
  },
  spacer: {
    width: 30,
  },
  avatarCircle: {
    alignSelf: 'center',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#d3d4d4',
    marginBottom: 18,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 22,
    marginBottom: 18,
  },
  iconBtn: {
    width: 48,
    alignItems: 'center',
  },
  membersHeader: {
    borderWidth: 1,
    borderColor: '#bb9c9c',
    borderRadius: 10,
    backgroundColor: '#e8cfd1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  membersHeaderText: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(33, 22, 37),
    color: '#6c5656',
  },
  membersCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c9b69e',
    backgroundColor: '#f4f2e5',
    marginBottom: 14,
  },
  membersContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberPressable: {
    width: '100%',
  },
  memberDot: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#d6d8d8',
  },
  memberName: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(39, 24, 43),
    color: DARK,
  },
  settingsCard: {
    borderWidth: 1,
    borderColor: '#c4adad',
    borderRadius: 10,
    backgroundColor: '#f5e1e1',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  settingsTitle: {
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(30, 22, 34),
    color: DARK,
    marginBottom: 6,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  settingsLabel: {
    marginLeft: 8,
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(26, 18, 32),
    color: DARK,
  },
  settingsValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Gaegu-Bold',
    fontSize: responsive(23, 17, 28),
    color: '#7f6666',
  },
});
