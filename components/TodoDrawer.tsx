import { useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Dimensions } from 'react-native';
import { ScrollView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '../constants/colors';
import { usePointColor } from '../hooks/usePointColor';
import { IconCheck, IconClose, IconPerson, IconPlus, IconChevronUp } from './icons';
import { MissionRow } from '../db/missionDb';

export const DRAWER_HEIGHT_RATIO = 1 / 3;
export const HANDLE_HEIGHT = 46;

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

  return sections;
}

function TodoRow({ item, dragging, onToggle, onDelete, onEdit, onDragStart, onDragUpdate, onDragEnd }: {
  item: MissionRow; dragging: boolean; onToggle: () => void; onDelete: () => void; onEdit: () => void;
  onDragStart: (item: MissionRow, x: number, y: number) => void;
  onDragUpdate: (x: number, y: number) => void;
  onDragEnd: (item: MissionRow, x: number, y: number) => void;
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

  const tapGesture = Gesture.Tap()
    .maxDuration(240)
    .onEnd(() => onEdit());

  const dragGesture = Gesture.Pan()
    .activateAfterLongPress(260)
    .onStart((e) => onDragStart(item, e.absoluteX, e.absoluteY))
    .onUpdate((e) => onDragUpdate(e.absoluteX, e.absoluteY))
    .onFinalize((e) => onDragEnd(item, e.absoluteX, e.absoluteY));

  const rowGesture = Gesture.Race(tapGesture, dragGesture);

  return (
    <GestureDetector gesture={rowGesture}>
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
    </GestureDetector>
  );
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

interface Props {
  expanded: boolean;
  onToggle: () => void;
  missions: MissionRow[]; // unscheduled items for the currently selected date
  categories: string[];
  onAdd: (category?: string) => void;
  onToggleItem: (id: number) => void;
  onDeleteItem: (id: number) => void;
  onEditItem: (item: MissionRow) => void;
  onItemDragStart: (item: MissionRow, x: number, y: number) => void;
  onItemDragUpdate: (x: number, y: number) => void;
  onItemDragEnd: (item: MissionRow, x: number, y: number) => void;
  draggingId: number | null;
}

export default function TodoDrawer({
  expanded, onToggle, missions, categories, onAdd, onToggleItem, onDeleteItem, onEditItem,
  onItemDragStart, onItemDragUpdate, onItemDragEnd, draggingId,
}: Props) {
  const pointColor = usePointColor();
  const anim = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const screenHeight = Dimensions.get('window').height;
  const expandedHeight = screenHeight * DRAWER_HEIGHT_RATIO;

  useEffect(() => {
    Animated.spring(anim, { toValue: expanded ? 1 : 0, useNativeDriver: false, bounciness: 4 }).start();
  }, [expanded]);

  const sections = useMemo(() => buildCategorySections(missions, categories), [missions, categories]);

  const tapGesture = Gesture.Tap()
    .maxDuration(240)
    .onEnd(() => onToggle());

  const swipeGesture = Gesture.Pan()
    .onEnd((e) => {
      if (!expanded && e.translationY < -20) onToggle();
      else if (expanded && e.translationY > 20) onToggle();
    });

  const handleGesture = Gesture.Race(tapGesture, swipeGesture);

  const height = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [HANDLE_HEIGHT, expandedHeight],
  });

  return (
    <Animated.View style={[styles.drawer, { height }]}>
      <GestureDetector gesture={handleGesture}>
        <View style={styles.handleArea}>
          <View style={styles.handleBar} />
          <View style={styles.handleRow}>
            <Text style={styles.handleLabel}>할 일{missions.length > 0 ? ` ${missions.length}` : ''}</Text>
            <Animated.View style={{
              transform: [{ rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }],
            }}>
              <IconChevronUp size={16} color={Colors.textSecondary} />
            </Animated.View>
          </View>
        </View>
      </GestureDetector>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {sections.map((section) => (
          <View key={section.key} style={styles.catSection}>
            <CategoryHeader
              label={section.label}
              onAdd={section.addable ? () => onAdd(section.key) : undefined}
            />
            {section.data.map((item) => (
              <TodoRow
                key={item.id}
                item={item}
                dragging={draggingId === item.id}
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
          <View style={styles.empty}>
            <Text style={styles.emptyText}>할일이 없어요</Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16,
    elevation: 12,
  },
  handleArea: {
    height: HANDLE_HEIGHT, justifyContent: 'center',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  handleBar: {
    alignSelf: 'center', width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, marginBottom: 6,
  },
  handleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  handleLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 4 },

  catSection: { marginBottom: 16, gap: 6 },
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
  todoTitleDone: { color: Colors.textMuted },

  empty: { alignItems: 'center', paddingTop: 24 },
  emptyText: { fontSize: 12, color: Colors.textMuted },
});
