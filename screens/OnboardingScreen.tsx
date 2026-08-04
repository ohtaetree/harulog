import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useSettingsStore } from '../stores/settingsStore';
import { usePointColor } from '../hooks/usePointColor';
import { IconSchedule, IconCheckCircle, IconChevronRight } from '../components/icons';

const { width: W } = Dimensions.get('window');

const PAGES = [
  {
    Icon: IconSchedule,
    title: '하루스케줄',
    tag: '일정',
    desc: '시간이 정해진 약속과\n시간이 정해지지 않은 할일을\n한 화면에서 함께 확인하세요.',
    points: ['시간대별 일정 그리드', '빈 시간대 눌러 바로 추가', '주간 날짜바로 한눈에 이동'],
  },
  {
    Icon: IconCheckCircle,
    title: '할일 체크',
    tag: '완료',
    desc: '오늘 해야 할 일을 카테고리로 정리하고\n하나씩 체크하며 하루를 완성하세요.',
    points: ['카테고리별 섹션 구분', '체크 한 번으로 완료 처리', '달성률 실시간 확인'],
  },
];

const TOTAL = PAGES.length;

export default function OnboardingScreen() {
  const { completeOnboarding } = useSettingsStore();
  const pointColor = usePointColor();
  const [page, setPage]   = useState(0);
  const [width, setWidth] = useState(W);
  const translateX = useRef(new Animated.Value(0)).current;

  const goTo = (next: number) => {
    setPage(next);
    Animated.spring(translateX, {
      toValue: -next * width,
      useNativeDriver: true,
      tension: 200, friction: 28,
    }).start();
  };

  const isLast = page === TOTAL - 1;

  return (
    <SafeAreaView
      style={styles.safe}
      edges={['top', 'bottom']}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        setWidth(w);
        translateX.setValue(-page * w);
      }}
    >
      {/* 건너뛰기 */}
      {!isLast && (
        <Pressable style={styles.skipBtn} onPress={completeOnboarding}>
          <Text style={styles.skipText}>건너뛰기</Text>
        </Pressable>
      )}

      {/* 슬라이드 트랙 */}
      <View style={styles.track}>
        <Animated.View style={[styles.slideRow, { width: width * TOTAL, transform: [{ translateX }] }]}>
          {PAGES.map((p, i) => (
            <View key={i} style={[styles.page, { width }]}>
              <View style={styles.iconCircle}>
                <p.Icon size={44} color={Colors.textPrimary} />
              </View>
              <View style={[styles.tagChip, { backgroundColor: pointColor }]}>
                <Text style={styles.tagText}>{p.tag}</Text>
              </View>
              <Text style={styles.pageTitle}>{p.title}</Text>
              <Text style={styles.pageDesc}>{p.desc}</Text>
              <View style={styles.pointList}>
                {p.points.map((pt) => (
                  <View key={pt} style={styles.pointRow}>
                    <View style={[styles.pointDot, { backgroundColor: pointColor }]} />
                    <Text style={styles.pointText}>{pt}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* 하단 푸터 */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <View key={i} style={[
              styles.dot,
              i === page
                ? { width: 20, backgroundColor: pointColor }
                : { width: 8, backgroundColor: Colors.border },
            ]} />
          ))}
        </View>

        {isLast ? (
          <Pressable style={[styles.startBtn, { backgroundColor: pointColor }]} onPress={completeOnboarding}>
            <Text style={styles.startBtnText}>시작하기</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.nextBtn, { backgroundColor: pointColor }]} onPress={() => goTo(page + 1)}>
            <Text style={styles.nextBtnText}>다음</Text>
            <IconChevronRight size={16} color="#fff" />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  skipBtn: { alignSelf: 'flex-end', padding: 16 },
  skipText: { fontSize: 14, color: Colors.textMuted },

  track: { flex: 1, overflow: 'hidden' },
  slideRow: { flex: 1, flexDirection: 'row' },

  page: {
    flex: 1, paddingHorizontal: 32, paddingTop: 16,
    alignItems: 'center',
  },

  iconCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },

  tagChip: {
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20, marginBottom: 12,
  },
  tagText: { fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 1 },

  pageTitle: {
    fontSize: 32, fontWeight: '800', color: Colors.textPrimary,
    marginBottom: 16, letterSpacing: -0.5,
  },
  pageDesc: {
    fontSize: 15, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 24, marginBottom: 28,
  },
  pointList: { width: '100%', gap: 10 },
  pointRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pointDot: { width: 7, height: 7, borderRadius: 4 },
  pointText: { fontSize: 14, color: Colors.textSecondary },

  footer: {
    paddingHorizontal: 24, paddingBottom: 24, paddingTop: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },

  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 24,
  },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  startBtn: {
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 24,
  },
  startBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
