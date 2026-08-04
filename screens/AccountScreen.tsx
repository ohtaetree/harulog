import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useSettingsStore, POINT_COLOR_PRESETS } from '../stores/settingsStore';
import { usePointColor } from '../hooks/usePointColor';
import {
  IconBell, IconPalette, IconLock, IconCloud, IconExport, IconPerson,
  IconInfo, IconRefresh, IconChevronRight, IconChevronLeft, IconCheck, IconClose, IconPlus, IconProps,
} from '../components/icons';

const APP_VERSION = '1.0.0';

type SubScreenKey = 'notification' | 'theme' | 'lock' | 'pointColor' | 'categories' | 'backup' | 'export';

function Divider() {
  return <View style={styles.divider} />;
}

function SettingRow({ Icon, label, value, onPress }: {
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

// ── 상세 페이지 ──────────────────────────────────────────────────────────────

function SubScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
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

function ComingSoonSub({ Icon, title, desc, onBack }: {
  Icon: (props: IconProps) => React.ReactElement; title: string; desc: string; onBack: () => void;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
    </SafeAreaView>
  );
}

function PointColorSub({ onBack }: { onBack: () => void }) {
  const pointColor = usePointColor();
  const { setPointColor } = useSettingsStore();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SubScreenHeader title="포인트 컬러" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.pointColorBody}>
        <Text style={styles.pointColorDesc}>
          앱 전체는 블랙 앤 화이트를 기본으로 하고, 버튼·진행률·선택 상태 등
          포인트가 필요한 곳에만 아래에서 고른 색이 적용돼요.
        </Text>
        <View style={styles.swatchGrid}>
          {POINT_COLOR_PRESETS.map((preset) => {
            const selected = preset.value === pointColor;
            return (
              <Pressable
                key={preset.value}
                onPress={() => setPointColor(preset.value)}
                style={styles.swatchItem}
              >
                <View style={[styles.swatch, { backgroundColor: preset.value }]}>
                  {selected && <IconCheck size={18} color="#fff" />}
                </View>
                <Text style={styles.swatchLabel}>{preset.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoriesSub({ onBack }: { onBack: () => void }) {
  const pointColor = usePointColor();
  const categories = useSettingsStore((s) => s.categories);
  const { addCategory, removeCategory } = useSettingsStore();
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (!input.trim()) return;
    addCategory(input);
    setInput('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SubScreenHeader title="카테고리 관리" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.pointColorBody}>
        <Text style={styles.pointColorDesc}>
          하루할일 화면의 카테고리 목록이에요. 삭제해도 기존 할일은 그대로 남고,
          "미분류"가 아니라 자체 섹션으로 계속 표시돼요.
        </Text>

        <View style={styles.catListWrap}>
          {categories.map((c) => (
            <View key={c} style={styles.catListRow}>
              <View style={styles.catListIconWrap}>
                <IconPerson size={14} color={Colors.textSecondary} />
              </View>
              <Text style={styles.catListLabel}>{c}</Text>
              <Pressable onPress={() => removeCategory(c)} hitSlop={10}>
                <IconClose size={14} color={Colors.textMuted} />
              </Pressable>
            </View>
          ))}
          {categories.length === 0 && (
            <Text style={styles.pointColorDesc}>카테고리가 없어요. 아래에서 추가해보세요.</Text>
          )}
        </View>

        <View style={styles.addCatRow}>
          <TextInput
            style={styles.addCatInput}
            value={input}
            onChangeText={setInput}
            placeholder="새 카테고리 이름"
            placeholderTextColor={Colors.textMuted}
            maxLength={20}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <Pressable style={[styles.addCatBtn, { backgroundColor: pointColor }]} onPress={handleAdd}>
            <IconPlus size={18} color="#fff" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function AccountScreen() {
  const { resetOnboarding } = useSettingsStore();
  const categories = useSettingsStore((s) => s.categories);
  const pointColor = usePointColor();
  const [sub, setSub] = useState<SubScreenKey | null>(null);

  if (sub === 'pointColor') return <PointColorSub onBack={() => setSub(null)} />;
  if (sub === 'categories') return <CategoriesSub onBack={() => setSub(null)} />;
  if (sub === 'notification') return (
    <ComingSoonSub Icon={IconBell} title="알림" desc="시간대별 일정 알림, 하루 요약 알림 기능을 준비하고 있어요." onBack={() => setSub(null)} />
  );
  if (sub === 'theme') return (
    <ComingSoonSub Icon={IconPalette} title="테마" desc="지금은 블랙 앤 화이트 라이트 모드만 지원해요. 다크 모드는 준비 중이에요." onBack={() => setSub(null)} />
  );
  if (sub === 'lock') return (
    <ComingSoonSub Icon={IconLock} title="잠금" desc="Face ID / Touch ID로 앱을 잠그는 기능을 준비하고 있어요." onBack={() => setSub(null)} />
  );
  if (sub === 'backup') return (
    <ComingSoonSub Icon={IconCloud} title="백업 / 복원" desc="iCloud로 할일과 일정을 백업하고 다른 기기에서 복원하는 기능을 준비하고 있어요." onBack={() => setSub(null)} />
  );
  if (sub === 'export') return (
    <ComingSoonSub Icon={IconExport} title="내보내기" desc="할일과 일정을 캘린더 파일(.ics)이나 텍스트로 내보내는 기능을 준비하고 있어요." onBack={() => setSub(null)} />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>내 계정</Text>

        {/* 기본 설정 */}
        <Text style={styles.sectionLabel}>기본 설정</Text>
        <View style={styles.card}>
          <SettingRow Icon={IconBell} label="알림" value="준비 중" onPress={() => setSub('notification')} />
          <Divider />
          <SettingRow Icon={IconLock} label="잠금" value="준비 중" onPress={() => setSub('lock')} />
        </View>

        {/* 꾸미기 */}
        <Text style={styles.sectionLabel}>꾸미기</Text>
        <View style={styles.card}>
          <SettingRow Icon={IconPalette} label="테마" value="블랙 앤 화이트" onPress={() => setSub('theme')} />
          <Divider />
          <Pressable style={styles.row} onPress={() => setSub('pointColor')}>
            <View style={styles.rowIconWrap}>
              <IconPalette size={18} color={Colors.textPrimary} />
            </View>
            <Text style={styles.rowLabel}>포인트 컬러</Text>
            <View style={[styles.pointColorDot, { backgroundColor: pointColor }]} />
            <IconChevronRight size={16} color={Colors.textMuted} />
          </Pressable>
          <Divider />
          <SettingRow Icon={IconPerson} label="카테고리 관리" value={`${categories.length}개`} onPress={() => setSub('categories')} />
        </View>

        {/* 데이터 관리 */}
        <Text style={styles.sectionLabel}>데이터 관리</Text>
        <View style={styles.card}>
          <SettingRow Icon={IconCloud} label="백업 / 복원" value="준비 중" onPress={() => setSub('backup')} />
          <Divider />
          <SettingRow Icon={IconExport} label="내보내기" value="준비 중" onPress={() => setSub('export')} />
        </View>

        {/* 앱 정보 */}
        <Text style={styles.sectionLabel}>앱 정보</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowIconWrap}>
              <IconInfo size={18} color={Colors.textPrimary} />
            </View>
            <Text style={styles.rowLabel}>버전</Text>
            <Text style={styles.rowValue}>v{APP_VERSION}</Text>
          </View>
        </View>

        {/* 기타 */}
        <Text style={styles.sectionLabel}>기타</Text>
        <View style={styles.card}>
          <Pressable onPress={resetOnboarding} style={styles.row}>
            <View style={styles.rowIconWrap}>
              <IconRefresh size={18} color={Colors.textPrimary} />
            </View>
            <Text style={styles.rowLabel}>온보딩 다시보기</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>하루로그 v{APP_VERSION} · 하루 스케줄</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  content: { paddingBottom: 48 },

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
  pointColorDot: { width: 16, height: 16, borderRadius: 8 },

  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 54 },

  footer: {
    textAlign: 'center', fontSize: 12, color: Colors.textMuted,
    marginTop: 32,
  },

  // ── 상세 페이지 헤더 ──
  subHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  subHeaderTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  // ── 준비중 상세 페이지 ──
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

  // ── 포인트 컬러 상세 페이지 ──
  pointColorBody: { padding: 20, gap: 20 },
  pointColorDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  swatchItem: { alignItems: 'center', gap: 6, width: 64 },
  swatch: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  swatchLabel: { fontSize: 12, color: Colors.textSecondary },

  // ── 카테고리 관리 상세 페이지 ──
  catListWrap: { gap: 4 },
  catListRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.background, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14,
  },
  catListIconWrap: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  catListLabel: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '600' },
  addCatRow: { flexDirection: 'row', gap: 10 },
  addCatInput: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.textPrimary, backgroundColor: Colors.background,
  },
  addCatBtn: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
});
