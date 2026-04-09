import type { ReactNode } from 'react'
import './GameLayout.css'

interface GameLayoutProps {
  skills: ReactNode
  health: ReactNode
  inventory: ReactNode
  actions: ReactNode
  queue: ReactNode
}

export function GameLayout({ skills, health, inventory, actions, queue }: GameLayoutProps) {
  return (
    <div className="game-layout">
      <section className="game-layout__health">{health}</section>
      <header className="game-layout__skills">{skills}</header>
      <main className="game-layout__inventory">{inventory}</main>
      <footer className="game-layout__actions">{actions}</footer>
      <aside className="game-layout__queue">{queue}</aside>
    </div>
  )
}
