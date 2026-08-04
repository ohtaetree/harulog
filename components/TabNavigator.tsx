import { useState, useRef, ReactElement } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { usePointColor } from '../hooks/usePointColor';
import { withAlpha } from '../utils/color';
import { IconSchedule, IconPerson, IconProps } from './icons';
import MissionScreen from '../screens/MissionScreen';
import AccountScreen from '../screens/AccountScreen';

const TABS: { key: string; label: string; Icon: (props: IconProps) => ReactElement }[] = [
  { key: 'mission', label: '하루할일', Icon: IconSchedule },
  { key: 'account', label: '내 계정',  Icon: IconPerson },
];

export default function TabNavigator() {
  const [active, setActive] = useState(0);
  const bounceAnims = useRef(TABS.map(() => new Animated.Value(1))).current;
  const isDesktop = useIsDesktop();
  const pointColor = usePointColor();

  const handlePress = (i: number) => {
    Animated.sequence([
      Animated.timing(bounceAnims[i], { toValue: 0.75, duration: 80, useNativeDriver: true }),
      Animated.spring(bounceAnims[i], { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();
    setActive(i);
  };

  const renderScreen = () => {
    switch (active) {
      case 0: return <MissionScreen />;
      case 1: return <AccountScreen />;
      default: return <MissionScreen />;
    }
  };

  if (isDesktop) {
    return (
      <View style={styles.desktopRoot}>
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>하루로그</Text>
          {TABS.map((tab, i) => {
            const isActive = i === active;
            return (
              <Pressable key={tab.key} onPress={() => handlePress(i)}
                style={[styles.sidebarItem, isActive && { backgroundColor: withAlpha(pointColor, 0.1) }]}>
                <tab.Icon size={19} color={isActive ? pointColor : Colors.textSecondary} />
                <Text style={[styles.sidebarLabel, isActive && { color: pointColor }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.desktopContent}>{renderScreen()}</View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.content}>{renderScreen()}</View>

      <View style={styles.tabBar}>
        {TABS.map((tab, i) => {
          const isActive = i === active;
          return (
            <Pressable key={tab.key} onPress={() => handlePress(i)} style={styles.tab}>
              <Animated.View style={{ transform: [{ scale: bounceAnims[i] }] }}>
                <tab.Icon size={22} color={isActive ? pointColor : Colors.textMuted} />
              </Animated.View>
              <Text style={[styles.label, isActive && { color: pointColor }]}>
                {tab.label}
              </Text>
              {isActive && <View style={[styles.activeDot, { backgroundColor: pointColor }]} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },

  desktopRoot: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 220,
    backgroundColor: Colors.background,
    borderRightWidth: 1, borderRightColor: Colors.border,
    paddingTop: 24, paddingHorizontal: 12, gap: 4,
  },
  sidebarTitle: {
    fontSize: 15, fontWeight: '800', color: Colors.textPrimary,
    paddingHorizontal: 10, marginBottom: 16,
  },
  sidebarItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10,
  },
  sidebarLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  desktopContent: { flex: 1, minWidth: 0 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 6,
    paddingBottom: 8,
  },
  tab: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 2, paddingVertical: 4,
  },
  label: { fontSize: 10, fontWeight: '600', color: Colors.textMuted, letterSpacing: -0.2 },
  activeDot: {
    width: 4, height: 4, borderRadius: 2,
    marginTop: 2,
  },
});
