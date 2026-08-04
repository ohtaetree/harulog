import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ScrollView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '../constants/colors';
import { usePointColor } from '../hooks/usePointColor';
import { IconCheck } from './icons';
import { MissionRow, Priority } from '../db/missionDb';

const START_HOUR = 0;
const END_HOUR = 24;
const HOUR_HEIGHT = 56;
const LABEL_WIDTH = 44;
const DEFAULT_DURATION_MIN = 30;
const MIN_BLOCK_HEIGHT = 30;
const INITIAL_SCROLL_HOUR = 6;
const SNAP_MIN = 15;

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

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

export function yToTime(y: number) {
  return minutesToTime(yToMinutes(y));
}

export interface TimeGridHandle {
  /** Given a page-space (window) coordinate, returns the snapped time under it, or null if outside the grid. */
  getTimeAtPageXY: (pageX: number, pageY: number, cb: (time: string | null) => void) => void;
}

interface Props {
  items: MissionRow[]; // must all have start_time set
  onToggle: (id: number) => void;
  onEdit: (item: MissionRow) => void;
  onSlotPress: (time: string) => void;
  onCreateRange: (startTime: string, endTime: string) => void;
  style?: any;
}

const TimeGridView = forwardRef<TimeGridHandle, Props>(({ items, onToggle, onEdit, onSlotPress, onCreateRange, style }, ref) => {
  const scrollRef = useRef<any>(null);
  const containerRef = useRef<View>(null);
  const scrollOffsetRef = useRef(0);
  const pointColor = usePointColor();
  const [dragRange, setDragRangeState] = useState<{ startY: number; endY: number } | null>(null);
  const dragRangeRef = useRef<{ startY: number; endY: number } | null>(null);
  const setDragRange = (next: { startY: number; endY: number } | null) => {
    dragRangeRef.current = next;
    setDragRangeState(next);
  };
  const PRIORITY_COLOR: Record<Priority, string> = {
    high: '#EF4444', medium: pointColor, low: Colors.textMuted,
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: (INITIAL_SCROLL_HOUR - START_HOUR) * HOUR_HEIGHT, animated: false });
  }, []);

  useImperativeHandle(ref, () => ({
    getTimeAtPageXY(pageX, pageY, cb) {
      containerRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (pageX < x || pageX > x + width || pageY < y || pageY > y + height) {
          cb(null);
          return;
        }
        const contentY = (pageY - y) + scrollOffsetRef.current;
        cb(yToTime(contentY));
      });
    },
  }));

  const tapGesture = Gesture.Tap()
    .maxDuration(240)
    .onEnd((e) => {
      onSlotPress(yToTime(e.y));
    });

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
        if (bottom - top < HOUR_HEIGHT / 3) {
          onSlotPress(yToTime(top));
        } else {
          onCreateRange(yToTime(top), yToTime(bottom));
        }
      }
    });

  const gridGesture = Gesture.Race(tapGesture, createGesture);

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  return (
    <View ref={containerRef} style={[styles.wrap, style]} collapsable={false}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ height: totalHeight }}
        onScroll={(e) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      >
        <View style={[styles.gridBody, { height: totalHeight }]}>
          {hours.map((h) => (
            <View key={h} style={[styles.hourRow, { top: (h - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }]}>
              <Text style={styles.hourLabel}>{pad(h)}:00</Text>
              <View style={styles.hourLine} />
            </View>
          ))}

          <GestureDetector gesture={gridGesture}>
            <View style={StyleSheet.absoluteFill} />
          </GestureDetector>

          {dragRange && (() => {
            const top = Math.min(dragRange.startY, dragRange.endY);
            const bottom = Math.max(dragRange.startY, dragRange.endY);
            const height = Math.max(bottom - top, 4);
            return (
              <View pointerEvents="none" style={[styles.dragPreview, { top, height, left: LABEL_WIDTH + 8, borderColor: pointColor, backgroundColor: `${pointColor}22` }]}>
                <Text style={[styles.dragPreviewText, { color: pointColor }]}>
                  {yToTime(top)} – {yToTime(bottom)}
                </Text>
              </View>
            );
          })()}

          {items.map((item) => {
            if (!item.start_time) return null;
            const startMin = toMinutes(item.start_time);
            const endMin = item.end_time ? toMinutes(item.end_time) : startMin + DEFAULT_DURATION_MIN;
            const top = (startMin - START_HOUR * 60) / 60 * HOUR_HEIGHT;
            const height = Math.max((endMin - startMin) / 60 * HOUR_HEIGHT, MIN_BLOCK_HEIGHT);
            const color = PRIORITY_COLOR[item.priority];
            const done = item.done === 1;

            return (
              <View key={item.id} style={[styles.block, { top, height, left: LABEL_WIDTH + 8, borderLeftColor: color }]}>
                <Pressable style={styles.blockCheckbox} onPress={() => onToggle(item.id)} hitSlop={6}>
                  <View style={[styles.checkCircle, done && { backgroundColor: color, borderColor: color }]}>
                    {done && <IconCheck size={11} color="#fff" />}
                  </View>
                </Pressable>
                <Pressable style={styles.blockBody} onPress={() => onEdit(item)}>
                  <Text style={[styles.blockTitle, done && styles.blockTitleDone]} numberOfLines={height < 44 ? 1 : 2}>
                    {item.title}
                  </Text>
                  <Text style={styles.blockTime}>
                    {item.start_time}{item.end_time ? ` – ${item.end_time}` : ''}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
});

export default TimeGridView;

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  scroll: { flex: 1 },
  gridBody: { position: 'relative' },

  hourRow: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', alignItems: 'flex-start',
  },
  hourLabel: {
    width: LABEL_WIDTH, fontSize: 10, color: Colors.textMuted,
    fontWeight: '600', paddingTop: 2, textAlign: 'right', paddingRight: 4,
  },
  hourLine: { flex: 1, height: 1, backgroundColor: Colors.border, marginTop: 8 },

  dragPreview: {
    position: 'absolute', right: 6,
    borderRadius: 8, borderWidth: 1.5,
    padding: 4, justifyContent: 'center',
  },
  dragPreviewText: { fontSize: 10, fontWeight: '700' },

  block: {
    position: 'absolute', right: 6,
    backgroundColor: Colors.surface, borderRadius: 10, borderLeftWidth: 3,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 8, paddingVertical: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  blockCheckbox: { padding: 2 },
  checkCircle: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  blockBody: { flex: 1 },
  blockTitle: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  blockTitleDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  blockTime: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
});
