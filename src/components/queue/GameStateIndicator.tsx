import { Icon } from '../ui/Icon'
import './GameStateIndicator.css'

interface GameStateIndicatorProps {
  isPaused: boolean
  pausedByUser: boolean
  onTogglePause: () => void
}

export function GameStateIndicator({ isPaused, pausedByUser, onTogglePause }: GameStateIndicatorProps) {
  const label = isPaused
    ? (pausedByUser ? 'Paused by User' : 'Paused')
    : 'Running'

  return (
    <button
      className={`game-state ${isPaused ? 'game-state--paused' : 'game-state--running'}`}
      onClick={onTogglePause}
      title="Toggle pause (Space)"
    >
      <Icon
        name={isPaused ? 'pause-button' : 'play-button'}
        size={20}
        alt={label}
      />
      <span>{label}</span>
    </button>
  )
}
