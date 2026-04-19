import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⬡' },
  { to: '/crimes', label: 'Crime Records', icon: '◈' },
  { to: '/cases', label: 'Case Files', icon: '◉' },
  { to: '/firs', label: 'FIRs', icon: '◎' },
  { to: '/evidence', label: 'Evidence Locker', icon: '◆' },
  { to: '/court-cases', label: 'Court Cases', icon: '⬠' },
  { to: '/officers', label: 'Officers', icon: '◈' },
  { to: '/stations', label: 'Police Stations', icon: '▣' },
  { to: '/persons', label: 'Persons', icon: '◯' },
  { to: '/locations', label: 'Locations', icon: '◌' },
  { to: '/audit-log', label: 'Audit Log', icon: '◷' },
  { to: '/auto-import', label: 'Auto Import', icon: '✨' },
]

export default function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-navy-900 border-r border-navy-700 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-navy-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-500/20 border border-accent-500/40 flex items-center justify-center">
            <span className="text-accent-400 text-sm font-bold font-mono">⬡</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm font-display leading-none">CrimeBase</p>
            <p className="text-slate-500 text-xs mt-0.5">Management System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-accent-500/10 text-accent-400 border border-accent-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800 border border-transparent'
              }`
            }
          >
            <span className="text-base w-5 text-center opacity-70">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-navy-700">
        <p className="text-xs text-slate-600 font-mono">CSD317 · DBMS Project</p>
        <p className="text-xs text-slate-700 mt-0.5">Shiv Nadar IoE</p>
      </div>
    </aside>
  )
}
