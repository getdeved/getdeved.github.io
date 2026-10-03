import type { ReactNode } from 'react'

export function Nav({ children, wide }: { children?: ReactNode; wide?: boolean }) {
  return (
    <nav className={wide ? 'nav wide' : 'nav'}>
      <a className="brand" href="#/"><span className="mark">Dev</span>Ed</a>
      <div className="nav-right">{children}</div>
    </nav>
  )
}
