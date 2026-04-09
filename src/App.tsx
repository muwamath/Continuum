import { useGameState } from './hooks/useGameState'
import { useGameLoop } from './hooks/useGameLoop'
import { GameLayout } from './components/layout/GameLayout'
import { SkillBar } from './components/skills/SkillBar'
import { InventoryPanel } from './components/inventory/InventoryPanel'
import { ActionPanel } from './components/actions/ActionPanel'
import { QueuePanel } from './components/queue/QueuePanel'
import { DebugOverlay } from './components/debug/DebugOverlay'

function App() {
  const [state, dispatch] = useGameState()
  useGameLoop(state.isPaused, dispatch)

  return (
    <>
      <GameLayout
        skills={<SkillBar skills={state.skills} />}
        inventory={<InventoryPanel inventory={state.inventory} />}
        actions={<ActionPanel state={state} dispatch={dispatch} />}
        queue={<QueuePanel state={state} dispatch={dispatch} />}
      />
      <DebugOverlay state={state} dispatch={dispatch} />
    </>
  )
}

export default App
