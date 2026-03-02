import type { ReactNode } from 'react'

type IconProps = {
  className?: string
}

function IconBase({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function MenuIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </IconBase>
  )
}

export function PinIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M9 3h6" />
      <path d="M8 8l1-5h6l1 5" />
      <path d="M6 11h12" />
      <path d="M12 11v10" />
    </IconBase>
  )
}

export function BookIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5z" />
      <path d="M8 7h7" />
      <path d="M8 11h7" />
    </IconBase>
  )
}

export function LayersIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </IconBase>
  )
}

export function SparkIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
      <path d="M5 18l1 2" />
      <path d="M18 17l1 2" />
    </IconBase>
  )
}

export function ClockIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </IconBase>
  )
}

export function StepIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 6h6v12H4z" />
      <path d="M20 6l-7 6 7 6V6z" />
    </IconBase>
  )
}

export function RefreshIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M21 12a9 9 0 0 1-15.5 6.4" />
      <path d="M3 12A9 9 0 0 1 18.5 5.6" />
      <path d="M18 3v4h4" />
      <path d="M6 21v-4H2" />
    </IconBase>
  )
}

export function ResetIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 4v6h6" />
      <path d="M20 12A8 8 0 1 1 10 4" />
    </IconBase>
  )
}

export function PlayIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M8 5l11 7-11 7V5z" />
    </IconBase>
  )
}

export function PauseIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M7 5h4v14H7z" />
      <path d="M13 5h4v14h-4z" />
    </IconBase>
  )
}

export function StepBackIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M6 5h3v14H6z" />
      <path d="M19 6l-8 6 8 6V6z" />
    </IconBase>
  )
}

export function StepForwardIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M15 5h3v14h-3z" />
      <path d="M5 6l8 6-8 6V6z" />
    </IconBase>
  )
}

export function SpeedIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 15a8 8 0 1 1 16 0" />
      <path d="M12 12l5-4" />
      <circle cx="12" cy="12" r="1" />
    </IconBase>
  )
}

export function FlowIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M8 6h8" />
      <path d="M7.4 7.8l3.2 7" />
      <path d="M16.6 7.8l-3.2 7" />
    </IconBase>
  )
}
