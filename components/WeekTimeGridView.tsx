import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { ScrollView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '../constants/colors';
import { usePointColor } from '../hooks/usePointColor';
import { IconCheck } from './icons';
import { getMissions, toggleMission, MissionRow, Priority } from '../db/missionDb';
import { DOW_LABELS, todayStr, dowIndex, offsetDate } from '../utils/dateUtils';

const START_HOUR = 0;
const END_HOUR = 24;
// 시간표를 한 화면에서 더 촘촘하게 확인할 수 있도록 1시간 행 높이를 줄인다.
const HOUR_HEIGHT = 36;
const LABEL_WIDTH = 48;
const DEFAULT_DURATION_MIN = 30;
const MIN_BLOCK_HEIGHT = 20;
const INITIAL_SCROLL_HOUR = 6;
const SNAP_MIN = 15;
const BUFFER_DAYS = 7; // 스와이프로 하루 이상 넘어갈 수 있게 앞뒤로 미리 렌더링해두는 여유 일수
const FLING_SECONDS = 0.24;

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
  onItemDragStart: (item: MissionRow, x: number, y: number, offsetMinutes?: number) => void;
  onItemDragUpdate: (x: number, y: number) => void;
  onItemDragEnd: (item: MissionRow, x: number, y: number) => void;
  draggingId: number | null;
  dropPreview: { date: string; time: string; durationMin: number } | null;
  /** Called when a horizontal drag commits — deltaDays can be any size depending on drag distance/velocity. */
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
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [, setTick] = useState(0);
  const [nowMinutes, setNowMinutes] = useState(() => new Date().getHours() * 60 + new Date().getMinutes());
  const forceRefresh = () => setTick((n) => n + 1);

  const visibleDays = weekDates.length;
  // 버퍼를 포함한 연속된 개별 날짜 스트립 (하루 단위로 자연스럽게 넘기기 위함 — visibleDays는 "몇 일씩 보여줄지"일 뿐 넘기는 단위가 아님)
  const stripStart = offsetDate(weekDates[0], -BUFFER_DAYS);
  const stripDates = Array.from({ length: visibleDays + BUFFER_DAYS * 2 }, (_, i) => offsetDate(stripStart, i));

  const [panelWidth, setPanelWidth] = useState(0);
  const panelWidthRef = useRef(0);
  const dragX = useRef(new Animated.Value(0)).current;
  const dayWidth = panelWidth > 0 ? panelWidth / visibleDays : 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: (INITIAL_SCROLL_HOUR - START_HOUR) * HOUR_HEIGHT, animated: false });
  }, []);
  useEffect(() => {
    const timer = setInterval(() => { const now = new Date(); setNowMinutes(now.getHours() * 60 + now.getMinutes()); }, 60_000);
    return () => clearInterval(timer);
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

  const setVerticalScrollLocked = (locked: boolean) => {
    const enabled = !locked;
    scrollRef.current?.setNativeProps?.({ scrollEnabled: enabled });
    setScrollEnabled(enabled);
  };

  // 그리드 본문 스와이프 — RNGH 제스처 대신 RN 기본 터치 이벤트(onTouch*)로 직접 처리한다.
  // 이유: 웹에서 RNGH GestureDetector는 조상 뷰에 touch-action:none을 강제로 씌우는데, 이걸
  // 스크롤뷰를 감싸는 조상에 걸면 세로 스크롤 자체가 막혀버림(이전에 겪은 버그). 기본 터치
  // 이벤트는 그런 부작용이 없어서 세로 스크롤과 안전하게 공존한다.
  // 길게 눌러 일정 생성/재배치하는 기존 제스처(DayColumn/ScheduledBlock, 그리드 안쪽에 중첩)와
  // 안 겹치도록, 터치 시작 후 SWIPE_DECISION_MS 안에 충분히 움직였을 때만 스와이프로 인정하고,
  // 그 시간 안에 안 움직이면(=길게 누르는 중) 이 핸들러는 완전히 손을 뗀다.
  const SWIPE_DECISION_MS = 260;
  const HORIZONTAL_MOVE_THRESHOLD = 18;
  const VERTICAL_MOVE_THRESHOLD = 12;
  // 대각선으로 살짝 움직여도 넘김으로 오인되지 않도록 수평 이동이 세로보다
  // 충분히 커야만 요일 이동으로 전환한다.
  const HORIZONTAL_DOMINANCE = 1.6;
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastMoveRef = useRef<{ x: number; t: number } | null>(null);
  const velocityXRef = useRef(0);
  const swipeModeRef = useRef<'undecided' | 'horizontal' | 'rejected'>('undecided');

  const settle = (toValue: number, distance: number, onDone?: () => void) => {
    Animated.timing(dragX, {
      toValue,
      duration: Math.max(280, Math.min(560, 280 + Math.abs(distance) * 0.7)),
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDone?.();
    });
  };

  const commitOrSpringBack = (dx: number, velocityX: number) => {
    if (!dayWidth) {
      settle(0, dx);
      return;
    }
    const effective = dx + velocityX * FLING_SECONDS;
    const direction = effective === 0 ? Math.sign(dx) : Math.sign(effective);
    // 인식된 가벼운 스와이프는 적어도 하루, 빠른 플릭은 속도만큼 최대 7일까지 이동.
    const dayCount = Math.max(1, Math.round(Math.abs(effective) / dayWidth));
    const deltaDays = Math.max(-BUFFER_DAYS, Math.min(BUFFER_DAYS, -direction * dayCount));

    if (deltaDays === 0) {
      settle(0, dx);
      return;
    }
    const finalX = -deltaDays * dayWidth;
    settle(finalX, finalX - dx, () => {
      dragX.setValue(0);
      onNavigate(deltaDays);
    });
  };

  const handleTouchStart = (e: any) => {
    const t = e.nativeEvent.touches?.[0];
    if (!t) return;
    touchStartRef.current = { x: t.pageX, y: t.pageY, t: Date.now() };
    lastMoveRef.current = { x: t.pageX, t: Date.now() };
    velocityXRef.current = 0;
    swipeModeRef.current = 'undecided';
  };

  const handleTouchMove = (e: any) => {
    const start = touchStartRef.current;
    if (!start || swipeModeRef.current === 'rejected') return;
    const t = e.nativeEvent.touches?.[0];
    if (!t) return;
    const dx = t.pageX - start.x;
    const dy = t.pageY - start.y;

    if (swipeModeRef.current === 'undecided') {
      if (Date.now() - start.t > SWIPE_DECISION_MS) {
        swipeModeRef.current = 'rejected';
        return;
      }
      if (
        Math.abs(dx) >= HORIZONTAL_MOVE_THRESHOLD
        && Math.abs(dx) >= Math.abs(dy) * HORIZONTAL_DOMINANCE
      ) {
        swipeModeRef.current = 'horizontal';
        setVerticalScrollLocked(true);
      } else if (
        Math.abs(dy) >= VERTICAL_MOVE_THRESHOLD
        && Math.abs(dy) > Math.abs(dx) / HORIZONTAL_DOMINANCE
      ) {
        swipeModeRef.current = 'rejected';
        return;
      } else {
        return;
      }
    }

    const now = Date.now();
    const last = lastMoveRef.current;
    if (last) {
      const instantVelocity = (t.pageX - last.x) / Math.max(1, now - last.t) * 1000;
      velocityXRef.current = velocityXRef.current * 0.35 + instantVelocity * 0.65;
    }
    dragX.setValue(dx);
    lastMoveRef.current = { x: t.pageX, t: now };
  };

  const handleTouchEnd = (e: any) => {
    const start = touchStartRef.current;
    const mode = swipeModeRef.current;
    touchStartRef.current = null;
    swipeModeRef.current = 'undecided';
    setVerticalScrollLocked(false);
    if (mode !== 'horizontal' || !start) return;

    const t = e.nativeEvent.changedTouches?.[0];
    const dx = t ? t.pageX - start.x : 0;
    commitOrSpringBack(dx, velocityXRef.current);
  };

  // stripDates는 항상 앞에 BUFFER_DAYS개의 날짜를 두므로, 표시 일수와 무관하게
  // 그 고정 버퍼만큼 이동한 위치가 현재 화면의 첫 번째 날짜다.
  // panelWidth를 쓰면 7일 보기에서만 우연히 일치하고 3~6일 보기에서는 열이 어긋난다.
  const carouselTransform = { transform: [{ translateX: Animated.subtract(dragX, BUFFER_DAYS * dayWidth) }] };
  const stripWidth = dayWidth * stripDates.length;

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width - LABEL_WIDTH;
        panelWidthRef.current = w;
        setPanelWidth(w);
      }}
    >
      {/* 요일 + 날짜 헤더 — 탭으로 날짜 선택만 담당 (스와이프는 아래 그리드에서 인식) */}
      <View style={styles.dateHeaderRow}>
        <View style={{ width: LABEL_WIDTH }} />
        <View style={{ flex: 1, overflow: 'hidden' }}>
          {panelWidth > 0 && (
            <Animated.View style={[{ flexDirection: 'row', width: stripWidth }, carouselTransform]}>
              {stripDates.map((d) => {
                const isToday = d === today;
                const isSelected = d === selectedDate;
                const dow = dowIndex(d);
                const weekendColor = dow === 6 ? '#E5484D' : dow === 5 ? '#2170D8' : undefined;
                return (
                  <Pressable key={d} style={[styles.dateHeaderCol, { width: dayWidth }]} onPress={() => onSelectDate(d)}>
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
            </Animated.View>
          )}
        </View>
      </View>

      {/* 시간대별 그리드 — 스와이프(요일 넘기기)와 세로 스크롤을 함께 처리 */}
      <View
        ref={bodyRef}
        style={styles.body}
        collapsable={false}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={{ height: totalHeight }}
          scrollEnabled={scrollEnabled}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          onScroll={(e) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y; }}
          scrollEventThrottle={16}
        >
          <View style={[styles.gridRow, { height: totalHeight }]}>
            <View style={[styles.hourGutter, { width: LABEL_WIDTH, height: totalHeight }]}>
              {hours.filter((h) => h > 0).map((h) => (
                <Text key={h} style={[styles.hourLabel, { top: h * HOUR_HEIGHT - 7 }]}>{`${pad(h)}:00`}</Text>
              ))}
            </View>

            <View style={{ flex: 1, overflow: 'hidden', height: totalHeight }}>
              {panelWidth > 0 && (
                <Animated.View style={[{ flexDirection: 'row', width: stripWidth, height: totalHeight }, carouselTransform]}>
                  {stripDates.map((d) => {
                    const isCurrent = weekDates.includes(d);
                    return isCurrent ? (
                      <DayColumn
                        key={d}
                        date={d}
                        width={dayWidth}
                        hours={hours}
                        isToday={d === today}
                        pointColor={pointColor}
                        priorityColor={PRIORITY_COLOR}
                        onCreateRange={onCreateRange}
                        onEditItem={onEditItem}
                        pending={pendingRange && pendingRange.date === d ? pendingRange : null}
                        onItemDragStart={onItemDragStart}
                        onItemDragUpdate={onItemDragUpdate}
                        onItemDragEnd={onItemDragEnd}
                        draggingId={draggingId}
                        onGestureActive={setVerticalScrollLocked}
                        nowMinutes={nowMinutes}
                        dropPreview={dropPreview && dropPreview.date === d ? { time: dropPreview.time, durationMin: dropPreview.durationMin } : null}
                      />
                    ) : (
                      <DayColumnPreview key={d} date={d} width={dayWidth} hours={hours} isToday={d === today} pointColor={pointColor} priorityColor={PRIORITY_COLOR} />
                    );
                  })}
                </Animated.View>
              )}
            </View>
            <View pointerEvents="none" style={[styles.nowLine, { top: (nowMinutes / 60) * HOUR_HEIGHT, backgroundColor: pointColor }]} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
});

export default WeekTimeGridView;

function withTint(color: string) {
  return `${color}0D`;
}

function DayColumnPreview({ date, width, hours, isToday, pointColor, priorityColor }: {
  date: string; width: number; hours: number[]; isToday: boolean; pointColor: string; priorityColor: Record<Priority, string>;
}) {
  const dayMissions = getMissions(date).filter((m) => !!m.start_time);
  return (
    <View style={[styles.dayCol, { width }, isToday && { backgroundColor: withTint(pointColor) }]}>
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
                {done && <IconCheck size={10} color="#fff" />}
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
  date, width, hours, isToday, pointColor, priorityColor, onCreateRange, onEditItem, pending,
  onItemDragStart, onItemDragUpdate, onItemDragEnd, draggingId, dropPreview, onGestureActive, nowMinutes,
}: {
  date: string; width: number; hours: number[]; isToday: boolean; pointColor: string;
  priorityColor: Record<Priority, string>;
  onCreateRange: (date: string, startTime: string, endTime: string) => void;
  onEditItem: (item: MissionRow) => void;
  pending: PendingRange | null;
  onItemDragStart: (item: MissionRow, x: number, y: number, offsetMinutes?: number) => void;
  onItemDragUpdate: (x: number, y: number) => void;
  onItemDragEnd: (item: MissionRow, x: number, y: number) => void;
  draggingId: number | null;
  dropPreview: { time: string; durationMin: number } | null;
  onGestureActive: (active: boolean) => void;
  nowMinutes: number;
}) {
  const dayMissions = getMissions(date).filter((m) => !!m.start_time);

  const [dragRange, setDragRangeState] = useState<{ startY: number; endY: number } | null>(null);
  const dragRangeRef = useRef<{ startY: number; endY: number } | null>(null);
  const setDragRange = (next: { startY: number; endY: number } | null) => {
    dragRangeRef.current = next;
    setDragRangeState(next);
  };

  const beginRange = (y: number) => {
    onGestureActive(true);
    setDragRange({ startY: y, endY: y });
  };
  const updateRange = (y: number) => {
    const range = dragRangeRef.current;
    if (range) setDragRange({ ...range, endY: y });
  };
  const finishRange = () => {
    const range = dragRangeRef.current;
    if (!range) return;
    onGestureActive(false);
    setDragRange(null);
    const top = Math.min(range.startY, range.endY);
    const bottom = Math.max(range.startY, range.endY);
    const startMin = yToMinutes(top);
    let endMin = yToMinutes(bottom);
    if (endMin - startMin < DEFAULT_DURATION_MIN) endMin = startMin + DEFAULT_DURATION_MIN;
    onCreateRange(date, minutesToTime(startMin), minutesToTime(endMin));
  };

  return (
    <View style={[styles.dayCol, { width }, isToday && { backgroundColor: withTint(pointColor) }]}>
      {hours.map((h) => (
        <View key={h} style={[styles.hourLine, { top: h * HOUR_HEIGHT }]} />
      ))}

      <Pressable
        style={StyleSheet.absoluteFill}
        delayLongPress={260}
        onLongPress={(e) => beginRange(e.nativeEvent.locationY)}
        onPressMove={(e) => updateRange(e.nativeEvent.locationY)}
        onPressOut={finishRange}
      />

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
        const past = isToday && endMin <= nowMinutes;

        return (
          <ScheduledBlock
            key={item.id}
            item={item}
            top={top}
            height={height}
            color={color}
            done={done}
            past={past}
            dragging={draggingId === item.id}
            onEdit={() => onEditItem(item)}
            onDragStart={onItemDragStart}
            onDragUpdate={onItemDragUpdate}
            onDragEnd={onItemDragEnd}
            onGestureActive={onGestureActive}
          />
        );
      })}
    </View>
  );
}

