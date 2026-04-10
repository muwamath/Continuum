const APP_VERSION = `${__APP_VERSION__}-${__COMMIT_HASH__}`

import { useGameState } from './hooks/useGameState'
import { useGameLoop } from './hooks/useGameLoop'
import { useSaveLoad } from './hooks/useSaveLoad'
import { GameLayout } from './components/layout/GameLayout'
import { SkillBar } from './components/skills/SkillBar'
import { InventoryPanel } from './components/inventory/InventoryPanel'
import { ActionPanel } from './components/actions/ActionPanel'
import { QueuePanel } from './components/queue/QueuePanel'
import { HealthBar } from './components/health/HealthBar'
import { DeathScreen } from './components/death/DeathScreen'
import { DebugOverlay } from './components/debug/DebugOverlay'

function App() {
  const [state, dispatch] = useGameState()
  useGameLoop(state.isPaused, dispatch)
  useSaveLoad(state, dispatch)

  return (
    <>
      <GameLayout
        skills={<SkillBar skills={state.skills} />}
        health={<HealthBar health={state.health} runTickCount={state.runTickCount} healthDecayMultiplier={state.healthDecayMultiplier} />}
        inventory={<InventoryPanel inventory={state.inventory} />}
        actions={<ActionPanel state={state} dispatch={dispatch} />}
        queue={<QueuePanel state={state} dispatch={dispatch} />}
        footer={
          <>
            <DebugOverlay state={state} dispatch={dispatch} />
            <span className="version-label">v{APP_VERSION}</span>
          </>
        }
      />
      {state.isDead && (
        <DeathScreen
          pendingRebirthBonus={state.pendingRebirthBonus}
          rebirth={state.rebirth}
          onContinue={() => dispatch({ type: 'CONTINUE_REBIRTH' })}
        />
      )}
    </>
  )
}

export default App
