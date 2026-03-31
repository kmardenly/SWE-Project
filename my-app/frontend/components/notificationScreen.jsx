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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 14,
    width: 300,
    maxHeight: 400,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notifMessage: {
    fontSize: 14,
    color: '#333',
  },
  notifTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});