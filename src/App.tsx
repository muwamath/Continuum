import { useGameState } from './hooks/useGameState'
import { useGameLoop } from './hooks/useGameLoop'
import { createQueuedAction } from './engine/queue'
import { actionDefinitions } from './data/actionDefinitions'
import './App.css'

function App() {
  const [state, dispatch] = useGameState()
  useGameLoop(state.isPaused, dispatch)

  const handleEnqueue = (actionId: string) => {
    dispatch({
      type: 'ENQUEUE_BACK',
      action: createQueuedAction(actionId),
    })
  }

  return (
    <div className="app">
      <h1>Continuum</h1>
      <p>{state.isPaused ? 'Paused' : 'Running'} | Tick: {state.tickCount}</p>

      <div style={{ margin: '1rem' }}>
        <h3>Actions</h3>
        {actionDefinitions
          .filter((a) => !state.completedOneTimeActions.includes(a.id))
          .map((a) => (
            <button
              key={a.id}
              onClick={() => handleEnqueue(a.id)}
              style={{ margin: '0.25rem', padding: '0.5rem' }}
            >
              {a.name}
            </button>
          ))}
      </div>

      <div style={{ margin: '1rem' }}>
        <h3>Queue ({state.queue.length})</h3>
        {state.queue.map((q, i) => (
          <div key={q.instanceId}>
            {i === 0 ? '▶ ' : '  '}
            {q.actionId} — {(q.progress).toFixed(2)} / {actionDefinitions.find((a) => a.id === q.actionId)?.expCost}
            <button
              onClick={() => dispatch({ type: 'REMOVE_FROM_QUEUE', instanceId: q.instanceId })}
              style={{ marginLeft: '0.5rem' }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div style={{ margin: '1rem' }}>
        <h3>Inventory</h3>
        <p>Berry: {state.inventory.berry.count} / {state.inventory.berry.maxCapacity}</p>
        <p>Wood: {state.inventory.wood.count} / {state.inventory.wood.maxCapacity}</p>
      </div>

      <div style={{ margin: '1rem' }}>
        <h3>Skills</h3>
        {(Object.keys(state.skills) as Array<keyof typeof state.skills>).map((id) => (
          <p key={id}>
            {id}: Core Lv{state.skills[id].coreMastery.level} ({state.skills[id].coreMastery.currentExp.toFixed(1)} exp)
            | Run Lv{state.skills[id].runMastery.level} ({state.skills[id].runMastery.currentExp.toFixed(1)} exp)
          </p>
        ))}
      </div>
    </div>
  )
}

export default App
