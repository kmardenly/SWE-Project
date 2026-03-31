import { Modal, Pressable, Text, View, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationModal({ visible, onClose, notifications }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={() => {}}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Notifications</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={20} color="#333" />
            </Pressable>
          </View>

          {notifications.length === 0 ? (
            <Text style={styles.empty}>No notifications yet.</Text>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <View style={styles.notifRow}>
                  <Ionicons name="ellipse" size={8} color="#6C63FF" style={{ marginTop: 4 }} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.notifMessage}>{item.message}</Text>
                    <Text style={styles.notifTime}>{item.time}</Text>
                  </View>
                </View>
              )}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // ...same styles as before
});