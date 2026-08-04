import { create } from 'zustand';
import { Platform } from 'react-native';

const STORAGE_KEY = 'harulog_settings';

export const DEFAULT_POINT_COLOR = '#111111';
export const DEFAULT_CATEGORIES = ['업무', '개인', '건강', '학습', '가정', '기타'];

export const POINT_COLOR_PRESETS = [
  { name: '블랙',   value: '#111111' },
  { name: '그레이', value: '#6B6B6B' },
  { name: '레드',   value: '#E5484D' },
  { name: '오렌지', value: '#F5862A' },
  { name: '옐로우', value: '#E8A400' },
  { name: '그린',   value: '#2F9E44' },
  { name: '틸',     value: '#0F9488' },
  { name: '블루',   value: '#2170D8' },
  { name: '인디고', value: '#4A54D6' },
  { name: '퍼플',   value: '#9333CC' },
  { name: '핑크',   value: '#D6357F' },
] as const;

export type DayDisplayMode = 'icon' | 'icon-text' | 'text';
export type ScheduleViewMode = 'week' | 'month';

export const MIN_WEEK_VISIBLE_DAYS = 3;
export const MAX_WEEK_VISIBLE_DAYS = 7;

interface Settings {
  onboardingDone: boolean;
  pointColor: string;
  categories: string[];
  dayDisplayMode: DayDisplayMode;
  weekVisibleDays: number;
  scheduleViewMode: ScheduleViewMode;
}

function loadSettings(): Settings {
  if (Platform.OS === 'web') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          onboardingDone: !!parsed.onboardingDone,
          pointColor: parsed.pointColor ?? DEFAULT_POINT_COLOR,
          categories: Array.isArray(parsed.categories) && parsed.categories.length
            ? parsed.categories : DEFAULT_CATEGORIES,
          dayDisplayMode: ['icon', 'icon-text', 'text'].includes(parsed.dayDisplayMode)
            ? parsed.dayDisplayMode : 'icon',
          weekVisibleDays: Number.isInteger(parsed.weekVisibleDays)
            && parsed.weekVisibleDays >= MIN_WEEK_VISIBLE_DAYS && parsed.weekVisibleDays <= MAX_WEEK_VISIBLE_DAYS
            ? parsed.weekVisibleDays : 7,
          scheduleViewMode: parsed.scheduleViewMode === 'month' ? 'month' : 'week',
        };
      }
    } catch {}
  }
  return {
    onboardingDone: false, pointColor: DEFAULT_POINT_COLOR, categories: DEFAULT_CATEGORIES,
    dayDisplayMode: 'icon', weekVisibleDays: 7, scheduleViewMode: 'week',
  };
}

function saveSettings(s: Settings) {
  if (Platform.OS === 'web') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }
}

interface SettingsState extends Settings {
  completeOnboarding: () => void;
  resetOnboarding:    () => void;
  setPointColor:      (color: string) => void;
  addCategory:        (name: string) => void;
  removeCategory:     (name: string) => void;
  setDayDisplayMode:  (mode: DayDisplayMode) => void;
  setWeekVisibleDays: (days: number) => void;
  setScheduleViewMode: (mode: ScheduleViewMode) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...loadSettings(),

  completeOnboarding() {
    const next: Settings = { ...get(), onboardingDone: true };
    saveSettings(next);
    set(next);
  },

  resetOnboarding() {
    const next: Settings = { ...get(), onboardingDone: false };
    saveSettings(next);
    set(next);
  },

  setPointColor(color) {
    const next: Settings = { ...get(), pointColor: color };
    saveSettings(next);
    set(next);
  },

  addCategory(name) {
    const trimmed = name.trim();
    if (!trimmed || get().categories.includes(trimmed)) return;
    const next: Settings = { ...get(), categories: [...get().categories, trimmed] };
    saveSettings(next);
    set(next);
  },

  removeCategory(name) {
    const next: Settings = { ...get(), categories: get().categories.filter((c) => c !== name) };
    saveSettings(next);
    set(next);
  },

  setDayDisplayMode(mode) {
    const next: Settings = { ...get(), dayDisplayMode: mode };
    saveSettings(next);
    set(next);
  },

  setWeekVisibleDays(days) {
    const clamped = Math.min(MAX_WEEK_VISIBLE_DAYS, Math.max(MIN_WEEK_VISIBLE_DAYS, Math.round(days)));
    const next: Settings = { ...get(), weekVisibleDays: clamped };
    saveSettings(next);
    set(next);
  },

  setScheduleViewMode(mode) {
    const next: Settings = { ...get(), scheduleViewMode: mode };
    saveSettings(next);
    set(next);
  },
}));
