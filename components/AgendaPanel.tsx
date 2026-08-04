import { useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Dimensions } from 'react-native';
import { ScrollView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '../constants/colors';
import { usePointColor } from '../hooks/usePointColor';
import { IconCheck, IconClose, IconPerson, IconPlus, IconChevronUp } from './icons';
import { MissionRow } from '../db/missionDb';

export const HANDLE_HEIGHT = 46;
export const PANEL_HEIGHT_RATIO = 1 / 3;

type CategorySection = { key: string; label: string; data: MissionRow[]; addable: boolean };

function buildCategorySections(missions: MissionRow[], categories: string[]): CategorySection[] {
  const byCat = new Map<string, MissionRow[]>();
  for (const m of missions) {
    const key = m.category || '__uncategorized__';
    if (!byCat.has(key)) byCat.set(key, []);
    byCat.get(key)!.push(m);
  }

  const sections: CategorySection[] = categories.map((c) => ({
    key: c, label: c, data: byCat.get(c) ?? [], addable: true,
  }));

  for (const [key, data] of byCat) {
    if (key === '__uncategorized__' || categories.includes(key)) continue;
    sections.push({ key, label: key, data, addable: true });
  }

  const uncategorized = byCat.get('__uncategorized__');
  if (uncategorized?.length) {
    sections.push({ key: '__uncategorized__', label: '미분류', data: uncategorized, addable: false });
  }

  return sections.filter((s) => s.data.length > 0 || s.key !== '__uncategorized__');
}

function CategoryHeader({ label, onAdd }: { label: string; onAdd?: () => void }) {
  const pointColor = usePointColor();
  return (
    <View style={styles.catPill}>
      <View style={styles.catPillIconWrap}>
        <IconPerson size={13} color={Colors.textSecondary} />
      </View>
      <Text style={styles.catPillLabel}>{label}</Text>
      {onAdd && (
        <Pressable style={styles.catAddBtn} onPress={onAdd} hitSlop={8}>
          <IconPlus size={13} color={pointColor} />
        </Pressable>
      )}
    </View>
  );
}

function TodoRow({ item, dragging, draggable, onToggle, onDelete, onEdit, onDragStart, onDragUpdate, onDragEnd }: {
  item: MissionRow; dragging: boolean; draggable: boolean;
  onToggle: () => void; onDelete: () => void; onEdit: () => void;
  onDragStart?: (item: MissionRow, x: number, y: number) => void;
  onDragUpdate?: (x: number, y: number) => void;
  onDragEnd?: (item: MissionRow, x: number, y: number) => void;
}) {
  const pointColor = usePointColor();
  const scale = useRef(new Animated.Value(1)).current;
  const done = item.done === 1;

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  const tapGesture = Gesture.Tap().maxDuration(240).onEnd(() => onEdit());
  const dragGesture = Gesture.Pan()
    .activateAfterLongPress(260)
    .onStart((e) => onDragStart?.(item, e.absoluteX, e.absoluteY))
    .onUpdate((e) => onDragUpdate?.(e.absoluteX, e.absoluteY))
    .onFinalize((e) => onDragEnd?.(item, e.absoluteX, e.absoluteY));
  const rowGesture = Gesture.Race(tapGesture, dragGesture);

  const body = (
    <Animated.View style={[styles.todoRow, dragging && styles.todoRowDragging, { transform: [{ scale }] }]}>
      <Pressable onPress={handleToggle} hitSlop={6}>
        <View style={[styles.todoBadge, done && { backgroundColor: pointColor, borderColor: pointColor }]}>
          {done && <IconCheck size={13} color="#fff" />}
        </View>
      </Pressable>
      <View style={styles.todoBody}>
        <Text style={[styles.todoTitle, done && styles.todoTitleDone]} numberOfLines={2}>{item.title}</Text>
      </View>
      <Pressable onPress={onDelete} hitSlop={10}>
        <IconClose size={13} color={Colors.textMuted} />
      </Pressable>
    </Animated.View>
  );

  if (!draggable) {
    return <Pressable onPress={onEdit}>{body}</Pressable>;
  }

  return <GestureDetector gesture={rowGesture}>{body}</GestureDetector>;
}

interface Props {
  date: string;
  missions: MissionRow[]; // all missions (timed + untimed) for `date`
  categories: string[];
  expanded: boolean;
  onToggle: () => void;
  onEditItem: (item: MissionRow) => void;
  onAdd: (category?: string) => void;
  onToggleItem: (id: number) => void;
  onDeleteItem: (id: number) => void;
  draggable?: boolean;
  onItemDragStart?: (item: MissionRow, x: number, y: number) => void;
  onItemDragUpdate?: (x: number, y: number) => void;
  onItemDragEnd?: (item: MissionRow, x: number, y: number) => void;
  draggingId?: number | null;
}

export default function AgendaPanel({
  date, missions, categories, expanded, onToggle, onEditItem, onAdd, onToggleItem, onDeleteItem,
  draggable, onItemDragStart, onItemDragUpdate, onItemDragEnd, draggingId,
}: Props) {
  const pointColor = usePointColor();
  const anim = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const screenHeight = Dimensions.get('window').height;
  const expandedHeight = screenHeight * PANEL_HEIGHT_RATIO;

  useEffect(() => {
    Animated.spring(anim, { toValue: expanded ? 1 : 0, useNativeDriver: false, bounciness: 4 }).start();
  }, [expanded]);

  const timed = useMemo(() => missions
    .filter((m) => !!m.start_time)
    .sort((a, b) => a.start_time!.localeCompare(b.start_time!)), [missions]);
  const untimed = useMemo(() => missions.filter((m) => !m.start_time), [missions]);
  const sections = useMemo(() => buildCategorySections(untimed, categories), [untimed, categories]);

  const tapGesture = Gesture.Tap().maxDuration(240).onEnd(() => onToggle());
  const swipeGesture = Gesture.Pan()
    .onEnd((e) => {
      if (!expanded && e.translationY < -20) onToggle();
      else if (expanded && e.translationY > 20) onToggle();
    });
  const handleGesture = Gesture.Race(tapGesture, swipeGesture);

  const height = anim.interpolate({ inputRange: [0, 1], outputRange: [HANDLE_HEIGHT, expandedHeight] });

  return (
    <Animated.View style={[styles.panel, { height }]}>
      <GestureDetector gesture={handleGesture}>
        <View style={styles.handleArea}>
          <View style={styles.handleBar} />
          <View style={styles.handleRow}>
            <Text style={styles.handleLabel}>일정</Text>
            <Animated.View style={{
              transform: [{ rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }],
            }}>
              <IconChevronUp size={16} color={Colors.textSecondary} />
            </Animated.View>
          </View>
        </View>
      </GestureDetector>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {timed.map((m) => (
          <Pressable key={m.id} style={styles.timedRow} onPress={() => onEditItem(m)}>
            <Text style={styles.timedTime}>{m.start_time}</Text>
            <View style={[styles.timedBar, { backgroundColor: pointColor }]} />
            <Text style={[styles.timedTitle, m.done === 1 && styles.timedTitleDone]} numberOfLines={1}>{m.title}</Text>
          </Pressable>
        ))}

        {timed.length > 0 && sections.length > 0 && <View style={styles.divider} />}

        {sections.map((section) => (
          <View key={section.key} style={styles.catSection}>
            <CategoryHeader label={section.label} onAdd={section.addable ? () => onAdd(section.key) : undefined} />
            {section.data.map((item) => (
              <TodoRow
                key={item.id}
                item={item}
                dragging={draggingId === item.id}
                draggable={!!draggable}
                onToggle={() => onToggleItem(item.id)}
                onDelete={() => onDeleteItem(item.id)}
                onEdit={() => onEditItem(item)}
                onDragStart={onItemDragStart}
                onDragUpdate={onItemDragUpdate}
                onDragEnd={onItemDragEnd}
              />
            ))}
          </View>
        ))}

        {missions.length === 0 && (
          <Text style={styles.empty}>예정된 일정이 없어요</Text>
        )}
      </ScrollView>

      {expanded && (
        <Pressable style={styles.addBtn} onPress={() => onAdd()}>
          <IconPlus size={15} color={Colors.textSecondary} />
          <Text style={styles.addBtnText}>새로운 일정</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.border,
    overflow: 'hidden',
  },
  handleArea: {
    height: HANDLE_HEIGHT, justifyContent: 'center',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: 16,
  },
  handleBar: {
    position: 'absolute', top: 6, left: '50%', marginLeft: -18,
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
  },
  handleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingTop: 6,
  },
  handleLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, gap: 2 },

  timedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 9,
  },
  timedTime: { width: 42, fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  timedBar: { width: 3, height: 16, borderRadius: 2 },
  timedTitle: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  timedTitleDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },

  catSection: { marginBottom: 14, gap: 6 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface, borderRadius: 20,
    paddingVertical: 5, paddingHorizontal: 6, paddingRight: 5,
  },
  catPillIconWrap: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  catPillLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  catAddBtn: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },

  todoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 2, gap: 8,
  },
  todoRowDragging: { opacity: 0.3 },
  todoBadge: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  todoBody: { flex: 1 },
  todoTitle: { fontSize: 13, color: Colors.textPrimary, lineHeight: 18 },
  todoTitleDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },

  empty: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingTop: 24 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginHorizontal: 16, marginBottom: 12,
    paddingVertical: 11, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
});
