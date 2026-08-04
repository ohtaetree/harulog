import { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { usePointColor } from '../hooks/usePointColor';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function pad(n: number) { return String(n).padStart(2, '0'); }

interface Props {
  visible: boolean;
  title: string;
  initial: string | null; // 'HH:mm'
  onClose: () => void;
  onApply: (time: string | null) => void;
}

export default function TimePickerModal({ visible, title, initial, onClose, onApply }: Props) {
  const pointColor = usePointColor();
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);

  useEffect(() => {
    if (!visible) return;
    if (initial) {
      const [h, m] = initial.split(':').map(Number);
      setHour(h); setMinute(m);
    } else {
      setHour(9); setMinute(0);
    }
  }, [visible, initial]);

  const apply = () => onApply(`${pad(hour)}:${pad(minute)}`);
  const clear = () => onApply(null);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.panel}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.preview, { color: pointColor }]}>{pad(hour)}:{pad(minute)}</Text>

        <Text style={styles.secLabel}>시</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {HOURS.map((h) => (
            <Pressable key={h} onPress={() => setHour(h)} style={[styles.chip, h === hour && { backgroundColor: pointColor, borderColor: pointColor }]}>
              <Text style={[styles.chipText, h === hour && styles.chipTextActive]}>{pad(h)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.secLabel}>분</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {MINUTES.map((m) => (
            <Pressable key={m} onPress={() => setMinute(m)} style={[styles.chip, m === minute && { backgroundColor: pointColor, borderColor: pointColor }]}>
              <Text style={[styles.chipText, m === minute && styles.chipTextActive]}>{pad(m)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.btnRow}>
          <Pressable style={styles.clearBtn} onPress={clear}>
            <Text style={styles.clearBtnText}>시간 지정 안함</Text>
          </Pressable>
          <Pressable style={[styles.applyBtn, { backgroundColor: pointColor }]} onPress={apply}>
            <Text style={styles.applyText}>적용</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  panel: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36, gap: 10,
  },
  title: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  preview: { fontSize: 32, fontWeight: '800', marginBottom: 4 },

  secLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginTop: 4 },
  chipRow: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  chipText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  clearBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  clearBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  applyBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  applyText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
