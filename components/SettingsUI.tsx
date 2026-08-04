import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { IconChevronRight, IconChevronLeft, IconProps } from './icons';

export function Divider() {
  return <View style={styles.divider} />;
}

export function SettingRow({ Icon, label, value, onPress }: {
  Icon: (props: IconProps) => React.ReactElement; label: string; value: string; onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIconWrap}>
        <Icon size={18} color={Colors.textPrimary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
      <IconChevronRight size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

export function SubScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.subHeader}>
      <Pressable onPress={onBack} style={styles.backBtn} hitSlop={10}>
        <IconChevronLeft size={22} color={Colors.textPrimary} />
      </Pressable>
      <Text style={styles.subHeaderTitle}>{title}</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

export function ComingSoonSub({ Icon, title, desc, onBack }: {
  Icon: (props: IconProps) => React.ReactElement; title: string; desc: string; onBack: () => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <SubScreenHeader title={title} onBack={onBack} />
      <View style={styles.comingSoonBody}>
        <View style={styles.comingSoonIconWrap}>
          <Icon size={36} color={Colors.textPrimary} />
        </View>
        <Text style={styles.comingSoonTitle}>{title}</Text>
        <Text style={styles.comingSoonDesc}>{desc}</Text>
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonBadgeText}>준비 중인 기능이에요</Text>
        </View>
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  title: {
    fontSize: 28, fontWeight: '800', color: Colors.textPrimary,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
    letterSpacing: -0.5,
  },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: Colors.textMuted,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  card: {
    backgroundColor: Colors.background,
    marginHorizontal: 16, borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 15, paddingHorizontal: 16,
  },
  rowIconWrap: { width: 26, alignItems: 'center' },
  rowLabel: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  rowValue: { fontSize: 14, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 54 },

  subHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  subHeaderTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  comingSoonBody: { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  comingSoonIconWrap: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  comingSoonTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  comingSoonDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 20 },
  comingSoonBadge: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  comingSoonBadgeText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
});
