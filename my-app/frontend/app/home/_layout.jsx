import { router, Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Image, StyleSheet, View } from 'react-native';

const TAB_ICONS = {
  home: {
    active: require('@/assets/images/nav-icons/home-selected.png'),
    inactive: require('@/assets/images/nav-icons/home-unselected.png'),
  },
  search: {
    active: require('@/assets/images/nav-icons/explore-selected.png'),
    inactive: require('@/assets/images/nav-icons/explore-unselected.png'),
  },
  goals: {
    active: require('@/assets/images/nav-icons/goals-selected.png'),
    inactive: require('@/assets/images/nav-icons/goals-unselected.png'),
  },
  profile: {
    active: require('@/assets/images/nav-icons/profile-selected.png'),
    inactive: require('@/assets/images/nav-icons/profile-unselected.png'),
  },
  messages: {
    active: require('@/assets/images/nav-icons/chat-selected.png'),
    inactive: require('@/assets/images/nav-icons/chat-unselected.png'),
  },
};

export default function HomeTabsLayout() {
  const colorScheme = useColorScheme();

  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.tint,
          tabBarInactiveTintColor: theme.tabIconDefault,
          headerShown: false,
          tabBarButton: (props) => <HapticTab {...props} />,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarBackground: () => <Image source={require('@/assets/images/nav_bar_bg.png')} style={styles.tabBarBackground} />,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <Image source={focused ? TAB_ICONS.home.active : TAB_ICONS.home.inactive} style={styles.tabIcon} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Search',
            tabBarIcon: ({ focused }) => (
              <Image source={focused ? TAB_ICONS.search.active : TAB_ICONS.search.inactive} style={styles.tabIcon} />
            ),
          }}
          listeners={{
            tabPress: () => {
              router.replace('/home/explore');
            },
          }}
        />
        <Tabs.Screen
          name="goals"
          options={{
            title: 'Goals',
            tabBarIcon: ({ focused }) => (
              <Image source={focused ? TAB_ICONS.goals.active : TAB_ICONS.goals.inactive} style={styles.tabIcon} />
            ),
          }}
        />
        <Tabs.Screen
          name="post"
          options={{
            title: 'Post',
            href: null,
          }}
        />
        <Tabs.Screen
          name="projects"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="saves"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="edit-profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
            name="other.profile"
            options={{
                href: null,
            }}
        />
          <Tabs.Screen
              name="profile"
              options={{
                  title: 'Me',
                  tabBarIcon: ({ focused }) => (
                    <Image
                      source={focused ? TAB_ICONS.profile.active : TAB_ICONS.profile.inactive}
                      style={styles.tabIcon}
                    />
                  ),
              }}
          />
          <Tabs.Screen
              name="group-chats"
              options={{
                  title: 'Messages',
                  tabBarIcon: ({ focused }) => (
                    <Image
                      source={focused ? TAB_ICONS.messages.active : TAB_ICONS.messages.inactive}
                      style={styles.tabIcon}
                    />
                  ),
              }}
          />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  tabBar: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    position: 'absolute',
    height: 96,
    paddingTop: 10,
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    top: 0,
    resizeMode: 'stretch',
  },
  tabBarLabel: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 12,
    marginBottom: 6,
  },
});
