import { useSettingsStore } from '../stores/settingsStore';

/** The user-configurable accent color, used for buttons, active states, and progress indicators. */
export function usePointColor(): string {
  return useSettingsStore((s) => s.pointColor);
}
