import { useEffect, useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, Modal, Animated, Dimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMissionStore } from '../stores/missionStore';
import { useSettingsStore } from '../stores/settingsStore';
import { MissionRow, addMission, getMissions } from '../db/missionDb';
import DateDropdown, { DateDropdownHandle } from '../components/DateDropdown';
import WeekTimeGridView, { WeekTimeGridHandle } from '../components/WeekTimeGridView';
import MonthCalendar from '../components/MonthCalendar';
import AgendaPanel, { AgendaEditorDraft, HANDLE_HEIGHT, PANEL_HEIGHT_RATIO } from '../components/AgendaPanel';
import SettingsScreen from './SettingsScreen';
import { IconSettings } from '../components/icons';
import { Colors } from '../constants/colors';
import { useDateFade } from '../hooks/useDateFade';
import { usePointColor } from '../hooks/usePointColor';
import { todayStr, offsetDate, offsetMonth, getDateRange, labelWeek, labelMonth } from '../utils/dateUtils';

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

// ── 메인 ────────────────────────────────────────────────────────────────────

export default function MissionScreen() {
  const { date, missions, loadDate, update, toggle, remove } = useMissionStore();
  const pointColor = usePointColor();
  const categories = useSettingsStore((s) => s.categories);
  const routines = useSettingsStore((s) => s.routines);
  const weekVisibleDays = useSettingsStore((s) => s.weekVisibleDays);
  const viewMode = useSettingsStore((s) => s.scheduleViewMode);
  const setViewMode = useSettingsStore((s) => s.setScheduleViewMode);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const dateDropdownRef = useRef<DateDropdownHandle>(null);
  const [pendingRange, setPendingRange] = useState<{ date: string; startTime: string; endTime: string } | null>(null);
  const [agendaEditor, setAgendaEditor] = useState<AgendaEditorDraft | null>(null);
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [bodyHeight, setBodyHeight] = useState(0);

  useEffect(() => { loadDate(todayStr()); }, []);
  useEffect(() => {
    const day = new Date(date + 'T00:00:00');
    const weekday = (day.getDay() + 6) % 7;
    const existing = getMissions(date);
    let added = false;
    routines.forEach((routine) => {
      const start = new Date(routine.startDate + 'T00:00:00');
      const diff = Math.floor((day.getTime() - start.getTime()) / 86400000);
      const due = diff >= 0 && (routine.repeat === 'daily' || (routine.repeat === 'weekly' && routine.weekdays.includes(weekday)) || (routine.repeat === 'interval' && diff % routine.intervalDays === 0));
      if (due && !existing.some((m) => m.title === routine.title && m.category === routine.category && m.start_time === routine.time)) {
        addMission(date, routine.title, routine.priority, routine.category, routine.time, routine.time ? null : null); added = true;
      }
    });
    if (added) loadDate(date);
  }, [date, routines]);

  const { navigate } = useDateFade(loadDate);

  // 주간 뷰가 보여주는 날짜 구간(weekAnchor)은 선택된 날짜(date)와 별개로 움직인다 —
  // 스와이프는 구간만 옮기고, 날짜 선택(탭)은 date만 바꾼다. 월간 뷰에서 날짜를 고르고
  // 주간 뷰로 전환할 때만 구간이 그 날짜에 맞춰 다시 잡힌다.
  const [weekAnchor, setWeekAnchor] = useState(() => todayStr());
  const [gridResetKey, setGridResetKey] = useState(0);
  useEffect(() => {
    if (viewMode === 'week') setWeekAnchor(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const weekDates = useMemo(() => getDateRange(weekAnchor, weekVisibleDays), [weekAnchor, weekVisibleDays]);
  const today = todayStr();
  const goToToday = () => {
    setWeekAnchor(today);
    // 내부 캐러셀 위치도 초기화해, 현재 보고 있던 먼 날짜의 이동 상태가 남지 않게 한다.
    setGridResetKey((key) => key + 1);
    // 지연되는 페이드 내비게이션을 거치지 않아, 오늘이 즉시 왼쪽 첫 칸으로 배치된다.
    loadDate(today);
  };

  const makeSnapSwipeGesture = (onPrev: () => void, onNext: () => void) => Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onEnd((e) => {
      if (e.translationX < -40) onNext();
      else if (e.translationX > 40) onPrev();
    });
  const headerSwipeGesture = makeSnapSwipeGesture(
    () => (viewMode === 'week' ? setWeekAnchor(offsetDate(weekAnchor, -weekVisibleDays)) : navigate(offsetMonth(date, -1))),
    () => (viewMode === 'week' ? setWeekAnchor(offsetDate(weekAnchor, weekVisibleDays)) : navigate(offsetMonth(date, 1))),
  );
  const monthSwipeGesture = makeSnapSwipeGesture(
    () => navigate(offsetMonth(date, -1)),
    () => navigate(offsetMonth(date, 1)),
  );

  const openAdd = (time?: string, category?: string, endTime?: string, targetDate = date) => {
    const startTime = time ?? '09:00';
    setAgendaEditor({
      mode: 'add', date: targetDate, title: '', priority: 'medium', category: category ?? '',
      timed: true, startTime, endTime: endTime ?? minutesToTimeStr(timeToMinutes(startTime) + 30),
    });
    setAgendaOpen(true);
  };
  const openEdit = (item: MissionRow) => {
    setAgendaEditor({
      mode: 'edit', itemId: item.id, date: item.date, title: item.title,
      priority: item.priority, category: item.category, timed: !!item.start_time,
      startTime: item.start_time ?? '09:00', endTime: item.end_time ?? (item.start_time ? minutesToTimeStr(timeToMinutes(item.start_time) + 30) : '09:30'),
    });
    setAgendaOpen(true);
  };
  const isValidTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  const handleEditorSave = () => {
    if (!agendaEditor || !agendaEditor.title.trim()) return;
    if (agendaEditor.timed && (!isValidTime(agendaEditor.startTime) || !isValidTime(agendaEditor.endTime))) return;
    const timed = agendaEditor.timed;
    const startTime = timed ? agendaEditor.startTime : null;
    const endTime = timed ? agendaEditor.endTime : null;
    if (timed && timeToMinutes(endTime!) <= timeToMinutes(startTime!)) return;
    if (agendaEditor.mode === 'edit' && agendaEditor.itemId != null) {
      update(agendaEditor.itemId, agendaEditor.title.trim(), agendaEditor.priority, agendaEditor.category, startTime, endTime, agendaEditor.date);
    } else {
      addMission(agendaEditor.date, agendaEditor.title.trim(), agendaEditor.priority, agendaEditor.category, startTime, endTime);
      loadDate(agendaEditor.date);
    }
    setAgendaEditor(null);
    setPendingRange(null);
  };

  useEffect(() => {
    if (!agendaEditor?.timed || !isValidTime(agendaEditor.startTime) || !isValidTime(agendaEditor.endTime)) {
      setPendingRange(null);
      return;
    }
    if (timeToMinutes(agendaEditor.endTime) <= timeToMinutes(agendaEditor.startTime)) {
      setPendingRange(null);
      return;
    }
    setPendingRange({ date: agendaEditor.date, startTime: agendaEditor.startTime, endTime: agendaEditor.endTime });
  }, [agendaEditor]);

  const gridRef = useRef<WeekTimeGridHandle>(null);
  const [dragItem, setDragItem] = useState<MissionRow | null>(null);
  const [dragSource, setDragSource] = useState<'grid' | 'drawer' | null>(null);
  const [dropPreview, setDropPreview] = useState<{ date: string; time: string; durationMin: number } | null>(null);
  const dragDurationRef = useRef(30);
  const dragOffsetRef = useRef(0);
  const activeDragIdRef = useRef<number | null>(null);
  const ghostX = useRef(new Animated.Value(-1000)).current;
  const ghostY = useRef(new Animated.Value(-1000)).current;

  const durationOf = (item: MissionRow) => {
    if (!item.start_time) return 30;
    const startMin = timeToMinutes(item.start_time);
    const endMin = item.end_time ? timeToMinutes(item.end_time) : startMin + 30;
    return Math.max(endMin - startMin, 15);
  };

  const handleDragStart = (item: MissionRow, source: 'grid' | 'drawer', x: number, y: number, offsetMinutes = 0) => {
    setDragItem(item);
    setDragSource(source);
    activeDragIdRef.current = item.id;
    dragDurationRef.current = durationOf(item);
    dragOffsetRef.current = source === 'grid' ? 0 : offsetMinutes;
    if (source === 'grid' && item.start_time) {
      // 제스처 이벤트의 e.y는 일부 기기에서 0으로 보고되어 미리보기 상단이 손가락에 붙었다.
      // 실제 그리드 좌표에서 원래 시작 시각과의 차이를 계산해, 어디를 눌러도 블록의 상대 위치를 유지한다.
      gridRef.current?.getDropTarget(x, y, (target) => {
        if (!target || activeDragIdRef.current !== item.id) return;
        dragOffsetRef.current = Math.max(0, timeToMinutes(target.time) - timeToMinutes(item.start_time!));
      });
    }
    if (source === 'drawer') { ghostX.setValue(x); ghostY.setValue(y); }
  };
  const handleDragUpdate = (x: number, y: number) => {
    if (dragSource === 'drawer') { ghostX.setValue(x); ghostY.setValue(y); }
    gridRef.current?.getDropTarget(x, y, (target) => {
      if (!target) { setDropPreview((p) => (p ? null : p)); return; }
      const next = { date: target.date, time: minutesToTimeStr(timeToMinutes(target.time) - dragOffsetRef.current), durationMin: dragDurationRef.current };
      setDropPreview((p) => (p && p.date === next.date && p.time === next.time && p.durationMin === next.durationMin ? p : next));
    });
  };
  const handleDragEnd = (item: MissionRow, source: 'grid' | 'drawer', x: number, y: number) => {
    setDragItem(null);
    setDragSource(null);
    activeDragIdRef.current = null;
    setDropPreview(null);
    const pointerOffset = dragOffsetRef.current;
    dragOffsetRef.current = 0;
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
        const newStartMin = timeToMinutes(target.time) - pointerOffset;
        const newEndTime = minutesToTimeStr(newStartMin + duration);
        update(item.id, item.title, item.priority, item.category, minutesToTimeStr(newStartMin), newEndTime, target.date);
      });
      return;
    }

    if (droppedOnDrawer) return;
    gridRef.current?.getDropTarget(x, y, (target) => {
      if (!target) return;
      const startTime = minutesToTimeStr(timeToMinutes(target.time) - pointerOffset);
      const endTime = minutesToTimeStr(timeToMinutes(startTime) + dragDurationRef.current);
      update(item.id, item.title, item.priority, item.category, startTime, endTime, target.date);
      loadDate(target.date);
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
                label={viewMode === 'week' ? labelWeek(weekAnchor) : labelMonth(date)}
                onApply={navigate}
              />
            </View>
          </GestureDetector>

          <View style={styles.headerRight}>
            <Pressable
              onPress={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
              style={styles.viewToggle}>
              <Text style={styles.viewToggleText}>{viewMode === 'week' ? '주' : '월'}</Text>
            </Pressable>

            <Pressable onPress={() => setSettingsVisible(true)} style={styles.iconBtn}>
              <IconSettings size={17} color={Colors.textPrimary} />
            </Pressable>

            <Pressable onPress={goToToday} style={[styles.todayBtn, { backgroundColor: pointColor }]}>
              <Text style={styles.todayBtnText}>{String(parseInt(today.slice(8), 10))}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {viewMode === 'month' ? (
        <View style={styles.body} onLayout={(e) => setBodyHeight(e.nativeEvent.layout.height)}>
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
            editor={agendaEditor}
            onEditorChange={setAgendaEditor}
            onEditorSave={handleEditorSave}
            onEditorCancel={() => { setAgendaEditor(null); setPendingRange(null); }}
            onEditorDelete={() => { if (agendaEditor?.itemId != null) remove(agendaEditor.itemId); setAgendaEditor(null); setPendingRange(null); }}
            onQuickAddTodo={(title, category) => { addMission(date, title, 'medium', category, null, null); loadDate(date); }}
            availableHeight={bodyHeight}
          />
        </View>
      ) : (
        <View style={styles.body} onLayout={(e) => setBodyHeight(e.nativeEvent.layout.height)}>
          <View style={styles.weekBody}>
            <WeekTimeGridView
              key={gridResetKey}
              ref={gridRef}
              weekDates={weekDates}
              selectedDate={date}
              onSelectDate={navigate}
              onNavigate={(delta) => setWeekAnchor((anchor) => offsetDate(anchor, delta))}
              onCreateRange={(d, start, end) => {
                loadDate(d);
                openAdd(start, undefined, end, d);
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
            editor={agendaEditor}
            onEditorChange={setAgendaEditor}
            onEditorSave={handleEditorSave}
            onEditorCancel={() => { setAgendaEditor(null); setPendingRange(null); }}
            onEditorDelete={() => { if (agendaEditor?.itemId != null) remove(agendaEditor.itemId); setAgendaEditor(null); setPendingRange(null); }}
            onQuickAddTodo={(title, category) => { addMission(date, title, 'medium', category, null, null); loadDate(date); }}
            availableHeight={bodyHeight}
            draggable
            onItemDragStart={(item, x, y) => handleDragStart(item, 'drawer', x, y)}
            onItemDragUpdate={handleDragUpdate}
            onItemDragEnd={(item, x, y) => handleDragEnd(item, 'drawer', x, y)}
            draggingId={dragItem?.id ?? null}
          />
        </View>
      )}

      {dragItem && dragSource === 'drawer' && (
        <Animated.View pointerEvents="none" style={[styles.ghost, { left: ghostX, top: ghostY }]}>
          <Text style={styles.ghostText} numberOfLines={1}>{dragItem.title}</Text>
        </Animated.View>
      )}

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
  body: { flex: 1, position: 'relative' },
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
  todayBtn: {
    minWidth: 32, height: 32, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 7,
  },
  todayBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  weekBody: { flex: 1 },

  ghost: {
    position: 'absolute', maxWidth: 130, marginLeft: 14, marginTop: -30,
    backgroundColor: Colors.background, borderRadius: 8, borderWidth: 1.5,
    paddingHorizontal: 8, paddingVertical: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 6,
    zIndex: 100,
  },
  ghostText: { fontSize: 11, fontWeight: '600', color: Colors.textPrimary },
});
