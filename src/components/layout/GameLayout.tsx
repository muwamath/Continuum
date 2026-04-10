import type { ReactNode } from 'react'
import './GameLayout.css'

interface GameLayoutProps {
  skills: ReactNode
  health: ReactNode
  inventory: ReactNode
  actions: ReactNode
  queue: ReactNode
  footer: ReactNode
}

export function GameLayout({ skills, health, inventory, actions, queue, footer }: GameLayoutProps) {
  return (
    <div className="game-layout">
      <section className="game-layout__health">{health}</section>
      <header className="game-layout__skills">{skills}</header>
      <section className="game-layout__actions">{actions}</section>
      <main className="game-layout__inventory">{inventory}</main>
      <aside className="game-layout__queue">{queue}</aside>
      <footer className="game-layout__footer">{footer}</footer>
    </div>
  )
}
