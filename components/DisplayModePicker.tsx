import { useEffect, useRef } from 'react';
import { Modal, Pressable, View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors } from '../constants/colors';
import { usePointColor } from '../hooks/usePointColor';
import { IconCheck } from './icons';
import { DayDisplayMode } from '../stores/settingsStore';

const OPTIONS: { key: DayDisplayMode; label: string }[] = [
  { key: 'icon', label: '아이콘만 표시' },
  { key: 'icon-text', label: '아이콘 + 일정 표시' },
  { key: 'text', label: '일정만 표시' },
];

const DROPDOWN_WIDTH = 200;

interface Anchor { x: number; y: number; width: number; height: number; }

interface Props {
  visible: boolean;
  value: DayDisplayMode;
  anchor: Anchor | null;
  onSelect: (mode: DayDisplayMode) => void;
  onClose: () => void;
}

export default function DisplayModePicker({ visible, value, anchor, onSelect, onClose }: Props) {
  const pointColor = usePointColor();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible || !anchor) return null;

  const screenWidth = Dimensions.get('window').width;
  const left = Math.max(12, Math.min(anchor.x, screenWidth - DROPDOWN_WIDTH - 12));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        style={[
          styles.dropdown,
          {
            top: anchor.y + anchor.height + 8,
            left,
            width: DROPDOWN_WIDTH,
            opacity: anim,
            transform: [
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
              { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
            ],
          },
        ]}>
        {OPTIONS.map((opt, i) => {
          const active = opt.key === value;
          return (
            <Pressable
              key={opt.key}
              style={[styles.row, i === OPTIONS.length - 1 && styles.rowLast]}
              onPress={() => { onSelect(opt.key); onClose(); }}>
              <Text style={[styles.rowLabel, active && { color: pointColor, fontWeight: '700' }]}>
                {opt.label}
              </Text>
              {active && <IconCheck size={14} color={pointColor} />}
            </Pressable>
          );
        })}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    position: 'absolute',
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    paddingVertical: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20,
    elevation: 12,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 13.5, color: Colors.textPrimary },
});
