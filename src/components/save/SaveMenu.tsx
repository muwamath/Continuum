import { useRef } from 'react'
import type { ChangeEvent, Dispatch } from 'react'
import type { GameState } from '../../engine/types'
import type { GameAction } from '../../hooks/useGameState'
import { serializeSave, importSaveJson } from '../../hooks/useSaveLoad'
import './SaveMenu.css'

interface SaveMenuProps {
  state: GameState
  dispatch: Dispatch<GameAction>
}

function formatDateForFilename(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

export function SaveMenu({ state, dispatch }: SaveMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const json = serializeSave(state)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `continuum-save-${formatDateForFilename(new Date())}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Reset the input so the same file can be re-selected later if needed
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result
      if (typeof text !== 'string') {
        window.alert('Failed to read save file.')
        return
      }
      const imported = importSaveJson(text)
      if (!imported) {
        window.alert('Invalid save file. Could not parse or migrate to the current version.')
        return
      }
      if (!window.confirm('Importing will replace your current game state. Continue?')) {
        return
      }
      dispatch({ type: 'SET_DEBUG_STATE', state: imported })
    }
    reader.onerror = () => window.alert('Failed to read save file.')
    reader.readAsText(file)
  }

  return (
    <div className="save-menu">
      <button className="save-menu__btn" onClick={handleExport} title="Download save as JSON">
        Export Save
      </button>
      <button className="save-menu__btn" onClick={handleImportClick} title="Load save from JSON file">
        Import Save
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  )
}
