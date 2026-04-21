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
                  <Ionicons name="ellipse" size={8} color="#cf3a64" style={{ marginTop: 4 }} />
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
    backgroundColor: 'rgba(48,36,36,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  panel: {
    backgroundColor: '#f2dfe2',
    borderRadius: 16,
    width: 320,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: '#b89fa3',
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
    fontFamily: 'Gaegu-Bold',
    fontSize: 28,
    color: '#3f3232',
  },
  empty: {
    color: '#7e6666',
    fontFamily: 'Gaegu-Bold',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#d9bfc2',
    marginVertical: 8,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notifMessage: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 18,
    color: '#4a3a3a',
  },
  notifTime: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 14,
    color: '#7f6b6b',
    marginTop: 2,
  },
});