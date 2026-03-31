import { Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StreakModal({ visible, onClose, streak }) {
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
            <Text style={styles.panelTitle}>Craft Streak 🔥</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={20} color="#333" />
            </Pressable>
          </View>

          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>days in a row</Text>
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
  streakNumber: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    color: '#6C63FF',
  },
  streakLabel: {
    fontSize: 14,
    textAlign: 'center',
    color: '#888',
    marginTop: 4,
  },
});