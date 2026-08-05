import { useEffect, useRef, useState } from 'react';
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

function useStableMobileViewportHeight() {
  const getViewportHeight = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    return Math.round(window.visualViewport?.height ?? window.innerHeight);
  };
  const [height, setHeight] = useState<number | undefined>(getViewportHeight);
  const stableHeightRef = useRef(height ?? 0);
  const viewportWidthRef = useRef(
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? Math.round(window.visualViewport?.width ?? window.innerWidth)
      : 0,
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const viewport = window.visualViewport;
    const syncViewport = () => {
      const nextHeight = Math.round(viewport?.height ?? window.innerHeight);
      const nextWidth = Math.round(viewport?.width ?? window.innerWidth);
      const orientationChanged = Math.abs(nextWidth - viewportWidthRef.current) > 80;
      const keyboardLikelyOpen =
        !orientationChanged &&
        stableHeightRef.current > 0 &&
        nextHeight < stableHeightRef.current * 0.78;

      // 키보드 때문에 줄어든 높이는 무시하되 화면 회전·주소창 변화는 실제 크기로 반영한다.
      if (!keyboardLikelyOpen) {
        viewportWidthRef.current = nextWidth;
        stableHeightRef.current = nextHeight;
        setHeight(nextHeight);
      }
    };

    syncViewport();
    viewport?.addEventListener('resize', syncViewport);
    window.addEventListener('resize', syncViewport);
    window.addEventListener('orientationchange', syncViewport);
    return () => {
      viewport?.removeEventListener('resize', syncViewport);
      window.removeEventListener('resize', syncViewport);
      window.removeEventListener('orientationchange', syncViewport);
    };
  }, []);

  return height;
}

export default function App() {
  useEffect(() => { initDb(); }, []);
  const isDesktop = useIsDesktop();
  const isTouchDevice = useIsTouchDevice();
  const mobileViewportHeight = useStableMobileViewportHeight();

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
        <GestureHandlerRootView
          style={[
            styles.mobileShell,
            mobileViewportHeight != null && {
              height: mobileViewportHeight,
              minHeight: mobileViewportHeight,
            },
          ]}
        >
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
