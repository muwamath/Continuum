interface ProgressBarProps {
  value: number // 0 to 1
  color: string
  height?: number
  className?: string
}

export function ProgressBar({ value, color, height = 4, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value))
  return (
    <div
      className={className}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        width: '100%',
        height,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: height / 2,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: height / 2,
          transition: 'width 100ms linear',
        }}
      />
    </div>
  )
}
