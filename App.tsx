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
  const viewportWidthRef = useRef(
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? Math.round(window.visualViewport?.width ?? window.innerWidth)
      : 0,
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const viewport = window.visualViewport;
    const syncOrientation = () => {
      const nextWidth = Math.round(viewport?.width ?? window.innerWidth);
      if (Math.abs(nextWidth - viewportWidthRef.current) > 80) {
        viewportWidthRef.current = nextWidth;
        setHeight(Math.round(viewport?.height ?? window.innerHeight));
      }
    };

    const root = document.documentElement;
    const body = document.body;
    const previous = {
      rootOverflow: root.style.overflow,
      rootHeight: root.style.height,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
      bodyPosition: body.style.position,
      bodyWidth: body.style.width,
    };
    root.style.overflow = 'hidden';
    root.style.height = '100%';
    body.style.overflow = 'hidden';
    body.style.height = '100%';
    body.style.position = 'fixed';
    body.style.width = '100%';

    window.addEventListener('orientationchange', syncOrientation);
    return () => {
      window.removeEventListener('orientationchange', syncOrientation);
      root.style.overflow = previous.rootOverflow;
      root.style.height = previous.rootHeight;
      body.style.overflow = previous.bodyOverflow;
      body.style.height = previous.bodyHeight;
      body.style.position = previous.bodyPosition;
      body.style.width = previous.bodyWidth;
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
    flex: 0,
    width: '100%',
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  desktopShell: {
    flex: 1,
    backgroundColor: Colors.background,
    minHeight: '100vh' as any,
  },
});
