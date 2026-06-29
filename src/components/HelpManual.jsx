import { useState, useMemo } from 'react'
import { MagnifyingGlass, Info, WarningCircle } from '@phosphor-icons/react'
import { MANUAL_SECTIONS } from '../data/manualContent'
import '../styles/components/HelpManual.css'
const ensureAbsoluteUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const getLinkDomainLabel = (url) => {
  if (!url) return 'Link';
  const cleanUrl = url.toLowerCase();
  if (cleanUrl.includes('facebook.com')) return 'Facebook';
  if (cleanUrl.includes('instagram.com')) return 'Instagram';
  if (cleanUrl.includes('tiktok.com')) return 'TikTok';
  if (cleanUrl.includes('github.com')) return 'GitHub';
  if (cleanUrl.includes('linkedin.com')) return 'LinkedIn';
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) return 'YouTube';
  try {
    const domain = new URL(ensureAbsoluteUrl(url)).hostname;
    return domain.replace('www.', '');
  } catch (e) {
    return 'Website';
  }
};

export default function HelpManual({ user }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDevId, setSelectedDevId] = useState('bullanday-luis')

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
                <div key={idx} className={`help-step-card ${(!step.visual && !step.developersShowcase) ? 'no-visual' : ''}`}>
                  <div className="help-step-info">
                    <h4 className="help-step-title">{step.title}</h4>
                    {step.clickableNames ? (
                      <div className="help-step-text clickable-names-list">
                        {step.text.split('\n').map((name, nameIdx) => {
                          const devMapping = {
                            'Bullanday, Luis': 'bullanday-luis',
                            'Ladera, Ivan': 'ladera-ivan',
                            'Pagurayan, Angel Lyka': 'pagurayan-angel-lyka',
                            'Permison, Micko Gabriel': 'permison-micko-gabriel'
                          }
                          const devId = devMapping[name.trim()]
                          if (devId) {
                            return (
                              <div key={nameIdx} className="clickable-name-row">
                                <button 
                                  className="developer-link-btn"
                                  onClick={() => {
                                    setSelectedDevId(devId);
                                    const element = document.getElementById(devId);
                                    if (element) {
                                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                      element.classList.add('highlight-flash');
                                      setTimeout(() => element.classList.remove('highlight-flash'), 2000);
                                    }
                                  }}
                                >
                                  {name}
                                </button>
                              </div>
                            )
                          }
                          return (
                            <div key={nameIdx} className="non-clickable-name-row">
                              {name}
                            </div>
                          )
                        })}
                      </div>
                    ) : step.developersShowcase ? (
                      <div className="manual-step-text clickable-names-list">
                        {step.developers.map((d) => (
                          <div key={d.id} className="clickable-name-row">
                            <button
                              className={`developer-link-btn ${selectedDevId === d.id ? 'active' : ''}`}
                              onClick={() => setSelectedDevId(d.id)}
                            >
                              {d.name}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p 
                        className="help-step-text" 
                        dangerouslySetInnerHTML={{ 
                          __html: step.text.replace(/\n/g, '<br />')
                        }} 
                      />
                    )}
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1', fontSize: '0.75rem', fontWeight: 600 }}>
                      <Info size={14} /> Step {idx + 1}
                    </div>
                  </div>
                  {((step.visual) || (step.developersShowcase)) && (
                    <div className="help-visual-container">
                      {step.developersShowcase && step.developers ? (
                        (() => {
                          const dev = step.developers.find(d => d.id === selectedDevId) || step.developers[0]
                          return (
                            <div className="developer-info-card" style={{ margin: 0, border: 'none', boxShadow: 'none', height: '100%', overflowY: 'auto' }}>
                              <h4 className="developer-card-name">{dev.name}</h4>
                              <div className="developer-details">
                                <div className="dev-field-about">
                                  <strong>About me:</strong>
                                  <p>{dev.about || <em>No info provided yet.</em>}</p>
                                </div>
                                <div className="dev-field-row">
                                  <div className="dev-field">
                                    <strong>Name:</strong> <span>{dev.name}</span>
                                  </div>
                                  <div className="dev-field">
                                    <strong>Email:</strong>{' '}
                                    <span>
                                      {dev.email ? <a href={`mailto:${dev.email}`}>{dev.email}</a> : <em>None</em>}
                                    </span>
                                  </div>
                                </div>
                                <div className="dev-field-row">
                                  <div className="dev-field">
                                    <strong>Github:</strong>{' '}
                                    <span>
                                      {dev.github ? <a href={ensureAbsoluteUrl(dev.github)} target="_blank" rel="noreferrer">{dev.github}</a> : <em>None</em>}
                                    </span>
                                  </div>
                                  <div className="dev-field">
                                    <strong>Number:</strong> <span>{dev.number || <em>None</em>}</span>
                                  </div>
                                </div>
                                <div className="dev-field-links">
                                  <strong>Links:</strong>
                                  {dev.links && dev.links.length > 0 ? (
                                    <div className="dev-links-list">
                                      {dev.links.map((link, lIdx) => (
                                        <a key={lIdx} href={ensureAbsoluteUrl(link)} target="_blank" rel="noreferrer" className="dev-link-item">
                                          {getLinkDomainLabel(link)}
                                        </a>
                                      ))}
                                    </div>
                                  ) : (
                                    <span><em>None</em></span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })()
                      ) : step.type === 'video' ? (
                        <video 
                          className="help-visual-video" 
                          src={step.visual} 
                          autoPlay 
                          loop 
                          muted 
                          playsInline
                        />
                      ) : (step.type === 'iframe' && step.visual && !/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(step.visual)) ? (
                        <iframe
                          className="help-visual-iframe"
                          src={step.visual.includes('drive.google.com') ? step.visual.replace(/\/(view|edit).*/, '/preview') : step.visual}
                          style={{ width: '100%', height: '100%', border: 'none' }}
                          allow="autoplay"
                        />
                      ) : (
                        <img 
                          className="help-visual-img" 
                          src={step.visual} 
                          alt={step.title} 
                        />
                      )}
                    </div>
                  )}
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
