import { useEffect, useRef } from 'react';

export function useAutoSave(isDirty: boolean, save: () => void, delay = 800) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDirty) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [isDirty, save, delay]);
}
