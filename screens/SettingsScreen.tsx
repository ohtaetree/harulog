import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useSettingsStore, POINT_COLOR_PRESETS, DayDisplayMode, MIN_WEEK_VISIBLE_DAYS, MAX_WEEK_VISIBLE_DAYS } from '../stores/settingsStore';
import { usePointColor } from '../hooks/usePointColor';
import {
  IconPalette, IconPerson, IconSliders, IconColumns, IconCheck, IconClose, IconPlus,
} from '../components/icons';
import { Divider, SettingRow, ComingSoonSub, SubScreenHeader, styles as s } from '../components/SettingsUI';

type SubScreenKey = 'displayMode' | 'weekDays' | 'theme' | 'pointColor' | 'categories';

const DISPLAY_MODE_OPTIONS: { key: DayDisplayMode; label: string; desc: string }[] = [
  { key: 'icon', label: '아이콘만 표시', desc: '월간 뷰의 날짜 칸에 카테고리 아이콘만 보여줘요.' },
  { key: 'icon-text', label: '아이콘 + 일정 표시', desc: '아이콘과 함께 일정 제목도 함께 보여줘요.' },
  { key: 'text', label: '일정만 표시', desc: '아이콘 없이 일정 제목만 보여줘요.' },
];

function DisplayModeSub({ value, onSelect, onBack }: {
  value: DayDisplayMode; onSelect: (m: DayDisplayMode) => void; onBack: () => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <SubScreenHeader title="월간 뷰 표시 방식" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.subBody}>
        <View style={s.card}>
          {DISPLAY_MODE_OPTIONS.map((opt, i) => (
            <View key={opt.key}>
              {i > 0 && <Divider />}
              <Pressable style={styles.optionRow} onPress={() => onSelect(opt.key)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                  <Text style={styles.optionDesc}>{opt.desc}</Text>
                </View>
                {value === opt.key && <IconCheck size={16} color={Colors.textPrimary} />}
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function WeekDaysSub({ value, onSelect, onBack }: {
  value: number; onSelect: (n: number) => void; onBack: () => void;
}) {
  const pointColor = usePointColor();
  const options = Array.from(
    { length: MAX_WEEK_VISIBLE_DAYS - MIN_WEEK_VISIBLE_DAYS + 1 },
    (_, i) => MIN_WEEK_VISIBLE_DAYS + i
  );

  return (
    <View style={{ flex: 1 }}>
      <SubScreenHeader title="주간 뷰 표시 일수" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.subBody}>
        <Text style={styles.desc}>주간 뷰에서 한 화면에 보여줄 날짜 수를 선택하세요.</Text>
        <View style={styles.daysRow}>
          {options.map((n) => {
            const selected = n === value;
            return (
              <Pressable
                key={n}
                onPress={() => onSelect(n)}
                style={[styles.dayChip, selected && { backgroundColor: pointColor, borderColor: pointColor }]}
              >
                <Text style={[styles.dayChipText, selected && styles.dayChipTextSel]}>{n}일</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function PointColorSub({ onBack }: { onBack: () => void }) {
  const pointColor = usePointColor();
  const { setPointColor } = useSettingsStore();

  return (
    <View style={{ flex: 1 }}>
      <SubScreenHeader title="포인트 컬러" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.pointColorBody}>
        <Text style={styles.desc}>
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
    </View>
  );
}

function CategoriesSub({ onBack }: { onBack: () => void }) {
  const pointColor = usePointColor();
  const categories = useSettingsStore((st) => st.categories);
  const { addCategory, removeCategory } = useSettingsStore();
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (!input.trim()) return;
    addCategory(input);
    setInput('');
  };

  return (
    <View style={{ flex: 1 }}>
      <SubScreenHeader title="카테고리 관리" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.pointColorBody}>
        <Text style={styles.desc}>
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
            <Text style={styles.desc}>카테고리가 없어요. 아래에서 추가해보세요.</Text>
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
    </View>
  );
}

export default function SettingsScreen({ onClose }: { onClose: () => void }) {
  const dayDisplayMode = useSettingsStore((st) => st.dayDisplayMode);
  const setDayDisplayMode = useSettingsStore((st) => st.setDayDisplayMode);
  const weekVisibleDays = useSettingsStore((st) => st.weekVisibleDays);
  const setWeekVisibleDays = useSettingsStore((st) => st.setWeekVisibleDays);
  const categories = useSettingsStore((st) => st.categories);
  const pointColor = usePointColor();
  const [sub, setSub] = useState<SubScreenKey | null>(null);

  const displayModeLabel = DISPLAY_MODE_OPTIONS.find((o) => o.key === dayDisplayMode)?.label ?? '';

  let body: React.ReactNode;
  if (sub === 'displayMode') {
    body = <DisplayModeSub value={dayDisplayMode} onSelect={setDayDisplayMode} onBack={() => setSub(null)} />;
  } else if (sub === 'weekDays') {
    body = <WeekDaysSub value={weekVisibleDays} onSelect={setWeekVisibleDays} onBack={() => setSub(null)} />;
  } else if (sub === 'pointColor') {
    body = <PointColorSub onBack={() => setSub(null)} />;
  } else if (sub === 'categories') {
    body = <CategoriesSub onBack={() => setSub(null)} />;
  } else if (sub === 'theme') {
    body = (
      <ComingSoonSub Icon={IconPalette} title="테마" desc="지금은 블랙 앤 화이트 라이트 모드만 지원해요. 다크 모드는 준비 중이에요." onBack={() => setSub(null)} />
    );
  } else {
    body = (
      <>
        <View style={styles.header}>
          <Text style={s.title}>설정</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <IconClose size={16} color={Colors.textSecondary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.mainBody}>
          <Text style={s.sectionLabel}>보기 설정</Text>
          <View style={s.card}>
            <SettingRow Icon={IconSliders} label="월간 뷰 표시 방식" value={displayModeLabel} onPress={() => setSub('displayMode')} />
            <Divider />
            <SettingRow Icon={IconColumns} label="주간 뷰 표시 일수" value={`${weekVisibleDays}일`} onPress={() => setSub('weekDays')} />
          </View>

          <Text style={s.sectionLabel}>꾸미기</Text>
          <View style={s.card}>
            <SettingRow Icon={IconPalette} label="테마" value="블랙 앤 화이트" onPress={() => setSub('theme')} />
            <Divider />
            <Pressable style={s.row} onPress={() => setSub('pointColor')}>
              <View style={s.rowIconWrap}>
                <IconPalette size={18} color={Colors.textPrimary} />
              </View>
              <Text style={s.rowLabel}>포인트 컬러</Text>
              <View style={[styles.pointColorDot, { backgroundColor: pointColor }]} />
            </Pressable>
            <Divider />
            <SettingRow Icon={IconPerson} label="카테고리 관리" value={`${categories.length}개`} onPress={() => setSub('categories')} />
          </View>
        </ScrollView>
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  mainBody: { paddingBottom: 48 },
  subBody: { padding: 20, gap: 20 },
  desc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  optionLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  optionDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  daysRow: { flexDirection: 'row', gap: 8 },
  dayChip: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  dayChipText: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  dayChipTextSel: { color: '#fff' },

  pointColorBody: { padding: 20, gap: 20 },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  swatchItem: { alignItems: 'center', gap: 6, width: 64 },
  swatch: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  swatchLabel: { fontSize: 12, color: Colors.textSecondary },
  pointColorDot: { width: 16, height: 16, borderRadius: 8, marginRight: 4 },

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
