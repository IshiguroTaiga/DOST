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

export default function Manual() {
  const { user } = useOutletContext() ?? {}
  const [activeCategory, setActiveCategory] = useState(MANUAL_CATEGORIES[0].id)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDevId, setSelectedDevId] = useState('bullanday-luis')

  const parseStepText = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const formattedLine = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      return (
        <span key={lineIdx}>
          {formattedLine}
          {lineIdx < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  const accountType = (user?.account_type || user?.role || 'Viewer') === 'Guest' ? 'Viewer' : (user?.account_type || user?.role || 'Viewer')

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
                    <div key={idx} className={`manual-step-item ${(!step.visual && !step.developersShowcase) ? 'no-visual' : ''}`}>
                      <div className="manual-step-content">
                        {['events', 'reporting', 'review'].includes(section.category) && (
                          <span className="manual-step-number">STEP {idx + 1}</span>
                        )}
                        <h3 className="manual-step-title">{step.title}</h3>
                        {step.clickableNames ? (
                          <div className="manual-step-text clickable-names-list">
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
                          <p className="manual-step-text">{parseStepText(step.text)}</p>
                        )}
                      </div>
                      {((step.visual) || (step.developersShowcase)) && (
                        <div className="manual-visual-box">
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
                              src={step.visual} 
                              className="manual-visual-media" 
                              autoPlay 
                              loop 
                              muted 
                              playsInline 
                            />
                          ) : (step.type === 'iframe' && step.visual && !/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(step.visual)) ? (
                            <iframe
                              className="manual-visual-media"
                              src={step.visual.includes('drive.google.com') ? step.visual.replace(/\/(view|edit).*/, '/preview') : step.visual}
                              style={{ width: '100%', height: '100%', border: 'none' }}
                              allow="autoplay"
                            />
                          ) : (
                            <img 
                              src={step.visual} 
                              alt={step.title} 
                              className="manual-visual-media" 
                            />
                          )}
                        </div>
                      )}
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
