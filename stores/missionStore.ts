import { create } from 'zustand';
import {
  MissionRow,
  Priority,
  getMissions,
  addMission,
  toggleMission,
  deleteMission,
  updateMission,
} from '../db/missionDb';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

interface MissionState {
  date: string;
  missions: MissionRow[];
  loadDate: (date: string) => void;
  add: (title: string, priority: Priority, category: string, startTime?: string | null, endTime?: string | null) => void;
  toggle: (id: number) => void;
  remove: (id: number) => void;
  update: (id: number, title: string, priority: Priority, category: string, startTime?: string | null, endTime?: string | null, date?: string) => void;
}

export const useMissionStore = create<MissionState>((set, get) => ({
  date: todayStr(),
  missions: [],

  loadDate(date) {
    set({ date, missions: getMissions(date) });
  },

  add(title, priority, category, startTime = null, endTime = null) {
    const { date } = get();
    addMission(date, title, priority, category, startTime, endTime);
    set({ missions: getMissions(date) });
  },

  toggle(id) {
    const { date, missions } = get();
    const mission = missions.find((m) => m.id === id);
    if (!mission) return;
    toggleMission(id, mission.done === 0);
    set({ missions: getMissions(date) });
  },

  remove(id) {
    const { date } = get();
    deleteMission(id);
    set({ missions: getMissions(date) });
  },

  update(id, title, priority, category, startTime = null, endTime = null, date) {
    const { date: currentDate } = get();
    updateMission(id, title, priority, category, startTime, endTime, date);
    set({ missions: getMissions(currentDate) });
  },
}));
