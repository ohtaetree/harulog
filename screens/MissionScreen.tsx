import { useEffect, useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, Modal, Animated, Dimensions,
} from 'react-native';
import { ScrollView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMissionStore } from '../stores/missionStore';
import { useSettingsStore } from '../stores/settingsStore';
import { Priority, MissionRow } from '../db/missionDb';
import DateDropdown, { DateDropdownHandle } from '../components/DateDropdown';
import TimePickerModal from '../components/TimePickerModal';
import WeekTimeGridView, { WeekTimeGridHandle } from '../components/WeekTimeGridView';
import MonthCalendar from '../components/MonthCalendar';
import AgendaPanel, { HANDLE_HEIGHT, PANEL_HEIGHT_RATIO } from '../components/AgendaPanel';
import SettingsScreen from './SettingsScreen';
import { IconSearch, IconSettings } from '../components/icons';
import { Colors } from '../constants/colors';
import { useDateFade } from '../hooks/useDateFade';
import { usePointColor } from '../hooks/usePointColor';
import { todayStr, offsetDate, offsetMonth, getDateRange, labelWeek, labelMonth } from '../utils/dateUtils';

const PRIORITY_LABEL: Record<Priority, string> = { high: '높음', medium: '보통', low: '낮음' };

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minutesToTimeStr(min: number) {
  const clamped = Math.max(0, Math.min(min, 24 * 60));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── 추가/수정 모달 ────────────────────────────────────────────────────────────

function AddEditModal({ visible, initial, presetStartTime, presetEndTime, presetCategory, categories, onClose, onSave }: {
  visible: boolean; initial?: MissionRow; presetStartTime?: string; presetEndTime?: string;
  presetCategory?: string; categories: string[];
  onClose: () => void;
  onSave: (title: string, priority: Priority, category: string, startTime: string | null, endTime: string | null) => void;
}) {
  const pointColor = usePointColor();
  const [title, setTitle]       = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('');
  const [customCat, setCustomCat] = useState('');
  const [timed, setTimed]         = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime]     = useState<string | null>(null);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (visible) {
      setTitle(initial?.title ?? '');
      setPriority(initial?.priority ?? 'medium');
      const cat = initial?.category ?? presetCategory ?? '';
      if (categories.includes(cat) || cat === '') {
        setCategory(cat); setCustomCat('');
      } else {
        setCategory('__custom__'); setCustomCat(cat);
      }
      const initStart = initial?.start_time ?? presetStartTime ?? null;
      setTimed(!!initStart);
      setStartTime(initStart);
      setEndTime(initial?.end_time ?? presetEndTime ?? null);
    }
  }, [visible, initial, presetStartTime, presetEndTime, presetCategory]);

  const handleSave = () => {
    const t = title.trim();
    if (!t) return;
    const finalCat = category === '__custom__' ? customCat.trim() : category;
    onSave(t, priority, finalCat, timed ? startTime : null, timed ? endTime : null);
    onClose();
  };

  const toggleTimed = () => {
    setTimed((prev) => {
      const next = !prev;
      if (next && !startTime) setStartTime('09:00');
      return next;
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheetCard}>
        <ScrollView contentContainerStyle={styles.sheet}
          keyboardShouldPersistTaps="handled">
        <Text style={styles.sheetTitle}>{initial ? '할일 수정' : '새 할일'}</Text>

        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="할일을 입력하세요"
          placeholderTextColor={Colors.textMuted}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSave}
          maxLength={60}
        />

        <Text style={styles.secLabel}>우선순위</Text>
        <View style={styles.priorityRow}>
          {(['high', 'medium', 'low'] as Priority[]).map((p) => {
            const dotColor = p === 'high' ? '#EF4444' : p === 'medium' ? pointColor : Colors.textMuted;
            const active = priority === p;
            return (
              <Pressable key={p} onPress={() => setPriority(p)}
                style={[styles.priorityBtn, active && { backgroundColor: dotColor, borderColor: dotColor }]}>
                <View style={[styles.priorityDot, { backgroundColor: active ? '#fff' : dotColor }]} />
                <Text style={[styles.priorityBtnText, active && { color: '#fff' }]}>{PRIORITY_LABEL[p]}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.secLabel}>카테고리</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.catScroll} contentContainerStyle={styles.catContent}>
          <Pressable onPress={() => setCategory('')}
            style={[styles.catChip, category === '' && { backgroundColor: pointColor, borderColor: pointColor }]}>
            <Text style={[styles.catChipText, category === '' && styles.catChipTextActive]}>없음</Text>
          </Pressable>
          {categories.map((c) => (
            <Pressable key={c} onPress={() => setCategory(c)}
              style={[styles.catChip, category === c && { backgroundColor: pointColor, borderColor: pointColor }]}>
              <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>{c}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setCategory('__custom__')}
            style={[styles.catChip, category === '__custom__' && { backgroundColor: pointColor, borderColor: pointColor }]}>
            <Text style={[styles.catChipText, category === '__custom__' && styles.catChipTextActive]}>직접 입력</Text>
          </Pressable>
        </ScrollView>

        {category === '__custom__' && (
          <TextInput
            style={[styles.customCatInput, { borderColor: pointColor }]}
            value={customCat}
            onChangeText={setCustomCat}
            placeholder="카테고리 직접 입력"
            placeholderTextColor={Colors.textMuted}
            maxLength={20}
          />
        )}

        <View style={styles.timedRow}>
          <Text style={styles.secLabel}>시간 지정</Text>
          <Pressable onPress={toggleTimed} style={[styles.timedSwitch, timed && { backgroundColor: pointColor }]}>
            <View style={[styles.timedKnob, timed && styles.timedKnobActive]} />
          </Pressable>
        </View>

        {timed && (
          <View style={styles.timeRow}>
            <Pressable style={styles.timeBtn} onPress={() => setPickerTarget('start')}>
              <Text style={styles.timeBtnLabel}>시작</Text>
              <Text style={styles.timeBtnValue}>{startTime ?? '--:--'}</Text>
            </Pressable>
            <Pressable style={styles.timeBtn} onPress={() => setPickerTarget('end')}>
              <Text style={styles.timeBtnLabel}>종료</Text>
              <Text style={styles.timeBtnValue}>{endTime ?? '미지정'}</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={[styles.saveBtn, { backgroundColor: pointColor }]} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{initial ? '수정' : '추가'}</Text>
        </Pressable>
        </ScrollView>
        </View>
      </View>

      <TimePickerModal
        visible={pickerTarget !== null}
        title={pickerTarget === 'start' ? '시작 시간' : '종료 시간'}
        initial={pickerTarget === 'start' ? startTime : endTime}
        onClose={() => setPickerTarget(null)}
        onApply={(time) => {
          if (pickerTarget === 'start') setStartTime(time);
          else if (pickerTarget === 'end') setEndTime(time);
          setPickerTarget(null);
        }}
      />
    </Modal>
  );
}

// ── 메인 ────────────────────────────────────────────────────────────────────

export default function MissionScreen() {
  const { date, missions, loadDate, add, update, toggle, remove } = useMissionStore();
  const categories = useSettingsStore((s) => s.categories);
  const weekVisibleDays = useSettingsStore((s) => s.weekVisibleDays);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const dateDropdownRef = useRef<DateDropdownHandle>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget,   setEditTarget]   = useState<MissionRow | undefined>();
  const [presetTime,   setPresetTime]   = useState<string | undefined>();
  const [presetEnd,    setPresetEnd]    = useState<string | undefined>();
  const [presetCat,    setPresetCat]    = useState<string | undefined>();
  const [pendingRange, setPendingRange] = useState<{ date: string; startTime: string; endTime: string } | null>(null);

  useEffect(() => { loadDate(todayStr()); }, []);

  const { navigate } = useDateFade(loadDate);

  const weekDates = useMemo(() => getDateRange(date, weekVisibleDays), [date, weekVisibleDays]);

  const makeSnapSwipeGesture = (onPrev: () => void, onNext: () => void) => Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onEnd((e) => {
      if (e.translationX < -40) onNext();
      else if (e.translationX > 40) onPrev();
    });
  const headerSwipeGesture = makeSnapSwipeGesture(
    () => navigate(viewMode === 'week' ? offsetDate(date, -weekVisibleDays) : offsetMonth(date, -1)),
    () => navigate(viewMode === 'week' ? offsetDate(date, weekVisibleDays) : offsetMonth(date, 1)),
  );
  const monthSwipeGesture = makeSnapSwipeGesture(
    () => navigate(offsetMonth(date, -1)),
    () => navigate(offsetMonth(date, 1)),
  );

  const openAdd = (time?: string, category?: string, endTime?: string) => {
    setEditTarget(undefined); setPresetTime(time); setPresetEnd(endTime); setPresetCat(category); setModalVisible(true);
  };
  const openEdit = (item: MissionRow) => {
    setEditTarget(item); setPresetTime(undefined); setPresetEnd(undefined); setPresetCat(undefined); setModalVisible(true);
  };
  const handleSave = (title: string, priority: Priority, category: string, startTime: string | null, endTime: string | null) => {
    if (editTarget) update(editTarget.id, title, priority, category, startTime, endTime);
    else add(title, priority, category, startTime, endTime);
  };

  const [agendaOpen, setAgendaOpen] = useState(false);

  const gridRef = useRef<WeekTimeGridHandle>(null);
  const [dragItem, setDragItem] = useState<MissionRow | null>(null);
  const [dropPreview, setDropPreview] = useState<{ date: string; time: string; durationMin: number } | null>(null);
  const dragDurationRef = useRef(30);
  const ghostX = useRef(new Animated.Value(-1000)).current;
  const ghostY = useRef(new Animated.Value(-1000)).current;

  const durationOf = (item: MissionRow) => {
    if (!item.start_time) return 30;
    const startMin = timeToMinutes(item.start_time);
    const endMin = item.end_time ? timeToMinutes(item.end_time) : startMin + 30;
    return Math.max(endMin - startMin, 15);
  };

  const handleDragStart = (item: MissionRow, source: 'grid' | 'drawer', x: number, y: number) => {
    setDragItem(item);
    dragDurationRef.current = durationOf(item);
    ghostX.setValue(x); ghostY.setValue(y);
  };
  const handleDragUpdate = (x: number, y: number) => {
    ghostX.setValue(x); ghostY.setValue(y);
    gridRef.current?.getDropTarget(x, y, (target) => {
      if (!target) { setDropPreview((p) => (p ? null : p)); return; }
      const next = { date: target.date, time: target.time, durationMin: dragDurationRef.current };
      setDropPreview((p) => (p && p.date === next.date && p.time === next.time && p.durationMin === next.durationMin ? p : next));
    });
  };
  const handleDragEnd = (item: MissionRow, source: 'grid' | 'drawer', x: number, y: number) => {
    setDragItem(null);
    setDropPreview(null);
    ghostX.setValue(-1000); ghostY.setValue(-1000);

    const screenHeight = Dimensions.get('window').height;
    const panelHeight = agendaOpen ? screenHeight * PANEL_HEIGHT_RATIO : HANDLE_HEIGHT;
    const droppedOnDrawer = y > screenHeight - panelHeight;

    if (source === 'grid') {
      if (droppedOnDrawer) {
        // 다른 날짜의 일정을 미분류 처리한 경우, 그 날짜로 화면을 옮겨서 드로어에 바로 보이도록 함
        loadDate(item.date);
        update(item.id, item.title, item.priority, item.category, null, null);
        return;
      }
      // 그리드 안에서 다른 시간/날짜로 재배치 — 기존 소요 시간(길이)은 유지
      gridRef.current?.getDropTarget(x, y, (target) => {
        if (!target) return;
        const startMin = item.start_time ? timeToMinutes(item.start_time) : 0;
        const endMin = item.end_time ? timeToMinutes(item.end_time) : startMin + 30;
        const duration = Math.max(endMin - startMin, 15);
        const newStartMin = timeToMinutes(target.time);
        const newEndTime = minutesToTimeStr(newStartMin + duration);
        update(item.id, item.title, item.priority, item.category, target.time, newEndTime, target.date);
      });
      return;
    }

    if (droppedOnDrawer) return;
    gridRef.current?.getDropTarget(x, y, (target) => {
      if (target) update(item.id, item.title, item.priority, item.category, target.time, null, target.date);
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* 헤더: 날짜(좌) / 전환·검색·설정(우) — 날짜 쪽만 좌우 스와이프로 이전/다음 이동
          (버튼 쪽까지 제스처로 감싸면 웹에서 탭이 씹히는 문제가 있어 버튼 영역은 제외) */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <GestureDetector gesture={headerSwipeGesture}>
            <View style={styles.headerLeft}>
              <DateDropdown
                ref={dateDropdownRef}
                date={date}
                label={viewMode === 'week' ? labelWeek(date) : labelMonth(date)}
                onApply={navigate}
              />
            </View>
          </GestureDetector>

          <View style={styles.headerRight}>
            <Pressable
              onPress={() => setViewMode((m) => (m === 'week' ? 'month' : 'week'))}
              style={styles.viewToggle}>
              <Text style={styles.viewToggleText}>{viewMode === 'week' ? '주' : '월'}</Text>
            </Pressable>

            <Pressable onPress={() => dateDropdownRef.current?.open()} style={styles.iconBtn}>
              <IconSearch size={17} color={Colors.textPrimary} />
            </Pressable>

            <Pressable onPress={() => setSettingsVisible(true)} style={styles.iconBtn}>
              <IconSettings size={17} color={Colors.textPrimary} />
            </Pressable>
          </View>
        </View>
      </View>

      {viewMode === 'month' ? (
        <View style={styles.body}>
          <GestureDetector gesture={monthSwipeGesture}>
            <View style={{ flex: 1 }}>
              <MonthCalendar date={date} selectedDate={date} onSelect={navigate} />
            </View>
          </GestureDetector>

          <AgendaPanel
            date={date}
            missions={missions}
            categories={categories}
            expanded={agendaOpen}
            onToggle={() => setAgendaOpen((v) => !v)}
            onEditItem={openEdit}
            onAdd={(category) => openAdd(undefined, category)}
            onToggleItem={toggle}
            onDeleteItem={remove}
          />
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.weekBody}>
            <WeekTimeGridView
              ref={gridRef}
              weekDates={weekDates}
              selectedDate={date}
              onSelectDate={navigate}
              onNavigate={(delta) => loadDate(offsetDate(date, delta))}
              onCreateRange={(d, start, end) => {
                loadDate(d);
                setPendingRange({ date: d, startTime: start, endTime: end });
                openAdd(start, undefined, end);
              }}
              onEditItem={openEdit}
              pendingRange={pendingRange}
              onItemDragStart={(item, x, y) => handleDragStart(item, 'grid', x, y)}
              onItemDragUpdate={handleDragUpdate}
              onItemDragEnd={(item, x, y) => handleDragEnd(item, 'grid', x, y)}
              draggingId={dragItem?.id ?? null}
              dropPreview={dropPreview}
            />
          </View>

          <AgendaPanel
            date={date}
            missions={missions}
            categories={categories}
            expanded={agendaOpen}
            onToggle={() => setAgendaOpen((v) => !v)}
            onEditItem={openEdit}
            onAdd={(category) => openAdd(undefined, category)}
            onToggleItem={toggle}
            onDeleteItem={remove}
            draggable
            onItemDragStart={(item, x, y) => handleDragStart(item, 'drawer', x, y)}
            onItemDragUpdate={handleDragUpdate}
            onItemDragEnd={(item, x, y) => handleDragEnd(item, 'drawer', x, y)}
            draggingId={dragItem?.id ?? null}
          />
        </View>
      )}

      {dragItem && (
        <Animated.View pointerEvents="none" style={[styles.ghost, { left: ghostX, top: ghostY }]}>
          <Text style={styles.ghostText} numberOfLines={1}>{dragItem.title}</Text>
        </Animated.View>
      )}

      <AddEditModal
        visible={modalVisible}
        initial={editTarget}
        presetStartTime={presetTime}
        presetEndTime={presetEnd}
        presetCategory={presetCat}
        categories={categories}
        onClose={() => { setModalVisible(false); setPendingRange(null); }}
        onSave={handleSave}
      />

      <Modal visible={settingsVisible} animationType="slide" onRequestClose={() => setSettingsVisible(false)}>
        <SettingsScreen onClose={() => setSettingsVisible(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  body: { flex: 1 },
  viewToggle: {
    paddingHorizontal: 13, paddingVertical: 7,
    borderRadius: 16, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  viewToggleText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  weekBody: { flex: 1 },

  ghost: {
    position: 'absolute', maxWidth: 130, marginLeft: 14, marginTop: -30,
    backgroundColor: Colors.background, borderRadius: 8, borderWidth: 1.5,
    paddingHorizontal: 8, paddingVertical: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 6,
    zIndex: 100,
  },
  ghostText: { fontSize: 11, fontWeight: '600', color: Colors.textPrimary },

  overlay: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheetCard: {
    width: '100%', maxWidth: 420, maxHeight: '86%',
    backgroundColor: Colors.background,
    borderRadius: 26, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 36,
    elevation: 20,
  },
  sheet: { padding: 24, gap: 14 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: Colors.textPrimary,
  },
  secLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border,
  },
  priorityDot: { width: 9, height: 9, borderRadius: 5 },
  priorityBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  catScroll: { maxHeight: 44 },
  catContent: { gap: 8, alignItems: 'center' },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  catChipText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  catChipTextActive: { color: '#fff' },
  customCatInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: Colors.textPrimary,
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  timedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timedSwitch: {
    width: 44, height: 26, borderRadius: 13, backgroundColor: Colors.border,
    padding: 3, justifyContent: 'center',
  },
  timedKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  timedKnobActive: { transform: [{ translateX: 18 }] },
  timeRow: { flexDirection: 'row', gap: 8 },
  timeBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12, gap: 2,
  },
  timeBtnLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  timeBtnValue: { fontSize: 16, color: Colors.textPrimary, fontWeight: '700' },
});
