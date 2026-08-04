import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './components/TabNavigator';
import OnboardingScreen from './screens/OnboardingScreen';
import { Colors } from './constants/colors';
import { initDb } from './db/database';
import { useSettingsStore } from './stores/settingsStore';
import { useIsDesktop } from './hooks/useIsDesktop';
import { useIsTouchDevice } from './hooks/useIsTouchDevice';

function AppContent() {
  const { onboardingDone } = useSettingsStore();
  return onboardingDone ? <TabNavigator /> : <OnboardingScreen />;
}

export default function App() {
  useEffect(() => { initDb(); }, []);
  const isDesktop = useIsDesktop();
  const isTouchDevice = useIsTouchDevice();

  if (Platform.OS === 'web') {
    // 데스크톱 폭: 폰 프레임 없이 창 전체를 채움 (사이드바 레이아웃은 TabNavigator가 담당)
    if (isDesktop) {
      return (
        <GestureHandlerRootView style={styles.desktopShell}>
          <SafeAreaProvider>
            <StatusBar style="dark" />
            <AppContent />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      );
    }

    // 실제 휴대폰(터치 기기): 고정 프레임 없이 실제 화면 크기를 그대로 채움
    if (isTouchDevice) {
      return (
        <GestureHandlerRootView style={styles.mobileShell}>
          <SafeAreaProvider>
            <StatusBar style="dark" />
            <AppContent />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      );
    }

    // 좁은 데스크톱 브라우저 창: 폰 프레임 안에서 미리보기 형태로 렌더링
    return (
      <View style={styles.webShell}>
        <GestureHandlerRootView style={styles.phoneScreen}>
          <SafeAreaProvider>
            <StatusBar style="dark" />
            <AppContent />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  webShell: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh' as any,
  },
  phoneScreen: {
    width: 393,
    height: 852,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  mobileShell: {
    flex: 1,
    backgroundColor: Colors.background,
    height: '100dvh' as any,
  },
  desktopShell: {
    flex: 1,
    backgroundColor: Colors.background,
    minHeight: '100vh' as any,
  },
});
