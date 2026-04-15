import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import ForcePasswordChange from '../pages/ForcePasswordChange'
import '../styles/components/Layout.css'

export default function Layout({ user, onLogout }) {
  const { pathname } = useLocation()
  const isDashboard = pathname === '/dashboard' || pathname === '/' || pathname === ''

  return (
    <div className="layout">
      <Sidebar user={user} onLogout={onLogout} />
      <main className={`main-content ${isDashboard ? 'main-content--scrollable' : ''}`}>
        <Outlet context={{ user }} />
        {user?.must_change_password && (
          <ForcePasswordChange user={user} onLogout={onLogout} />
        )}
      </main>
    </div>
  )
}
