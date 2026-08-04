import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { usePointColor } from '../hooks/usePointColor';
import { useSettingsStore } from '../stores/settingsStore';
import { getMissions, MissionRow } from '../db/missionDb';
import { getCalendarDates, getMonthFirst, DOW_LABELS, todayStr } from '../utils/dateUtils';
import { getCategoryIcon } from '../utils/categoryIcon';

interface Props {
  date: string;
  selectedDate: string;
  onSelect: (date: string) => void;
}

const MAX_VISIBLE = 2;

export default function MonthCalendar({ date, selectedDate, onSelect }: Props) {
  const pointColor = usePointColor();
  const categories = useSettingsStore((s) => s.categories);
  const dayDisplayMode = useSettingsStore((s) => s.dayDisplayMode);
  const today = todayStr();
  const calDates = getCalendarDates(getMonthFirst(date));

  return (
    <View style={styles.wrap}>
      <View style={styles.dowRow}>
        {DOW_LABELS.map((d) => (
          <Text key={d} style={styles.dowText}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {Array.from({ length: 6 }, (_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: 7 }, (_, col) => {
              const { date: d, isCurrentMonth } = calDates[row * 7 + col];
              const isToday = d === today;
              const isSelected = d === selectedDate;
              const dayMissions = getMissions(d);

              return (
                <Pressable key={d} onPress={() => onSelect(d)} style={styles.cell}>
                  <View style={[styles.dateCircle, isSelected && { backgroundColor: pointColor }]}>
                    <Text style={[
                      styles.dateText,
                      !isCurrentMonth && styles.dateDim,
                      isSelected && styles.dateTextSel,
                      isToday && !isSelected && { color: pointColor, fontWeight: '800' },
                    ]}>
                      {parseInt(d.slice(8), 10)}
                    </Text>
                  </View>

                  <DayContent mode={dayDisplayMode} missions={dayMissions} categories={categories} />
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function DayContent({ mode, missions, categories }: {
  mode: 'icon' | 'icon-text' | 'text'; missions: MissionRow[]; categories: string[];
}) {
  if (missions.length === 0) return null;

  if (mode === 'icon') {
    const knownCats = categories.filter((c) => missions.some((m) => m.category === c));
    const extraCats = Array.from(new Set(
      missions.map((m) => m.category).filter((c) => c && !categories.includes(c))
    ));
    const dayCats = [...knownCats, ...extraCats];
    const shown = dayCats.slice(0, MAX_VISIBLE);
    const overflow = dayCats.length - shown.length;

    return (
      <View style={styles.iconColumn}>
        {shown.map((cat) => {
          const Icon = getCategoryIcon(cat);
          return <Icon key={cat} size={14} color={Colors.textSecondary} />;
        })}
        {overflow > 0 && <Text style={styles.overflowText}>+{overflow}</Text>}
      </View>
    );
  }

  const shown = missions.slice(0, MAX_VISIBLE);
  const overflow = missions.length - shown.length;

  if (mode === 'text') {
    return (
      <View style={styles.textColumn}>
        {shown.map((m) => (
          <View key={m.id} style={styles.textChip}>
            <Text numberOfLines={1} style={styles.textChipLabel}>{m.title}</Text>
          </View>
        ))}
        {overflow > 0 && <Text style={styles.overflowText}>+{overflow}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.textColumn}>
      {shown.map((m) => {
        const Icon = getCategoryIcon(m.category);
        return (
          <View key={m.id} style={styles.iconTextRow}>
            <Icon size={11} color={Colors.textSecondary} />
            <Text numberOfLines={1} style={styles.iconTextLabel}>{m.title}</Text>
          </View>
        );
      })}
      {overflow > 0 && <Text style={styles.overflowText}>+{overflow}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 12, paddingTop: 4 },
  dowRow: { flexDirection: 'row', marginBottom: 4 },
  dowText: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  grid: { flex: 1 },
  row: { flex: 1, flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', paddingTop: 6, gap: 4 },
  dateCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  dateDim: { color: Colors.textMuted },
  dateTextSel: { color: '#fff' },

  iconColumn: { alignItems: 'center', gap: 4 },
  overflowText: { fontSize: 10, color: Colors.textMuted, fontWeight: '700' },

  textColumn: { alignItems: 'stretch', gap: 3, width: '100%', paddingHorizontal: 2 },
  textChip: {
    backgroundColor: Colors.surface, borderRadius: 5,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  textChipLabel: { fontSize: 9, color: Colors.textSecondary, fontWeight: '600' },
  iconTextRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconTextLabel: { flex: 1, fontSize: 9, color: Colors.textSecondary, fontWeight: '600' },
});
