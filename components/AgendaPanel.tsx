import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Dimensions, TextInput, Keyboard, Platform } from 'react-native';
import { ScrollView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '../constants/colors';
import { usePointColor } from '../hooks/usePointColor';
import { useSettingsStore } from '../stores/settingsStore';
import { getCategoryIconByKey } from '../utils/categoryIcon';
import { IconCheck, IconClose, IconPlus } from './icons';
import { MissionRow } from '../db/missionDb';

export const HANDLE_HEIGHT = 46;
export const PANEL_HEIGHT_RATIO = 1 / 3;

export interface AgendaEditorDraft {
  mode: 'add' | 'edit';
  itemId?: number;
  date: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  timed: boolean;
  startTime: string;
  endTime: string;
}

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
    sections.push({ key: '__uncategorized__', label: '미분류', data: uncategorized, addable: true });
  }

  return sections.filter((s) => s.data.length > 0);
}

function CategoryHeader({ label, onAdd }: { label: string; onAdd?: () => void }) {
  const pointColor = usePointColor();
  const meta = useSettingsStore((s) => s.categoryMeta[label]);
  const Icon = getCategoryIconByKey(meta?.icon);
  return (
    <View style={styles.catPill}>
      <View style={styles.catPillIconWrap}>
        <Icon size={13} color={meta?.color ?? Colors.textSecondary} />
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
  const didDragRef = useRef(false);
  const done = item.done === 1;

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  const dragGesture = Gesture.Pan()
    .activateAfterLongPress(260)
    .onStart((e) => { didDragRef.current = true; onDragStart?.(item, e.absoluteX, e.absoluteY); })
    .onUpdate((e) => onDragUpdate?.(e.absoluteX, e.absoluteY))
    .onFinalize((e, success) => {
      if (success) onDragEnd?.(item, e.absoluteX, e.absoluteY);
      setTimeout(() => { didDragRef.current = false; }, 0);
    })
    .runOnJS(true);

  const body = (
    <Animated.View style={[styles.todoRow, dragging && styles.todoRowDragging, { transform: [{ scale }] }]}>
      <Pressable onPress={handleToggle} hitSlop={6}>
        <View style={[styles.todoBadge, done && { backgroundColor: pointColor, borderColor: pointColor }]}>
          {done && <IconCheck size={13} color="#fff" />}
        </View>
      </Pressable>
      <Pressable style={styles.todoBody} onPress={() => { if (!didDragRef.current) onEdit(); }}>
        <Text style={[styles.todoTitle, done && styles.todoTitleDone]} numberOfLines={2}>{item.title}</Text>
      </Pressable>
      <Pressable onPress={onDelete} hitSlop={10}>
        <IconClose size={13} color={Colors.textMuted} />
      </Pressable>
    </Animated.View>
  );

  if (!draggable) {
    return <Pressable onPress={onEdit}>{body}</Pressable>;
  }

  return <GestureDetector gesture={dragGesture}>{body}</GestureDetector>;
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
  editor?: AgendaEditorDraft | null;
  onEditorChange?: (draft: AgendaEditorDraft) => void;
  onEditorSave?: () => void;
  onEditorCancel?: () => void;
  onEditorDelete?: () => void;
  onQuickAddTodo?: (title: string, category: string) => void;
  availableHeight?: number;
}

export default function AgendaPanel({
  date, missions, categories, expanded, onToggle, onEditItem, onAdd, onToggleItem, onDeleteItem,
  draggable, onItemDragStart, onItemDragUpdate, onItemDragEnd, draggingId,
  editor, onEditorChange, onEditorSave, onEditorCancel, onQuickAddTodo,
  onEditorDelete,
  availableHeight,
}: Props) {
  const pointColor = usePointColor();
  const screenHeight = Dimensions.get('window').height;
  const fullHeight = availableHeight || screenHeight;
  const expandedHeight = Math.min(screenHeight * PANEL_HEIGHT_RATIO, fullHeight);
  const panelHeight = useRef(new Animated.Value(expanded ? expandedHeight : HANDLE_HEIGHT)).current;
  const currentHeightRef = useRef(expanded ? expandedHeight : HANDLE_HEIGHT);
  const dragStartHeightRef = useRef(currentHeightRef.current);
  const [full, setFull] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const viewportHeightRef = useRef(0);
  const [inlineCategory, setInlineCategory] = useState<string | null>(null);
  const [inlineTitle, setInlineTitle] = useState('');
  const isFullscreen = full || !!editor || keyboardVisible;

  useEffect(() => {
    const id = panelHeight.addListener(({ value }) => { currentHeightRef.current = value; });
    return () => panelHeight.removeListener(id);
  }, [panelHeight]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
      const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
      return () => { show.remove(); hide.remove(); };
    }

    const viewport = typeof window !== 'undefined' ? window.visualViewport : undefined;
    if (!viewport) return;
    viewportHeightRef.current = viewport.height;
    const syncKeyboard = () => {
      const baseline = viewportHeightRef.current;
      const nextVisible = viewport.height < baseline - 100;
      setKeyboardVisible(nextVisible);
    };
    viewport.addEventListener('resize', syncKeyboard);
    syncKeyboard();
    return () => viewport.removeEventListener('resize', syncKeyboard);
  }, []);

  useEffect(() => {
    const target = isFullscreen ? fullHeight : expanded ? expandedHeight : HANDLE_HEIGHT;
    Animated.spring(panelHeight, {
      toValue: target,
      damping: 30,
      stiffness: 230,
      mass: 1,
      overshootClamping: false,
      useNativeDriver: false,
    }).start();
  }, [expanded, expandedHeight, fullHeight, isFullscreen, keyboardVisible, panelHeight]);

  useEffect(() => {
    if (!expanded) setFull(false);
  }, [expanded]);

  const timed = useMemo(() => missions
    .filter((m) => !!m.start_time)
    .sort((a, b) => a.start_time!.localeCompare(b.start_time!)), [missions]);
  const untimed = useMemo(() => missions.filter((m) => !m.start_time), [missions]);
  const sections = useMemo(() => buildCategorySections(untimed, categories), [untimed, categories]);

  const applySnapState = (target: number) => {
    const shouldExpand = target > HANDLE_HEIGHT + 1;
    if (shouldExpand !== expanded) onToggle();
    setFull(target >= fullHeight - 1);
  };
  const snapPanel = (target: number, velocityY = 0) => {
    applySnapState(target);
    Animated.spring(panelHeight, {
      toValue: target,
      velocity: -velocityY / 1000,
      damping: 28,
      stiffness: 210,
      mass: 1,
      overshootClamping: false,
      useNativeDriver: false,
    }).start();
  };
  const tapGesture = Gesture.Tap().maxDuration(240).onEnd(() => {
    const current = currentHeightRef.current;
    snapPanel(current < (HANDLE_HEIGHT + expandedHeight) / 2 ? expandedHeight : HANDLE_HEIGHT);
  }).runOnJS(true);
  const swipeGesture = Gesture.Pan()
    .onBegin(() => {
      panelHeight.stopAnimation((value) => {
        dragStartHeightRef.current = value;
        currentHeightRef.current = value;
      });
    })
    .onUpdate((e) => {
      const next = Math.max(HANDLE_HEIGHT, Math.min(fullHeight, dragStartHeightRef.current - e.translationY));
      panelHeight.setValue(next);
    })
    .onEnd((e) => {
      const projected = Math.max(HANDLE_HEIGHT, Math.min(fullHeight, currentHeightRef.current - e.velocityY * 0.16));
      const lowerMid = (HANDLE_HEIGHT + expandedHeight) / 2;
      const upperMid = (expandedHeight + fullHeight) / 2;
      const target = projected < lowerMid ? HANDLE_HEIGHT : projected < upperMid ? expandedHeight : fullHeight;
      snapPanel(target, e.velocityY);
    })
    .runOnJS(true);
  const handleGesture = Gesture.Race(tapGesture, swipeGesture);

  const backdropOpacity = panelHeight.interpolate({
    inputRange: [expandedHeight, fullHeight], outputRange: [0, 0.56], extrapolate: 'clamp',
  });
  const cornerRadius = panelHeight.interpolate({
    inputRange: [HANDLE_HEIGHT, expandedHeight], outputRange: [0, 26], extrapolate: 'clamp',
  });

  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.backdrop, { opacity: backdropOpacity }]} />
      <Animated.View style={[styles.panel, { height: panelHeight, borderTopLeftRadius: cornerRadius, borderTopRightRadius: cornerRadius }]}>
      <View style={[styles.handleArea, editor && styles.editorHandleArea]}>
        <GestureDetector gesture={handleGesture}>
          <View style={styles.handleGestureZone}>
          <View style={styles.handleBar} />
            {!editor && <Text style={styles.handleLabel}>{missions.length === 0 ? '예정된 일정 없음' : '일정'}</Text>}
          </View>
        </GestureDetector>
        {!editor && <Pressable onPress={() => onAdd()} style={styles.handleAdd}><IconPlus size={20} color={Colors.textSecondary} /></Pressable>}
      </View>

      {editor ? (
        <AgendaEditor
          draft={editor}
          categories={categories}
          onChange={onEditorChange!}
          onSave={onEditorSave!}
          onCancel={onEditorCancel!}
          onDelete={onEditorDelete}
        />
      ) : <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
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
            <CategoryHeader label={section.label} onAdd={section.addable ? () => {
              setFull(true);
              setInlineCategory((current) => current === section.key ? null : section.key);
              setInlineTitle('');
            } : undefined} />
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
            {inlineCategory === section.key && (
              <View style={styles.inlineAddRow}>
                <View style={styles.inlineTodoBadge} />
                <TextInput
                  value={inlineTitle}
                  onChangeText={setInlineTitle}
                  placeholder="할 일 입력"
                  placeholderTextColor={Colors.textMuted}
                  style={[styles.inlineInput, { borderBottomColor: pointColor }]}
                  maxLength={60}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    const title = inlineTitle.trim();
                    if (!title) return;
                    onQuickAddTodo?.(title, section.key === '__uncategorized__' ? '' : section.key);
                    setInlineTitle('');
                    setInlineCategory(null);
                  }}
                />
              </View>
            )}
          </View>
        ))}

        {missions.length === 0 && (
          <Text style={styles.empty}>예정된 일정이 없어요</Text>
        )}
      </ScrollView>}

      </Animated.View>
    </>
  );
}

