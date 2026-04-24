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
            <Text style={styles.panelTitle}>Craft Streak</Text>
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
    backgroundColor: 'rgba(48,36,36,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  panel: {
    backgroundColor: '#f2dfe2',
    borderRadius: 16,
    width: 320,
    padding: 16,
    borderWidth: 1,
    borderColor: '#b89fa3',
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
  streakNumber: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 54,
    textAlign: 'center',
    color: '#5c3d3d',
  },
  streakLabel: {
    fontFamily: 'Gaegu-Bold',
    fontSize: 20,
    textAlign: 'center',
    color: '#6f5757',
    marginTop: 4,
  },
});