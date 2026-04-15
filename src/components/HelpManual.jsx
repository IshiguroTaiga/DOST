import { useState, useMemo } from 'react'
import { MagnifyingGlass, Info, WarningCircle } from '@phosphor-icons/react'
import { MANUAL_SECTIONS } from '../data/manualContent'
import '../styles/components/HelpManual.css'

export default function HelpManual({ user }) {
  const [searchTerm, setSearchTerm] = useState('')

  const accountType = user?.account_type || user?.role || 'Viewer'

  const filteredSections = useMemo(() => {
    return MANUAL_SECTIONS.filter(section => {
      // Role filtering
      const hasAccess = section.roles.some(role => 
        accountType.toLowerCase().includes(role.toLowerCase()) || 
        role === 'All'
      )
      
      if (!hasAccess) return false

      // Search filtering
      if (!searchTerm) return true
      
      const searchLower = searchTerm.toLowerCase()
      const titleMatch = section.title.toLowerCase().includes(searchLower)
      const descMatch = section.description.toLowerCase().includes(searchLower)
      const stepMatch = section.steps.some(step => 
        step.title.toLowerCase().includes(searchLower) || 
        step.text.toLowerCase().includes(searchLower)
      )
      
      return titleMatch || descMatch || stepMatch
    })
  }, [accountType, searchTerm])

  return (
    <div className="help-manual-container">
      <div className="help-search-wrapper">
        <MagnifyingGlass size={18} className="help-search-icon" />
        <input 
          type="text" 
          placeholder="Search for help topics..." 
          className="help-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="help-content-grid">
        {filteredSections.length > 0 ? (
          filteredSections.map(section => (
            <div key={section.id} className="help-section">
              <div className="help-section-header">
                <h3 className="help-section-title">{section.title}</h3>
                <p className="help-section-desc">{section.description}</p>
              </div>

              {section.steps.map((step, idx) => (
                <div key={idx} className="help-step-card">
                  <div className="help-step-info">
                    <h4 className="help-step-title">{step.title}</h4>
                    <p className="help-step-text">{step.text}</p>
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1', fontSize: '0.75rem', fontWeight: 600 }}>
                      <Info size={14} /> Step {idx + 1}
                    </div>
                  </div>
                  <div className="help-visual-container">
                    {step.type === 'video' ? (
                      <video 
                        className="help-visual-video" 
                        src={step.visual} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                      />
                    ) : (
                      <img 
                        className="help-visual-img" 
                        src={step.visual} 
                        alt={step.title} 
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="help-empty-state">
            <WarningCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <p>No help topics found matching &quot;{searchTerm}&quot;</p>
          </div>
        )}
      </div>
    </div>
  )
}
