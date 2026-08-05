import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useSettingsStore } from '../stores/settingsStore';
import {
  IconBell, IconLock, IconCloud, IconExport, IconInfo, IconRefresh,
} from '../components/icons';
import { Divider, SettingRow, ComingSoonSub, styles as s } from '../components/SettingsUI';

const APP_VERSION = '1.12.3';

type SubScreenKey = 'notification' | 'lock' | 'backup' | 'export';

export default function AccountScreen() {
  const { resetOnboarding } = useSettingsStore();
  const [sub, setSub] = useState<SubScreenKey | null>(null);

  if (sub === 'notification') return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ComingSoonSub Icon={IconBell} title="알림" desc="시간대별 일정 알림, 하루 요약 알림 기능을 준비하고 있어요." onBack={() => setSub(null)} />
    </SafeAreaView>
  );
  if (sub === 'lock') return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ComingSoonSub Icon={IconLock} title="잠금" desc="Face ID / Touch ID로 앱을 잠그는 기능을 준비하고 있어요." onBack={() => setSub(null)} />
    </SafeAreaView>
  );
  if (sub === 'backup') return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ComingSoonSub Icon={IconCloud} title="백업 / 복원" desc="iCloud로 할일과 일정을 백업하고 다른 기기에서 복원하는 기능을 준비하고 있어요." onBack={() => setSub(null)} />
    </SafeAreaView>
  );
  if (sub === 'export') return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ComingSoonSub Icon={IconExport} title="내보내기" desc="할일과 일정을 캘린더 파일(.ics)이나 텍스트로 내보내는 기능을 준비하고 있어요." onBack={() => setSub(null)} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={s.title}>내 계정</Text>

        {/* 기본 설정 */}
        <Text style={s.sectionLabel}>기본 설정</Text>
        <View style={s.card}>
          <SettingRow Icon={IconBell} label="알림" value="준비 중" onPress={() => setSub('notification')} />
          <Divider />
          <SettingRow Icon={IconLock} label="잠금" value="준비 중" onPress={() => setSub('lock')} />
        </View>

        {/* 데이터 관리 */}
        <Text style={s.sectionLabel}>데이터 관리</Text>
        <View style={s.card}>
          <SettingRow Icon={IconCloud} label="백업 / 복원" value="준비 중" onPress={() => setSub('backup')} />
          <Divider />
          <SettingRow Icon={IconExport} label="내보내기" value="준비 중" onPress={() => setSub('export')} />
        </View>

        {/* 앱 정보 */}
        <Text style={s.sectionLabel}>앱 정보</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowIconWrap}>
              <IconInfo size={18} color={Colors.textPrimary} />
            </View>
            <Text style={s.rowLabel}>버전</Text>
            <Text style={s.rowValue}>v{APP_VERSION}</Text>
          </View>
        </View>

        {/* 기타 */}
        <Text style={s.sectionLabel}>기타</Text>
        <View style={s.card}>
          <Pressable onPress={resetOnboarding} style={s.row}>
            <View style={s.rowIconWrap}>
              <IconRefresh size={18} color={Colors.textPrimary} />
            </View>
            <Text style={s.rowLabel}>온보딩 다시보기</Text>
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
  footer: {
    textAlign: 'center', fontSize: 12, color: Colors.textMuted,
    marginTop: 32,
  },
});
