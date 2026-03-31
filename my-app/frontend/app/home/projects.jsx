import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProjectsScreen() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#f4d2d2" />
        </Pressable>
        <Text style={{ fontSize: 24, fontWeight: '700', marginLeft: 12 }}>My Projects</Text>
      </View>

      <Text style={{ color: '#888' }}>No projects yet.</Text>
    </View>
  );
}