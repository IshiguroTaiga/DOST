import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import ForcePasswordChange from '../pages/ForcePasswordChange'
import '../styles/components/Layout.css'

export default function Layout({ user, onLogout }) {
  const { pathname } = useLocation()
  const isDashboard = pathname === '/dashboard' || pathname === '/' || pathname === ''

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    return saved === 'true'
  })

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', isCollapsed)
  }, [isCollapsed])

  const toggleSidebar = () => setIsCollapsed(prev => !prev)

  return (
    <div className={`layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar 
        user={user} 
        onLogout={onLogout} 
        isCollapsed={isCollapsed} 
        onToggle={toggleSidebar} 
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
