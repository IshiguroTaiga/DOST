import { useState, useMemo, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { MagnifyingGlass, BookOpen, CalendarCheck, FilePlus, CheckCircle, Users, WarningCircle, CaretRight, ClockCounterClockwise, FileText } from '@phosphor-icons/react'
import { MANUAL_CATEGORIES, MANUAL_SECTIONS } from '../data/manualContent'
import '../styles/pages/Manual.css'

const ICON_MAP = {
  BookOpen: BookOpen,
  CalendarCheck: CalendarCheck,
  FilePlus: FilePlus,
  CheckCircle: CheckCircle,
  Users: Users,
  History: ClockCounterClockwise,
  ClipboardText: FileText
};

export default function Manual() {
  const { user } = useOutletContext() ?? {}
  const [activeCategory, setActiveCategory] = useState(MANUAL_CATEGORIES[0].id)
  const [searchTerm, setSearchTerm] = useState('')

  const accountType = user?.account_type || user?.role || 'Viewer'

  // Filter sections by role and search term
  const filteredSections = useMemo(() => {
    return MANUAL_SECTIONS.filter(section => {
      // Role filtering
      const hasAccess = section.roles.includes('All') || 
                        section.roles.some(role => accountType.toLowerCase().includes(role.toLowerCase()))
      
      if (!hasAccess) return false

      // Category filtering (only if no search term)
      if (!searchTerm && section.category !== activeCategory) return false

      // Search filtering
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const titleMatch = section.title.toLowerCase().includes(searchLower)
        const descMatch = section.description.toLowerCase().includes(searchLower)
        const stepMatch = section.steps.some(step => 
          step.title.toLowerCase().includes(searchLower) || 
          step.text.toLowerCase().includes(searchLower)
        )
        return titleMatch || descMatch || stepMatch
      }
      
      return true
    })
  }, [accountType, activeCategory, searchTerm])

  const activeCategoryTitle = MANUAL_CATEGORIES.find(c => c.id === activeCategory)?.title

  return (
    <div className="manual-page">
      {/* Sidebar: Categories */}
      <aside className="manual-sidebar">
        <div className="manual-sidebar-header">
          <h2>Manual</h2>
        </div>
        <nav className="manual-category-list">
          {MANUAL_CATEGORIES.map(cat => {
            const Icon = ICON_MAP[cat.icon] || BookOpen
            return (
              <button
                key={cat.id}
                className={`manual-category-btn ${activeCategory === cat.id && !searchTerm ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(cat.id)
                  setSearchTerm('')
                }}
              >
                <Icon size={20} weight={activeCategory === cat.id && !searchTerm ? 'fill' : 'bold'} />
                <span>{cat.title}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="manual-main-content">
        <div className="manual-top-bar">
          <div className="manual-search-box">
            <MagnifyingGlass size={18} className="manual-search-icon" />
            <input 
              type="text" 
              placeholder="Search help topics, keywords, or guides..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="manual-user-badge">
            <span className="badge badge-admin">{accountType} Mode</span>
          </div>
        </div>

        <div className="manual-scroll-area">
          {filteredSections.length > 0 ? (
            filteredSections.map(section => (
              <article key={section.id} className="manual-article" id={section.id}>
                <header className="manual-article-header">
                  <span className="manual-article-category">
                    {MANUAL_CATEGORIES.find(c => c.id === section.category)?.title}
                  </span>
                  <h1 className="manual-article-title">{section.title}</h1>
                  <p className="manual-article-desc">{section.description}</p>
                </header>

                <div className="manual-step-grid">
                  {section.steps.map((step, idx) => (
                    <div key={idx} className="manual-step-item">
                      <div className="manual-step-content">
                        <span className="manual-step-number">STEP {idx + 1}</span>
                        <h3 className="manual-step-title">{step.title}</h3>
                        <p className="manual-step-text">{step.text}</p>
                      </div>
                      <div className="manual-visual-box">
                        {step.type === 'video' ? (
                          <video 
                            src={step.visual} 
                            className="manual-visual-media" 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                          />
                        ) : (
                          <img 
                            src={step.visual} 
                            alt={step.title} 
                            className="manual-visual-media" 
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <div className="manual-no-results">
              <WarningCircle size={48} weight="duotone" />
              <h3>No results found</h3>
              <p>We couldn&apos;t find any manual sections matching your search or role.</p>
              <button 
                className="btn-sm" 
                style={{ marginTop: '1rem' }}
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
