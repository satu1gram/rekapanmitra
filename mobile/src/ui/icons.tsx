/**
 * Icons drawn from the design canvas (Super app · Beranda). The paths are copied from the
 * artboard SVGs so the app and the design stay identical: a 22% tinted fill plus a 2.1 stroke.
 */
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color: string;
}

const TINT = 0.22;

export function PlusIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round">
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function BoxIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinejoin="round">
      <Path d="m21 8-9-5-9 5 9 5 9-5Z" fill={color} fillOpacity={TINT} />
      <Path d="M3 8v8l9 5 9-5V8M12 13v8" />
    </Svg>
  );
}

export function ChatIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinejoin="round">
      <Path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" fill={color} fillOpacity={TINT} />
      <Path d="M9 11h6M9 14h3.5" strokeLinecap="round" />
    </Svg>
  );
}

export function ListIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round">
      <Rect x={4} y={3} width={16} height={18} rx={3} fill={color} fillOpacity={TINT} />
      <Path d="M8 8h8M8 12h8M8 16h5" />
    </Svg>
  );
}

export function PeopleIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round">
      <Circle cx={9} cy={8} r={4} fill={color} fillOpacity={TINT} />
      <Path d="M2 21a7 7 0 0 1 14 0M17 11a3 3 0 1 0 0-6M22 21a6 6 0 0 0-4-5.6" />
    </Svg>
  );
}

export function WalletIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round">
      <Rect x={3} y={6} width={18} height={13} rx={3} fill={color} fillOpacity={TINT} />
      <Path d="M3 10h18M16 15h2" />
    </Svg>
  );
}

export function FlagIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 4h11l-2 4 2 4H5Z" fill={color} fillOpacity={TINT} />
      <Path d="M5 21V4" />
    </Svg>
  );
}

export function StoreIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinejoin="round">
      <Path d="M4 9h16v11H4Z" fill={color} fillOpacity={TINT} />
      <Path d="m4 9 1.5-5h13L20 9M9 20v-6h6v6" />
    </Svg>
  );
}

export function MoreIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx={5.5} cy={12} r={2} />
      <Circle cx={12} cy={12} r={2} />
      <Circle cx={18.5} cy={12} r={2} />
    </Svg>
  );
}

export function SearchIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round">
      <Circle cx={11} cy={11} r={6.5} fill={color} fillOpacity={0.14} />
      <Path d="m20 20-4-4" />
    </Svg>
  );
}

export function ChevronIcon({ size = 18, color, direction }: IconProps & { direction: 'left' | 'right' | 'up' | 'down' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round">
      <Path d={{ left: 'm15 6-6 6 6 6', right: 'm9 6 6 6-6 6', up: 'm6 15 6-6 6 6', down: 'm6 9 6 6 6-6' }[direction]} />
    </Svg>
  );
}

export function OfflineIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round">
      <Path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" />
      <Circle cx={12} cy={19.5} r={1.2} fill={color} />
      <Path d="M3 3l18 18" />
    </Svg>
  );
}

/* Tab bar icons from the design's bottom navigation: filled when active, outlined otherwise. */

export function HomeTabIcon({ size = 26, color, active }: IconProps & { active: boolean }) {
  return active ? (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
    </Svg>
  ) : (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round">
      <Path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
    </Svg>
  );
}

export function HistoryTabIcon({ size = 26, color, active }: IconProps & { active: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Rect x={4} y={3} width={16} height={18} rx={3} fill={active ? color : 'none'} fillOpacity={active ? TINT : 0} />
      <Path d="M8 8h8M8 12h8M8 16h5" />
    </Svg>
  );
}

export function StockTabIcon({ size = 26, color, active }: IconProps & { active: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round">
      <Path d="m21 8-9-5-9 5 9 5 9-5Z" fill={active ? color : 'none'} fillOpacity={active ? TINT : 0} />
      <Path d="M3 8v8l9 5 9-5V8M12 13v8" />
    </Svg>
  );
}

export function AccountTabIcon({ size = 26, color, active }: IconProps & { active: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Circle cx={12} cy={8} r={4} fill={active ? color : 'none'} fillOpacity={active ? TINT : 0} />
      <Path d="M4 21a8 8 0 0 1 16 0" />
    </Svg>
  );
}

export function CloseIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round">
      <Path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

/* Icons from the design's order screens (Super app · Tambah order / Status order). */

export function MinusIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round">
      <Path d="M5 12h14" />
    </Svg>
  );
}

export function CheckIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m5 12 5 5 9-10" />
    </Svg>
  );
}

export function CameraIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinejoin="round">
      <Path d="M4 8h3l2-3h6l2 3h3v11H4V8Z" fill={color} fillOpacity={TINT} />
      <Circle cx={12} cy={13} r={3.5} />
    </Svg>
  );
}

export function ShareIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M6 11H5v10h14V11h-1" />
    </Svg>
  );
}

export function TrashIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 7l1 13h10l1-13Z" fill={color} fillOpacity={TINT} />
      <Path d="M4 7h16M10 11v6M14 11v6M9 7V4h6v3" />
    </Svg>
  );
}

export function MinusCircleIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-5 9h10v2H7v-2Z" />
    </Svg>
  );
}
