import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { List } from '@phosphor-icons/react'
import Sidebar from './Sidebar'
import ForcePasswordChange from '../pages/ForcePasswordChange'
import '../styles/components/Layout.css'

export default function Layout({ user, onLogout, onUserUpdate }) {
  const { pathname } = useLocation()
  const isDashboard = pathname === '/dashboard' || pathname === '/' || pathname === ''

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    return saved === 'true'
  })

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', isCollapsed)
  }, [isCollapsed])

  useEffect(() => {
    const savedTheme = user?.theme || localStorage.getItem('theme') || 'classic'
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [user?.theme])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])


  const toggleSidebar = () => setIsCollapsed(prev => !prev)
  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev)

  return (
    <div className={`layout ${isCollapsed ? 'sidebar-collapsed' : ''} ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="mobile-hamburger-btn" onClick={toggleMobileMenu}>
          <List size={24} weight="bold" />
        </button>
        <div className="mobile-branding">
          <img src="/proactLogo.png" alt="PROACT Logo" className="mobile-logo-image" />
        </div>
      </header>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />}

      <Sidebar 
        user={user} 
        onLogout={onLogout} 
        onUserUpdate={onUserUpdate}
        isCollapsed={isCollapsed} 
        onToggle={toggleSidebar} 
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <main className={`main-content ${isDashboard ? 'main-content--scrollable' : ''}`}>
        <Outlet context={{ user }} />
        {user?.must_change_password && (
          <ForcePasswordChange user={user} onLogout={onLogout} />
        )}
      </main>
    </div>
  )
}