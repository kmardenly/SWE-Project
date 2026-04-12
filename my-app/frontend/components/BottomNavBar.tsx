import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type NavItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home',     icon: 'home-outline',          route: '/home' },
  { label: 'Projects', icon: 'folder-open-outline',   route: '/home/projects' },
  { label: 'Add',      icon: 'add-circle-outline',    route: '/home/new' },
  { label: 'Feed',     icon: 'newspaper-outline',     route: '/home/feed' },
  { label: 'Profile',  icon: 'person-outline',        route: '/home/profile' },
];

export default function BottomNavBar({ active = 'Home' }) {
  return (
    <View style={styles.navbar}>
      {NAV_ITEMS.map(item => (
        <Pressable
          key={item.label}
          style={styles.navItem}
          onPress={() => router.push(item.route as any)}
        >
          <Ionicons
            name={item.icon}
            size={22}
            color={active === item.label ? '#6C63FF' : '#888'}
          />
          <Text style={[styles.navLabel, active === item.label && styles.navLabelActive]}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  navLabelActive: {
    color: '#6C63FF',
    fontWeight: '600',
  },
});