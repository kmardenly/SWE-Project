import { router, Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { Image, StyleSheet, View } from 'react-native';

const TAB_BAR_LABEL_ACTIVE = '#b86772';
const TAB_BAR_LABEL_INACTIVE = '#4A3E3B';
/** Solid base behind nav_bar_bg so scene backgrounds do not show through transparent PNG areas */
const TAB_BAR_BASE_COLOR = '#FFF5F5';

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
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: TAB_BAR_LABEL_ACTIVE,
          tabBarInactiveTintColor: TAB_BAR_LABEL_INACTIVE,
          headerShown: false,
          tabBarButton: (props) => <HapticTab {...props} />,
          tabBarLabelPosition: 'below-icon',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIconStyle: styles.tabBarIcon,
          tabBarBackground: () => (
            <View style={styles.tabBarBackgroundRoot} pointerEvents="none">
              <View style={[styles.tabBarUnderlay, { backgroundColor: TAB_BAR_BASE_COLOR }]} />
              <Image source={require('@/assets/images/nav_bar_bg.png')} style={styles.tabBarBackground} />
            </View>
          ),
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
    marginBottom: 5,
  },
  tabBar: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    position: 'absolute',
    height: 98,
    paddingTop: 30,
  },
  tabBarBackgroundRoot: {
    flex: 1,
  },
  tabBarUnderlay: {
    ...StyleSheet.absoluteFillObject,
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
  tabBarIcon: {
    marginTop: 2,
  },
});
