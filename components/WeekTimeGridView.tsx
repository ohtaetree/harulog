import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { ScrollView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '../constants/colors';
import { usePointColor } from '../hooks/usePointColor';
import { IconCheck } from './icons';
import { getMissions, toggleMission, MissionRow, Priority } from '../db/missionDb';
import { DOW_LABELS, todayStr, dowIndex, offsetDate } from '../utils/dateUtils';

const START_HOUR = 0;
const END_HOUR = 24;
const HOUR_HEIGHT = 48;
const LABEL_WIDTH = 30;
const DEFAULT_DURATION_MIN = 30;
const MIN_BLOCK_HEIGHT = 20;
const INITIAL_SCROLL_HOUR = 6;
const SNAP_MIN = 15;

function pad(n: number) { return String(n).padStart(2, '0'); }

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function yToMinutes(y: number) {
  const raw = START_HOUR * 60 + (y / HOUR_HEIGHT) * 60;
  const snapped = Math.round(raw / SNAP_MIN) * SNAP_MIN;
  return Math.min(Math.max(snapped, START_HOUR * 60), END_HOUR * 60);
}

function minutesToTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${pad(h)}:${pad(m)}`;
}

function timeToY(time: string) {
  return (toMinutes(time) - START_HOUR * 60) / 60 * HOUR_HEIGHT;
}

export interface PendingRange { date: string; startTime: string; endTime: string; }

export interface DropTarget { date: string; time: string; }

export interface WeekTimeGridHandle {
  /** Given a page-space (window) coordinate, resolves which day column + time it falls over, or null if outside the grid. */
  getDropTarget: (pageX: number, pageY: number, cb: (target: DropTarget | null) => void) => void;
}

interface Props {
  weekDates: string[]; // currently visible dates
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onCreateRange: (date: string, startTime: string, endTime: string) => void;
  onEditItem: (item: MissionRow) => void;
  pendingRange: PendingRange | null;
  onItemDragStart: (item: MissionRow, x: number, y: number) => void;
  onItemDragUpdate: (x: number, y: number) => void;
  onItemDragEnd: (item: MissionRow, x: number, y: number) => void;
  draggingId: number | null;
  dropPreview: { date: string; time: string; durationMin: number } | null;
  /** Called when a horizontal drag commits to the next/prev range (positive = forward). */
  onNavigate: (deltaDays: number) => void;
}

const WeekTimeGridView = forwardRef<WeekTimeGridHandle, Props>(({
  weekDates, selectedDate, onSelectDate, onCreateRange, onEditItem, pendingRange,
  onItemDragStart, onItemDragUpdate, onItemDragEnd, draggingId, dropPreview, onNavigate,
}, ref) => {
  const pointColor = usePointColor();
  const today = todayStr();
  const scrollRef = useRef<any>(null);
  const bodyRef = useRef<View>(null);
  const scrollOffsetRef = useRef(0);
  const [, setTick] = useState(0);
  const forceRefresh = () => setTick((n) => n + 1);

  const visibleDays = weekDates.length;
  const prevDates = weekDates.map((d) => offsetDate(d, -visibleDays));
  const nextDates = weekDates.map((d) => offsetDate(d, visibleDays));

  const [panelWidth, setPanelWidth] = useState(0);
  const panelWidthRef = useRef(0);
  const dragX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: (INITIAL_SCROLL_HOUR - START_HOUR) * HOUR_HEIGHT, animated: false });
  }, []);

  useImperativeHandle(ref, () => ({
    getDropTarget(pageX, pageY, cb) {
      bodyRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (pageX < x || pageX > x + width || pageY < y || pageY > y + height) {
          cb(null);
          return;
        }
        const colWidth = (width - LABEL_WIDTH) / weekDates.length;
        const relX = pageX - x - LABEL_WIDTH;
        if (relX < 0) { cb(null); return; }
        const colIndex = Math.min(weekDates.length - 1, Math.max(0, Math.floor(relX / colWidth)));
        const contentY = (pageY - y) + scrollOffsetRef.current;
        cb({ date: weekDates[colIndex], time: minutesToTime(yToMinutes(contentY)) });
      });
    },
  }));

  const PRIORITY_COLOR: Record<Priority, string> = {
    high: '#EF4444', medium: pointColor, low: Colors.textMuted,
  };

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  const handleToggle = (item: MissionRow) => {
    toggleMission(item.id, item.done === 0);
    forceRefresh();
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onUpdate((e) => { dragX.setValue(e.translationX); })
    .onEnd((e) => {
      const width = panelWidthRef.current || 1;
      const forward = e.translationX < -width * 0.25 || (e.translationX < -30 && e.velocityX < -600);
      const backward = e.translationX > width * 0.25 || (e.translationX > 30 && e.velocityX > 600);
      if (forward) {
        Animated.timing(dragX, { toValue: -width, duration: 200, useNativeDriver: true }).start(() => {
          dragX.setValue(0);
          onNavigate(visibleDays);
        });
      } else if (backward) {
        Animated.timing(dragX, { toValue: width, duration: 200, useNativeDriver: true }).start(() => {
          dragX.setValue(0);
          onNavigate(-visibleDays);
        });
      } else {
        Animated.spring(dragX, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
      }
    });

  const carouselTransform = { transform: [{ translateX: Animated.subtract(dragX, panelWidth) }] };

  const renderHeaderPanel = (dates: string[], key: string) => (
    <View key={key} style={{ width: panelWidth, flexDirection: 'row' }}>
      {dates.map((d) => {
        const isToday = d === today;
        const isSelected = d === selectedDate;
        const dow = dowIndex(d);
        const weekendColor = dow === 6 ? '#E5484D' : dow === 5 ? '#2170D8' : undefined;
        return (
          <Pressable key={d} style={styles.dateHeaderCol} onPress={() => onSelectDate(d)}>
            <Text style={[styles.dowText, weekendColor && { color: weekendColor }]}>{DOW_LABELS[dow]}</Text>
            <View style={[styles.dateCircle, isSelected && { backgroundColor: pointColor }]}>
              <Text style={[
                styles.dateNumText,
                weekendColor && { color: weekendColor },
                isToday && !isSelected && { color: pointColor, fontWeight: '800' },
                isSelected && styles.dateNumTextSel,
              ]}>
                {parseInt(d.slice(8), 10)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width - LABEL_WIDTH;
        panelWidthRef.current = w;
        setPanelWidth(w);
      }}
    >
      <GestureDetector gesture={swipeGesture}>
        <View style={{ flex: 1 }}>
          {/* 요일 + 날짜 헤더 */}
          <View style={styles.dateHeaderRow}>
            <View style={{ width: LABEL_WIDTH }} />
            <View style={{ flex: 1, overflow: 'hidden' }}>
              {panelWidth > 0 && (
                <Animated.View style={[{ flexDirection: 'row' }, carouselTransform]}>
                  {renderHeaderPanel(prevDates, 'prev')}
                  {renderHeaderPanel(weekDates, 'current')}
                  {renderHeaderPanel(nextDates, 'next')}
                </Animated.View>
              )}
            </View>
          </View>

          {/* 시간대별 그리드 */}
          <View ref={bodyRef} style={styles.body} collapsable={false}>
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={{ height: totalHeight }}
              onScroll={(e) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y; }}
              scrollEventThrottle={16}
            >
              <View style={[styles.gridRow, { height: totalHeight }]}>
                <View style={[styles.hourGutter, { width: LABEL_WIDTH, height: totalHeight }]}>
                  {hours.map((h) => (
                    <Text key={h} style={[styles.hourLabel, { top: h * HOUR_HEIGHT - 6 }]}>{pad(h)}</Text>
                  ))}
                </View>

                <View style={{ flex: 1, overflow: 'hidden', height: totalHeight }}>
                  {panelWidth > 0 && (
                    <Animated.View style={[{ flexDirection: 'row', height: totalHeight }, carouselTransform]}>
                      <View key="prev" style={{ width: panelWidth, flexDirection: 'row', height: totalHeight }}>
                        {prevDates.map((d) => (
                          <DayColumnPreview key={d} date={d} hours={hours} isToday={d === today} pointColor={pointColor} priorityColor={PRIORITY_COLOR} />
                        ))}
                      </View>
                      <View key="current" style={{ width: panelWidth, flexDirection: 'row', height: totalHeight }}>
                        {weekDates.map((d) => (
                          <DayColumn
                            key={d}
                            date={d}
                            hours={hours}
                            isToday={d === today}
                            pointColor={pointColor}
                            priorityColor={PRIORITY_COLOR}
                            onCreateRange={onCreateRange}
                            onEditItem={onEditItem}
                            onToggle={handleToggle}
                            pending={pendingRange && pendingRange.date === d ? pendingRange : null}
                            onItemDragStart={onItemDragStart}
                            onItemDragUpdate={onItemDragUpdate}
                            onItemDragEnd={onItemDragEnd}
                            draggingId={draggingId}
                            dropPreview={dropPreview && dropPreview.date === d ? { time: dropPreview.time, durationMin: dropPreview.durationMin } : null}
                          />
                        ))}
                      </View>
                      <View key="next" style={{ width: panelWidth, flexDirection: 'row', height: totalHeight }}>
                        {nextDates.map((d) => (
                          <DayColumnPreview key={d} date={d} hours={hours} isToday={d === today} pointColor={pointColor} priorityColor={PRIORITY_COLOR} />
                        ))}
                      </View>
                    </Animated.View>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </GestureDetector>
    </View>
  );
});

export default WeekTimeGridView;

function withTint(color: string) {
  return `${color}0D`;
}

function DayColumnPreview({ date, hours, isToday, pointColor, priorityColor }: {
  date: string; hours: number[]; isToday: boolean; pointColor: string; priorityColor: Record<Priority, string>;
}) {
  const dayMissions = getMissions(date).filter((m) => !!m.start_time);
  return (
    <View style={[styles.dayCol, isToday && { backgroundColor: withTint(pointColor) }]}>
      {hours.map((h) => (
        <View key={h} style={[styles.hourLine, { top: h * HOUR_HEIGHT }]} />
      ))}
      {dayMissions.map((item) => {
        const startMin = toMinutes(item.start_time!);
        const endMin = item.end_time ? toMinutes(item.end_time) : startMin + DEFAULT_DURATION_MIN;
        const top = (startMin - START_HOUR * 60) / 60 * HOUR_HEIGHT;
        const height = Math.max((endMin - startMin) / 60 * HOUR_HEIGHT, MIN_BLOCK_HEIGHT);
        const color = priorityColor[item.priority];
        const done = item.done === 1;
        return (
          <View key={item.id} style={[styles.block, { top, height, borderLeftColor: color }]}>
            <View style={styles.blockCheckbox}>
              <View style={[styles.checkDot, done && { backgroundColor: color, borderColor: color }]}>
                {done && <IconCheck size={7} color="#fff" />}
              </View>
            </View>
            <Text numberOfLines={height < 30 ? 1 : 2} style={[styles.blockTitle, done && styles.blockTitleDone]}>
              {item.title}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function DayColumn({
  date, hours, isToday, pointColor, priorityColor, onCreateRange, onEditItem, onToggle, pending,
  onItemDragStart, onItemDragUpdate, onItemDragEnd, draggingId, dropPreview,
}: {
  date: string; hours: number[]; isToday: boolean; pointColor: string;
  priorityColor: Record<Priority, string>;
  onCreateRange: (date: string, startTime: string, endTime: string) => void;
  onEditItem: (item: MissionRow) => void;
  onToggle: (item: MissionRow) => void;
  pending: PendingRange | null;
  onItemDragStart: (item: MissionRow, x: number, y: number) => void;
  onItemDragUpdate: (x: number, y: number) => void;
  onItemDragEnd: (item: MissionRow, x: number, y: number) => void;
  draggingId: number | null;
  dropPreview: { time: string; durationMin: number } | null;
}) {
  const dayMissions = getMissions(date).filter((m) => !!m.start_time);

  const [dragRange, setDragRangeState] = useState<{ startY: number; endY: number } | null>(null);
  const dragRangeRef = useRef<{ startY: number; endY: number } | null>(null);
  const setDragRange = (next: { startY: number; endY: number } | null) => {
    dragRangeRef.current = next;
    setDragRangeState(next);
  };

  const createGesture = Gesture.Pan()
    .activateAfterLongPress(260)
    .onStart((e) => setDragRange({ startY: e.y, endY: e.y }))
    .onUpdate((e) => {
      const r = dragRangeRef.current;
      if (r) setDragRange({ ...r, endY: e.y });
    })
    .onFinalize((_e, success) => {
      const r = dragRangeRef.current;
      setDragRange(null);
      if (r && success) {
        const top = Math.min(r.startY, r.endY);
        const bottom = Math.max(r.startY, r.endY);
        const startMin = yToMinutes(top);
        let endMin = yToMinutes(bottom);
        if (endMin - startMin < DEFAULT_DURATION_MIN) endMin = startMin + DEFAULT_DURATION_MIN;
        onCreateRange(date, minutesToTime(startMin), minutesToTime(endMin));
      }
    });

  return (
    <View style={[styles.dayCol, isToday && { backgroundColor: withTint(pointColor) }]}>
      {hours.map((h) => (
        <View key={h} style={[styles.hourLine, { top: h * HOUR_HEIGHT }]} />
      ))}

      <GestureDetector gesture={createGesture}>
        <View style={StyleSheet.absoluteFill} />
      </GestureDetector>

      {(() => {
        let top: number, bottom: number, label: string, isDrop = false;
        if (dragRange) {
          top = Math.min(dragRange.startY, dragRange.endY);
          bottom = Math.max(dragRange.startY, dragRange.endY);
          label = `${minutesToTime(yToMinutes(top))}–${minutesToTime(yToMinutes(bottom))}`;
        } else if (pending) {
          top = timeToY(pending.startTime);
          bottom = timeToY(pending.endTime);
          label = `${pending.startTime}–${pending.endTime}`;
        } else if (dropPreview) {
          top = timeToY(dropPreview.time);
          bottom = top + (dropPreview.durationMin / 60) * HOUR_HEIGHT;
          label = `${dropPreview.time}–${minutesToTime(toMinutes(dropPreview.time) + dropPreview.durationMin)}`;
          isDrop = true;
        } else {
          return null;
        }
        const height = Math.max(bottom - top, 4);
        return (
          <View pointerEvents="none" style={[
            styles.dragPreview,
            { top, height, borderColor: pointColor },
            isDrop ? { backgroundColor: `${pointColor}12`, borderWidth: 2 } : { backgroundColor: `${pointColor}22` },
          ]}>
            <Text numberOfLines={1} style={[styles.dragPreviewText, { color: pointColor }]}>{label}</Text>
          </View>
        );
      })()}

      {dayMissions.map((item) => {
        const startMin = toMinutes(item.start_time!);
        const endMin = item.end_time ? toMinutes(item.end_time) : startMin + DEFAULT_DURATION_MIN;
        const top = (startMin - START_HOUR * 60) / 60 * HOUR_HEIGHT;
        const height = Math.max((endMin - startMin) / 60 * HOUR_HEIGHT, MIN_BLOCK_HEIGHT);
        const color = priorityColor[item.priority];
        const done = item.done === 1;

        return (
          <ScheduledBlock
            key={item.id}
            item={item}
            top={top}
            height={height}
            color={color}
            done={done}
            dragging={draggingId === item.id}
            onEdit={() => onEditItem(item)}
            onToggle={() => onToggle(item)}
            onDragStart={onItemDragStart}
            onDragUpdate={onItemDragUpdate}
            onDragEnd={onItemDragEnd}
          />
        );
      })}
    </View>
  );
}

function ScheduledBlock({ item, top, height, color, done, dragging, onEdit, onToggle, onDragStart, onDragUpdate, onDragEnd }: {
  item: MissionRow; top: number; height: number; color: string; done: boolean; dragging: boolean;
  onEdit: () => void; onToggle: () => void;
  onDragStart: (item: MissionRow, x: number, y: number) => void;
  onDragUpdate: (x: number, y: number) => void;
  onDragEnd: (item: MissionRow, x: number, y: number) => void;
}) {
  const tapGesture = Gesture.Tap()
    .maxDuration(240)
    .onEnd(() => onEdit());

  const dragGesture = Gesture.Pan()
    .activateAfterLongPress(260)
    .onStart((e) => onDragStart(item, e.absoluteX, e.absoluteY))
    .onUpdate((e) => onDragUpdate(e.absoluteX, e.absoluteY))
    .onFinalize((e) => onDragEnd(item, e.absoluteX, e.absoluteY));

  const blockGesture = Gesture.Race(tapGesture, dragGesture);

  return (
    <GestureDetector gesture={blockGesture}>
      <View style={[styles.block, { top, height, borderLeftColor: color }, dragging && styles.blockDragging]}>
        <Pressable onPress={onToggle} hitSlop={4} style={styles.blockCheckbox}>
          <View style={[styles.checkDot, done && { backgroundColor: color, borderColor: color }]}>
            {done && <IconCheck size={7} color="#fff" />}
          </View>
        </Pressable>
        <Text numberOfLines={height < 30 ? 1 : 2} style={[styles.blockTitle, done && styles.blockTitleDone]}>
          {item.title}
        </Text>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },

  dateHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  dateHeaderCol: { flex: 1, alignItems: 'center', gap: 4 },
  dowText: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  dateCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateNumText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  dateNumTextSel: { color: '#fff' },

  body: { flex: 1 },
  scroll: { flex: 1 },
  gridRow: { flexDirection: 'row' },

  hourGutter: { position: 'relative' },
  hourLabel: {
    position: 'absolute', left: 0, right: 4,
    fontSize: 9, color: Colors.textMuted, fontWeight: '600', textAlign: 'right',
  },

  dayCol: {
    flex: 1, position: 'relative',
    borderLeftWidth: 1, borderLeftColor: Colors.border,
  },
  hourLine: {
    position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: Colors.border,
  },

  dragPreview: {
    position: 'absolute', left: 1, right: 1,
    borderRadius: 4, borderWidth: 1,
    justifyContent: 'center', paddingHorizontal: 3,
  },
  dragPreviewText: { fontSize: 8, fontWeight: '700' },

  block: {
    position: 'absolute', left: 1, right: 1,
    backgroundColor: Colors.surface, borderRadius: 4, borderLeftWidth: 2,
    paddingHorizontal: 3, paddingVertical: 2, gap: 1,
    overflow: 'hidden',
  },
  blockDragging: { opacity: 0.3 },
  blockCheckbox: { alignSelf: 'flex-start' },
  checkDot: {
    width: 9, height: 9, borderRadius: 4.5, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  blockTitle: { fontSize: 8.5, fontWeight: '600', color: Colors.textPrimary, lineHeight: 10 },
  blockTitleDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
});
