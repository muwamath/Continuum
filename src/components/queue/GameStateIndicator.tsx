import { Icon } from '../ui/Icon'
import './GameStateIndicator.css'

interface GameStateIndicatorProps {
  isPaused: boolean
}

export function GameStateIndicator({ isPaused }: GameStateIndicatorProps) {
  return (
    <div className={`game-state ${isPaused ? 'game-state--paused' : 'game-state--running'}`}>
      <Icon
        name={isPaused ? 'pause-button' : 'play-button'}
        size={20}
        alt={isPaused ? 'Paused' : 'Running'}
      />
      <span>{isPaused ? 'Paused' : 'Running'}</span>
    </div>
  )
}