function AgendaEditor({ draft, categories, onChange, onSave, onCancel, onDelete }: {
  draft: AgendaEditorDraft;
  categories: string[];
  onChange: (draft: AgendaEditorDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const pointColor = usePointColor();
  const patch = (next: Partial<AgendaEditorDraft>) => onChange({ ...draft, ...next });
  const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  const timeValid = !draft.timed || (validTime(draft.startTime) && validTime(draft.endTime)
    && draft.endTime > draft.startTime);
  const saveDisabled = !draft.title.trim() || !timeValid;
  return (
    <ScrollView style={styles.editorScroll} contentContainerStyle={styles.editor} keyboardShouldPersistTaps="handled">
      <View style={styles.editorHeader}>
        <Text style={styles.editorEyebrow}>이벤트</Text>
        <View style={styles.editorHeaderActions}>
          {draft.mode === 'edit' && <Text style={styles.editorMore}>•••</Text>}
          <Pressable style={styles.editorClose} onPress={onCancel}><IconClose size={22} color={Colors.textPrimary} /></Pressable>
        </View>
      </View>

      <TextInput
        value={draft.title}
        onChangeText={(title) => patch({ title })}
        placeholder="제목"
        placeholderTextColor={Colors.textMuted}
        style={styles.editorTitleInput}
        maxLength={60}
      />

      <View style={styles.editorSwitchRow}>
        <Text style={styles.editorLabel}>시간 지정</Text>
        <Pressable
          onPress={() => patch({ timed: !draft.timed, startTime: draft.startTime || '09:00', endTime: draft.endTime || '09:30' })}
          style={[styles.editorSwitch, draft.timed && { backgroundColor: pointColor }]}
        ><View style={[styles.editorKnob, draft.timed && styles.editorKnobActive]} /></Pressable>
      </View>

      {draft.timed && <View style={styles.editorTimeRow}>
        <View style={styles.editorTimeField}><Text style={styles.editorTimeLabel}>시작</Text><TextInput value={draft.startTime} onChangeText={(startTime) => patch({ startTime })} style={styles.editorTimeInput} keyboardType="numbers-and-punctuation" maxLength={5} /></View>
        <Text style={styles.editorTimeArrow}>→</Text>
        <View style={styles.editorTimeField}><Text style={styles.editorTimeLabel}>종료</Text><TextInput value={draft.endTime} onChangeText={(endTime) => patch({ endTime })} style={styles.editorTimeInput} keyboardType="numbers-and-punctuation" maxLength={5} /></View>
      </View>}
      {!timeValid && <Text style={styles.editorError}>시간은 HH:MM 형식으로 입력하고 종료 시간을 시작 이후로 설정해 주세요.</Text>}

      <Text style={styles.editorDate}>{draft.date.replaceAll('-', '.')}</Text>

      <Text style={styles.editorLabel}>카테고리</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.editorChips}>
        {['', ...categories].map((category) => {
          const active = draft.category === category;
          return <Pressable key={category || '__none'} onPress={() => patch({ category })} style={[styles.editorChip, active && { backgroundColor: pointColor, borderColor: pointColor }]}><Text style={[styles.editorChipText, active && styles.editorChipTextActive]}>{category || '없음'}</Text></Pressable>;
        })}
      </ScrollView>

      <Text style={styles.editorLabel}>우선순위</Text>
      <View style={styles.editorPriorityRow}>
        {([['high', '높음'], ['medium', '보통'], ['low', '낮음']] as const).map(([priority, label]) => {
          const active = draft.priority === priority;
          return <Pressable key={priority} onPress={() => patch({ priority })} style={[styles.editorPriority, active && { borderColor: pointColor, backgroundColor: `${pointColor}12` }]}><Text style={[styles.editorPriorityText, active && { color: pointColor }]}>{label}</Text></Pressable>;
        })}
      </View>

      <Pressable style={[styles.editorDone, { backgroundColor: pointColor }, saveDisabled && styles.editorSaveDisabled]} disabled={saveDisabled} onPress={onSave}>
        <Text style={styles.editorDoneText}>{draft.mode === 'edit' ? '수정 완료' : '일정 추가'}</Text>
      </Pressable>

      {draft.mode === 'edit' && onDelete && <Pressable style={styles.editorDelete} onPress={onDelete}><Text style={styles.editorDeleteText}>일정 삭제</Text></Pressable>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: Colors.border,
    overflow: 'hidden',
    zIndex: 4,
    elevation: 12,
  },
  backdrop: { position: 'absolute', top: -200, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.56)', zIndex: 3 },
  handleArea: {
    height: HANDLE_HEIGHT, justifyContent: 'center',
    paddingHorizontal: 20,
  },
  editorHandleArea: { height: 24 },
  handleGestureZone: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 20, paddingTop: 8 },
  handleBar: {
    position: 'absolute', top: 6, left: '50%', marginLeft: -18,
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: Colors.border,
  },
  handleLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  handleAdd: { position: 'absolute', right: 18, top: 8, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F1F3' },

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

  inlineAddRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingLeft: 2, paddingBottom: 5 },
  inlineTodoBadge: { width: 22, height: 22, borderRadius: 6, backgroundColor: Colors.border },
  inlineInput: { flex: 1, minHeight: 38, borderBottomWidth: 2, paddingHorizontal: 1, paddingVertical: 4, fontSize: 15, color: Colors.textPrimary, backgroundColor: Colors.background },
  editorScroll: { flex: 1 },
  editor: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 34, gap: 20 },
  editorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editorHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  editorEyebrow: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  editorMore: { fontSize: 18, fontWeight: '900', letterSpacing: 2, color: Colors.textPrimary },
  editorDate: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, paddingLeft: 76 },
  editorClose: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F1F3' },
  editorDone: { height: 48, borderRadius: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  editorDoneText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  editorTitleInput: { minHeight: 70, borderBottomWidth: 1, borderBottomColor: Colors.border, fontSize: 25, fontWeight: '500', color: Colors.textPrimary, paddingVertical: 12 },
  editorLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  editorSwitchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editorSwitch: { width: 44, height: 26, borderRadius: 13, backgroundColor: Colors.border, padding: 3 },
  editorKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  editorKnobActive: { transform: [{ translateX: 18 }] },
  editorTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editorTimeField: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  editorTimeLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  editorTimeInput: { marginTop: 2, padding: 0, fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  editorTimeArrow: { fontSize: 18, color: Colors.textMuted },
  editorError: { marginTop: -7, fontSize: 11, lineHeight: 16, color: '#D33' },
  editorChips: { gap: 7 },
  editorChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
  editorChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  editorChipTextActive: { color: '#fff' },
  editorPriorityRow: { flexDirection: 'row', gap: 7 },
  editorPriority: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  editorPriorityText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  editorDelete: { marginTop: 8, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 13, alignItems: 'center', backgroundColor: '#FFF0F0' },
  editorDeleteText: { color: '#D33', fontSize: 14, fontWeight: '800' },
  editorSaveDisabled: { opacity: 0.4 },
});
