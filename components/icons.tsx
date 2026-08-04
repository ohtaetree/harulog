import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Colors } from '../constants/colors';

export interface IconProps {
  size?: number;
  color?: string;
}

const STROKE = 1.8;

export function IconSchedule({ size = 22, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="16" rx="3" stroke={color} strokeWidth={STROKE} />
      <Line x1="3" y1="9.5" x2="21" y2="9.5" stroke={color} strokeWidth={STROKE} />
      <Line x1="7.5" y1="3" x2="7.5" y2="7" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Line x1="16.5" y1="3" x2="16.5" y2="7" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M7.5 14.5L10 17L16.5 11" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconPerson({ size = 22, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.6" stroke={color} strokeWidth={STROKE} />
      <Path d="M4.5 20c1.4-4.2 4.4-6.3 7.5-6.3s6.1 2.1 7.5 6.3" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function IconCheck({ size = 14, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12.5L9 17.5L20 6" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconCheckCircle({ size = 22, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.6" stroke={color} strokeWidth={STROKE} />
      <Path d="M8 12.4L10.5 15L16 9.5" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconClose({ size = 14, color = Colors.textMuted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function IconChevronLeft({ size = 22, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconChevronRight({ size = 22, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5L16 12L9 19" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconChevronDown({ size = 16, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 9L12 16L19 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconChevronUp({ size = 16, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 15L12 8L19 15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconPlus({ size = 18, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function IconBell({ size = 20, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10Z" stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
      <Path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function IconPalette({ size = 20, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={STROKE} />
      <Circle cx="9" cy="9.5" r="1.3" fill={color} />
      <Circle cx="13.5" cy="8" r="1.3" fill={color} />
      <Circle cx="16" cy="12" r="1.3" fill={color} />
      <Circle cx="10" cy="15" r="1.3" fill={color} />
    </Svg>
  );
}

export function IconLock({ size = 20, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="9" rx="2" stroke={color} strokeWidth={STROKE} />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function IconCloud({ size = 20, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7.2 17h9.8a3.8 3.8 0 0 0 .5-7.57A5.3 5.3 0 0 0 7.3 8.9 3.8 3.8 0 0 0 7.2 17Z" stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
    </Svg>
  );
}

export function IconExport({ size = 20, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 15V4" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M7.5 8.5L12 4l4.5 4.5" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function IconInfo({ size = 20, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={STROKE} />
      <Line x1="12" y1="11" x2="12" y2="16.2" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Circle cx="12" cy="7.8" r="1" fill={color} />
    </Svg>
  );
}

export function IconBriefcase({ size = 22, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="8" width="18" height="11" rx="2" stroke={color} strokeWidth={STROKE} />
      <Path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Line x1="3" y1="13" x2="21" y2="13" stroke={color} strokeWidth={STROKE} />
    </Svg>
  );
}

export function IconMedical({ size = 22, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke={color} strokeWidth={STROKE} />
      <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function IconPencil({ size = 22, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 20l1-4.5L15.5 5 19 8.5 8.5 19 4 20Z" stroke={color} strokeWidth={STROKE} strokeLinejoin="round" strokeLinecap="round" />
      <Line x1="13" y1="7" x2="17" y2="10.5" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function IconHome({ size = 22, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 11.5L12 4l8 7.5" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
    </Svg>
  );
}

export function IconTag({ size = 22, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11.5 4H5a1 1 0 0 0-1 1v6.5a1 1 0 0 0 .3.7l9 9a1 1 0 0 0 1.4 0l6.5-6.5a1 1 0 0 0 0-1.4l-9-9a1 1 0 0 0-.7-.3Z" stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
      <Circle cx="8.3" cy="8.3" r="1.3" fill={color} />
    </Svg>
  );
}

export function IconSliders({ size = 20, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Circle cx="9" cy="6" r="2.1" fill={Colors.background} stroke={color} strokeWidth={STROKE} />
      <Line x1="4" y1="13" x2="20" y2="13" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Circle cx="15" cy="13" r="2.1" fill={Colors.background} stroke={color} strokeWidth={STROKE} />
      <Line x1="4" y1="20" x2="20" y2="20" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Circle cx="11.5" cy="20" r="2.1" fill={Colors.background} stroke={color} strokeWidth={STROKE} />
    </Svg>
  );
}

export function IconRefresh({ size = 20, color = Colors.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3M19.5 12a7.5 7.5 0 0 1-12.8 5.3" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M17 3.2v4.2h-4.2M7 20.8v-4.2h4.2" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
