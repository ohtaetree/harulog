import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Colors } from '../constants/colors';
import { usePointColor } from '../hooks/usePointColor';
import { IconCheck, IconPlus } from './icons';
import { MissionRow } from '../db/missionDb';
import { labelFullDate } from '../utils/dateUtils';

interface Props {
  date: string;
  missions: MissionRow[];
  onEditItem: (item: MissionRow) => void;
  onAdd: () => void;
}

export default function DayAgendaPanel({ date, missions, onEditItem, onAdd }: Props) {
  const pointColor = usePointColor();
  const timed = missions
    .filter((m) => !!m.start_time)
    .sort((a, b) => a.start_time!.localeCompare(b.start_time!));
  const untimed = missions.filter((m) => !m.start_time);

  return (
    <View style={styles.wrap}>
      <Text style={styles.dateHeader}>{labelFullDate(date)}</Text>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {timed.map((m) => (
          <Pressable key={m.id} style={styles.row} onPress={() => onEditItem(m)}>
            <Text style={styles.rowTime}>{m.start_time}</Text>
            <View style={[styles.rowBar, { backgroundColor: pointColor }]} />
            <Text style={[styles.rowTitle, m.done === 1 && styles.rowTitleDone]} numberOfLines={1}>{m.title}</Text>
          </Pressable>
        ))}

        {untimed.map((m) => (
          <Pressable key={m.id} style={styles.row} onPress={() => onEditItem(m)}>
            <View style={[styles.rowCheckbox, m.done === 1 && { backgroundColor: pointColor, borderColor: pointColor }]}>
              {m.done === 1 && <IconCheck size={11} color="#fff" />}
            </View>
            <Text style={[styles.rowTitle, m.done === 1 && styles.rowTitleDone]} numberOfLines={1}>{m.title}</Text>
          </Pressable>
        ))}

        {missions.length === 0 && (
          <Text style={styles.empty}>일정이 없어요</Text>
        )}
      </ScrollView>

      <Pressable style={styles.addBtn} onPress={onAdd}>
        <IconPlus size={15} color={Colors.textSecondary} />
        <Text style={styles.addBtnText}>새로운 일정</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 260,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingTop: 10,
  },
  dateHeader: {
    fontSize: 15, fontWeight: '700', color: Colors.textPrimary,
    paddingHorizontal: 16, marginBottom: 6,
  },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 2 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 9,
  },
  rowTime: { width: 42, fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  rowBar: { width: 3, height: 16, borderRadius: 2 },
  rowTitle: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  rowTitleDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  rowCheckbox: {
    width: 18, height: 18, borderRadius: 5, marginLeft: 37,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  empty: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingTop: 24 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginHorizontal: 16, marginBottom: 12,
    paddingVertical: 11, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
});
