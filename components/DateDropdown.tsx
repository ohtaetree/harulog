import { useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { usePointColor } from '../hooks/usePointColor';
import { IconChevronLeft, IconChevronRight, IconChevronDown } from './icons';
import {
  labelMonth,
  getCalendarDates, getMonthFirst, offsetMonth,
  DOW_LABELS,
} from '../utils/dateUtils';

interface Props {
  date: string;
  label: string;
  onApply: (date: string) => void;
}

export default function DateDropdown({ date, label, onApply }: Props) {
  const pointColor = usePointColor();
  const [visible,  setVisible]  = useState(false);
  const [selDate,  setSelDate]  = useState(date);
  const [calMonth, setCalMonth] = useState(getMonthFirst(date));

  const open = () => {
    setSelDate(date);
    setCalMonth(getMonthFirst(date));
    setVisible(true);
  };

  const apply = () => {
    onApply(selDate);
    setVisible(false);
  };

  const calDates = getCalendarDates(calMonth);
  const today    = new Date().toISOString().slice(0, 10);

  const selectCell = (d: string) => {
    setSelDate(d);
    setCalMonth(getMonthFirst(d));
  };

  return (
    <>
      <Pressable onPress={open} style={styles.chip} hitSlop={8}>
        <Text style={styles.chipText}>{label}</Text>
        <IconChevronDown size={14} color={Colors.textSecondary} />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <View style={styles.panel}>

          {/* 월 이동 */}
          <View style={styles.monthNav}>
            <Pressable onPress={() => setCalMonth(offsetMonth(calMonth, -1))} hitSlop={12}>
              <IconChevronLeft size={22} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.monthLabel}>{labelMonth(calMonth)}</Text>
            <Pressable onPress={() => setCalMonth(offsetMonth(calMonth, 1))} hitSlop={12}>
              <IconChevronRight size={22} color={Colors.textPrimary} />
            </Pressable>
          </View>

          {/* 요일 헤더 */}
          <View style={styles.dowRow}>
            {DOW_LABELS.map((d) => (
              <Text key={d} style={styles.dowText}>{d}</Text>
            ))}
          </View>

          {/* 달력 그리드 */}
          {Array.from({ length: 6 }, (_, row) => (
            <View key={row} style={styles.calRow}>
              {Array.from({ length: 7 }, (_, col) => {
                const { date: d, isCurrentMonth } = calDates[row * 7 + col];
                const sel    = d === selDate;
                const isToday = d === today;
                return (
                  <Pressable key={d} onPress={() => selectCell(d)}
                    style={[styles.cell, sel && { backgroundColor: pointColor }]}>
                    <Text style={[
                      styles.cellText,
                      !isCurrentMonth && styles.cellDim,
                      sel         && styles.cellTextSel,
                      isToday && !sel && { color: pointColor, fontWeight: '700' },
                    ]}>
                      {parseInt(d.slice(8), 10)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}

          {/* 적용 */}
          <Pressable style={[styles.applyBtn, { backgroundColor: pointColor }]} onPress={apply}>
            <Text style={styles.applyText}>적용</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  panel: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36, gap: 12,
  },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  monthLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  dowRow: { flexDirection: 'row' },
  dowText: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: Colors.textMuted },

  calRow: { flexDirection: 'row' },
  cell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  cellText: { fontSize: 14, color: Colors.textPrimary },
  cellDim:  { color: Colors.textMuted },
  cellTextSel: { color: '#fff', fontWeight: '700' },

  applyBtn: {
    marginTop: 4,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  applyText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
