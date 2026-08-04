import { useRef } from 'react';
import { Animated } from 'react-native';

export function useDateFade(loadDate: (date: string) => void) {
  const opacity = useRef(new Animated.Value(1)).current;

  const navigate = (newDate: string) => {
    Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      loadDate(newDate);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  };

  return { opacity, navigate };
}