function ScheduledBlock({ item, top, height, color, done, past, dragging, onEdit, onDragStart, onDragUpdate, onDragEnd, onGestureActive }: {
  item: MissionRow; top: number; height: number; color: string; done: boolean; past: boolean; dragging: boolean;
  onEdit: () => void;
  onDragStart: (item: MissionRow, x: number, y: number, offsetMinutes?: number) => void;
  onDragUpdate: (x: number, y: number) => void;
  onDragEnd: (item: MissionRow, x: number, y: number) => void;
  onGestureActive: (active: boolean) => void;
}) {
  const tapGesture = Gesture.Tap()
    .maxDuration(240)
    .onEnd(() => onEdit());

  const dragGesture = Gesture.Pan()
    .activateAfterLongPress(260)
    .onStart((e) => {
      onGestureActive(true);
      onDragStart(item, e.absoluteX, e.absoluteY, Math.max(0, Math.round((e.y / HOUR_HEIGHT) * 4) * 15));
    })
    .onUpdate((e) => onDragUpdate(e.absoluteX, e.absoluteY))
    .onFinalize((e) => {
      onGestureActive(false);
      onDragEnd(item, e.absoluteX, e.absoluteY);
    });

  const blockGesture = Gesture.Race(tapGesture, dragGesture);

  return (
    <GestureDetector gesture={blockGesture}>
      <View style={[styles.block, { top, height, borderLeftColor: color }, past && styles.blockPast, dragging && styles.blockDragging]}>
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
  dateHeaderCol: { alignItems: 'center', gap: 4 },
  dowText: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  dateCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateNumText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  dateNumTextSel: { color: '#fff' },

  body: { flex: 1 },
  scroll: { flex: 1 },
  gridRow: { flexDirection: 'row' },

  hourGutter: { position: 'relative' },
  hourLabel: {
    position: 'absolute', left: 0, right: 6,
    fontSize: 10, color: Colors.textMuted, fontWeight: '500', textAlign: 'right',
  },

  dayCol: {
    position: 'relative',
    borderLeftWidth: 1, borderLeftColor: Colors.border,
  },
  hourLine: {
    position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: Colors.border,
  },
  nowLine: { position: 'absolute', left: 0, right: 0, height: 2, zIndex: 5 },

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
  blockPast: { opacity: 0.38 },
  blockCheckbox: { alignSelf: 'flex-start' },
  checkDot: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  blockTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, lineHeight: 15 },
  blockTitleDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
});
