import { router, Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StyleSheet, View } from 'react-native';

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
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Search',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
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
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
          }}
        />
        <Tabs.Screen
          name="post"
          options={{
            title: 'Post',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="square.and.pencil" color={color} />,
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
              }}
          />
          <Tabs.Screen
              name="group-chats"
              options={{
                  title: 'Messages',
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
});
