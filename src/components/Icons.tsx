type IconProps = { size?: number; strokeWidth?: number; className?: string };
const base = (size = 20, strokeWidth = 1.75) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function TrophyIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4a1 1 0 0 0-1 1v1a4 4 0 0 0 4 4M17 5h3a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4" />
    </svg>
  );
}

export function CompassIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5 13 13l-3.5 1.5L11 11l3.5-1.5Z" />
    </svg>
  );
}

export function OwlIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M6 10c0-3.5 2.5-6 6-6s6 2.5 6 6v5a6 6 0 0 1-12 0v-5Z" />
      <path d="M4 6c1-1.3 2-2 3-2M20 6c-1-1.3-2-2-3-2" />
      <circle cx="9.5" cy="11" r="1.4" />
      <circle cx="14.5" cy="11" r="1.4" />
      <path d="M11 14.2h2l-1 1.4-1-1.4Z" />
    </svg>
  );
}

export function UserIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

export function TrendUpIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 16l5-5 4 4 7-8" />
      <path d="M15 7h5v5" />
    </svg>
  );
}

export function XIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function ChevronLeftIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ArrowUpRightIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M7 17 17 7M17 7H10M17 7v7" />
    </svg>
  );
}

export function ClockIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function CheckIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M5 12.5 9.5 17 19 7" />
    </svg>
  );
}

export function HourglassIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M6 3h12M6 21h12" />
      <path d="M7 3c0 4 3 5 5 6-2 1-5 2-5 6M17 3c0 4-3 5-5 6 2 1 5 2 5 6" />
    </svg>
  );
}

export function ShieldIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6l-7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function SparklesIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M12 3v4M12 17v4M4.5 12h4M15.5 12h4" />
      <path d="M7 7l2.5 2.5M14.5 14.5 17 17M17 7l-2.5 2.5M9.5 14.5 7 17" />
    </svg>
  );
}

export function DumbbellIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 9v6M2 10.5v3M20 9v6M22 10.5v3" />
      <path d="M7 12h10M7 8v8M17 8v8" />
    </svg>
  );
}

export function BrainIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8A3.5 3.5 0 0 0 8.5 18a3 3 0 0 0 3-3V6a2 2 0 0 0-2.5-2Z" />
      <path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5.8A3.5 3.5 0 0 1 15.5 18a3 3 0 0 1-3-3V6a2 2 0 0 1 2.5-2Z" />
    </svg>
  );
}

export function PaletteIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M12 3a9 8 0 1 0 0 16c1.1 0 2-.7 2-1.8 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1 .8-1.6 1.8-1.6H17a4 4 0 0 0 4-4c0-3.3-4-6-9-6Z" />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MapIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

export function BookIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5a2.5 2.5 0 0 0 2.5-2.5v-13Z" />
    </svg>
  );
}

export function UsersIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M16 8.2a2.7 2.7 0 1 1 0 5.3M18.5 20c0-2.6-1.6-4.6-3.8-5.3" />
    </svg>
  );
}

export function GemIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M6 3h12l3 5-9 13L3 8l3-5Z" />
      <path d="M3 8h18M9 3l-2 5 5 13 5-13-2-5" />
    </svg>
  );
}

export function MedalIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M8 3h8l-2.5 6h-3L8 3Z" />
      <circle cx="12" cy="14" r="6.5" />
      <path d="M12 11v6M9.5 13.2 12 11l2.5 2.2" />
    </svg>
  );
}

export function HeartIcon({ size, strokeWidth, className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(size, strokeWidth)} fill={filled ? "currentColor" : "none"} className={className}>
      <path d="M12 20s-7-4.4-9.5-9C1 8 2 4.5 5.5 3.6 8 3 10.3 4 12 6.3 13.7 4 16 3 18.5 3.6 22 4.5 23 8 21.5 11 19 15.6 12 20 12 20Z" />
    </svg>
  );
}

export function MessageIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z" />
    </svg>
  );
}

export function LinkIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 6.5 12.5 5A3.5 3.5 0 1 1 17.5 10L16 11.5M13 17.5 11.5 19A3.5 3.5 0 1 1 6.5 14L8 12.5" />
    </svg>
  );
}

export function ImageIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4 17l5-5 3.5 3.5L16 12l4 5" />
    </svg>
  );
}

export function FlipCameraIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M17 3 20 6l-3 3" />
      <path d="M20 6H8a5 5 0 0 0-5 5" />
      <path d="M7 21 4 18l3-3" />
      <path d="M4 18h12a5 5 0 0 0 5-5" />
    </svg>
  );
}

export function CameraIcon({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.2-2h6.6l1.2 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}