import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { projects } from './data/allProjects'
import { capabilities, experience, profile, stackGroups } from './data/site'
import { applyTheme, getStoredTheme, storeTheme } from './utils/theme'

const terminalTabs = ['profile.ts', 'stack.json', 'now.md']
const projectTypes = ['All', ...new Set(projects.map((project) => project.type))]
const projectIndex = new Map(projects.map((project, index) => [project.id, index]))

function validHttpUrl(value) {
  if (typeof value !== 'string') return ''
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''
  } catch {
    return ''
  }
}

const emailValue = typeof profile.email === 'string' ? profile.email.trim() : ''
const githubValue = validHttpUrl(profile.github)
const githubLabel = typeof profile.githubLabel === 'string' ? profile.githubLabel.trim() : ''
const hasEmail = Boolean(emailValue)
const contactValue = hasEmail ? emailValue : githubValue
const hasContact = Boolean(contactValue)
const contactLabel = hasEmail ? emailValue : (githubLabel || githubValue)
const contactHref = hasEmail ? `mailto:${emailValue}` : githubValue
const contactIsExternal = Boolean(githubValue && !hasEmail)
const copyDefaultLabel = hasContact ? (hasEmail ? 'copy email' : 'copy GitHub') : 'contact unavailable'
const resumeHref = hasEmail ? `${contactHref}?subject=Resume%20request` : contactHref
const currentYear = new Date().getFullYear()

function getInitialProjectType() {
  const requestedType = new URLSearchParams(window.location.search).get('type')
  return projectTypes.includes(requestedType) ? requestedType : 'All'
}

function Headline({ text }) {
  const words = text.trim().split(/\s+/)
  const accent = words.pop()

  return <>{words.join(' ')}{words.length ? ' ' : ''}<em>{accent}</em></>
}

function Arrow({ diagonal = false }) {
  return <span aria-hidden="true">{diagonal ? '↗' : '→'}</span>
}

function ProjectPreview({ project }) {
  const [failedImage, setFailedImage] = useState('')
  const stackPreview = (project.stack.length ? project.stack.slice(0, 2) : ['GitHub'])
    .map((item) => `'${item}'`)
    .join(', ')

  if (project.image && failedImage !== project.image) {
    return (
      <img
        className="project-image"
        src={project.image}
        alt={`${project.title} project preview`}
        loading="lazy"
        decoding="async"
        onError={() => setFailedImage(project.image)}
      />
    )
  }

  return (
    <div className="code-preview" data-tone={project.tone} aria-hidden="true">
      <div className="preview-sidebar">
        <span className="sidebar-label">EXPLORER</span>
        <span className="file-row is-open">v portfolio</span>
        <span className="file-row is-active"># {project.id}.tsx</span>
        <span className="file-row"># tokens.css</span>
        <span className="file-row"># routes.ts</span>
      </div>
      <div className="preview-editor">
        <div className="preview-tab">{project.id}.tsx <i /></div>
        <div className="preview-code">
          <span><b>01</b><code><i>import</i> {'{'} build {'}'} <i>from</i> <em>'@/system'</em></code></span>
          <span><b>02</b><code /></span>
          <span><b>03</b><code><i>const</i> project = {'{'}</code></span>
          <span><b>04</b><code>  name: <em>'{project.title}'</em>,</code></span>
          <span><b>05</b><code>  status: <strong>'{project.status.toLowerCase()}'</strong>,</code></span>
          <span><b>06</b><code>  stack: [<em>{stackPreview}</em>],</code></span>
          <span><b>07</b><code>{'}'}</code></span>
          <span><b>08</b><code /></span>
          <span><b>09</b><code><i>export default</i> build(project)</code></span>
        </div>
        <div className="preview-minimap"><span /><span /><span /><span /></div>
      </div>
    </div>
  )
}

function ProjectCard({ project, index }) {
  const hasLinks = Object.values(project.links ?? {}).some(Boolean)

  return (
    <article className="project-card">
      <div className="project-window">
        <div className="window-bar">
          <span className="window-dots"><i /><i /><i /></span>
          <span>/projects/{project.id}</span>
          <span className="window-status"><i /> {project.status}</span>
        </div>
        <div className="project-visual">
          <ProjectPreview project={project} />
          <span className="project-number">{String(index + 1).padStart(2, '0')}</span>
        </div>
      </div>

      <div className="project-copy">
        <div className="project-meta">
          <span>{project.type}</span>
          <span>{project.year}</span>
        </div>
        <h3>{project.title}</h3>
        <p>{project.summary}</p>
        <dl className="project-proof">
          <div><dt>Role</dt><dd>{project.role}</dd></div>
          {project.impact && <div><dt>Impact</dt><dd>{project.impact}</dd></div>}
        </dl>
        <div className="project-footer">
          <ul aria-label={`${project.title} technology stack`}>
            {project.stack.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <div className="project-links">
            {project.links.live && <a href={project.links.live} target="_blank" rel="noreferrer">Live <Arrow diagonal /></a>}
            {project.links.repo && <a href={project.links.repo} target="_blank" rel="noreferrer">Code <Arrow diagonal /></a>}
            {project.links.caseStudy && <a href={project.links.caseStudy}>Case study <Arrow /></a>}
            {!hasLinks && <span>Private build</span>}
          </div>
        </div>
      </div>
    </article>
  )
}

function TerminalPanel() {
  const [activeTab, setActiveTab] = useState('profile.ts')
  const [localTime, setLocalTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const value = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZoneName: 'short',
      }).format(new Date()).replace(/^24:/, '00:')

      setLocalTime(value)
    }

    updateTime()
    const timer = window.setInterval(updateTime, 30000)
    return () => window.clearInterval(timer)
  }, [])

  const handleTabKey = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    let nextIndex = index
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % terminalTabs.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + terminalTabs.length) % terminalTabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = terminalTabs.length - 1
    setActiveTab(terminalTabs[nextIndex])
    document.getElementById(`terminal-tab-${nextIndex}`)?.focus()
  }

  return (
    <div className="terminal-card" data-reveal>
      <div className="terminal-titlebar">
        <span className="window-dots"><i /><i /><i /></span>
        <span>~/portfolio</span>
        <span className="terminal-branch">main*</span>
      </div>
      <div className="terminal-tabs" role="tablist" aria-label="Developer profile files">
        {terminalTabs.map((tab, index) => (
          <button
            id={`terminal-tab-${index}`}
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`terminal-panel-${index}`}
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => setActiveTab(tab)}
            onKeyDown={(event) => handleTabKey(event, index)}
          >
            <span>{tab.endsWith('.ts') ? 'TS' : tab.endsWith('.json') ? '{}' : 'M'}</span>{tab}
          </button>
        ))}
      </div>

      <div className="terminal-body">
        {activeTab === 'profile.ts' && (
          <div id="terminal-panel-0" role="tabpanel" aria-labelledby="terminal-tab-0" className="terminal-code">
            <span><b>01</b><code><i>const</i> developer = {'{'}</code></span>
            <span><b>02</b><code>  name: <em>'{profile.name}'</em>,</code></span>
            <span><b>03</b><code>  role: <em>'{profile.role}'</em>,</code></span>
            <span><b>04</b><code>  location: <em>'{profile.location}'</em>,</code></span>
            <span><b>05</b><code>  focus: [<em>'product UI'</em>, <em>'systems'</em>],</code></span>
            <span><b>06</b><code>  available: <strong>true</strong>,</code></span>
            <span><b>07</b><code>{'}'} <span className="caret" /></code></span>
          </div>
        )}
        {activeTab === 'stack.json' && (
          <div id="terminal-panel-1" role="tabpanel" aria-labelledby="terminal-tab-1" className="terminal-code">
            <span><b>01</b><code>{'{'}</code></span>
            <span><b>02</b><code>  <em>"ui"</em>: [<strong>"React"</strong>, <strong>"TypeScript"</strong>],</code></span>
            <span><b>03</b><code>  <em>"app"</em>: [<strong>"Next.js"</strong>, <strong>"Vite"</strong>],</code></span>
            <span><b>04</b><code>  <em>"data"</em>: [<strong>"GraphQL"</strong>, <strong>"Postgres"</strong>],</code></span>
            <span><b>05</b><code>  <em>"quality"</em>: [<strong>"a11y"</strong>, <strong>"performance"</strong>]</code></span>
            <span><b>06</b><code>{'}'}</code></span>
          </div>
        )}
        {activeTab === 'now.md' && (
          <div id="terminal-panel-2" role="tabpanel" aria-labelledby="terminal-tab-2" className="now-panel">
            <span className="markdown-heading"># now</span>
            <p>Building calm, high-signal interfaces for teams shipping complex products.</p>
            <ul>
              <li><span>[x]</span> Design systems that scale</li>
              <li><span>[x]</span> Accessible interaction patterns</li>
              <li><span>[ ]</span> Your next product</li>
            </ul>
          </div>
        )}
      </div>
      <div className="terminal-output">
        <span><i>$</i> npm run portfolio</span>
        <span className="ready"><i /> ready</span>
      </div>
      <div className="terminal-statusbar">
        <span>branch: main</span>
        <span>UTF-8</span>
        <span>{localTime}</span>
      </div>
    </div>
  )
}

function ProfilePhotoCard() {
  const initials = profile.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  return (
    <div className="profile-photo-card" data-reveal>
      <div className="profile-photo-frame">
        {profile.photo ? (
          <img
            src={profile.photo}
            alt={profile.photoAlt}
            width="320"
            height="320"
            decoding="async"
            style={{ objectPosition: profile.photoPosition }}
          />
        ) : (
          <span aria-label="Profile photo placeholder">{initials}</span>
        )}
        <i className="photo-corner photo-corner-one" aria-hidden="true" />
        <i className="photo-corner photo-corner-two" aria-hidden="true" />
      </div>
      <div className="profile-photo-copy">
        <code>profile.asset</code>
        <strong>{profile.name}</strong>
        <span>{profile.role}</span>
      </div>
      <div className="profile-photo-meta">
        <span><i /> {profile.photo ? 'image loaded' : 'image slot ready'}</span>
        <small>1:1 / auto crop</small>
      </div>
    </div>
  )
}

function App() {
  const commandDialogRef = useRef(null)
  const commandInputRef = useRef(null)
  const commandTriggerRef = useRef(null)
  const projectSearchRef = useRef(null)
  const [commandOpen, setCommandOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [activeCommand, setActiveCommand] = useState(0)
  const [copyStatus, setCopyStatus] = useState(copyDefaultLabel)
  const [theme, setTheme] = useState(getStoredTheme)
  const [activeType, setActiveType] = useState(getInitialProjectType)
  const [projectSearch, setProjectSearch] = useState(() => new URLSearchParams(window.location.search).get('q') || '')

  const typeCounts = useMemo(() => Object.fromEntries(projectTypes.map((type) => [
    type,
    type === 'All' ? projects.length : projects.filter((project) => project.type === type).length,
  ])), [])

  const visibleProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase()
    return projects.filter((project) => {
      const matchesType = activeType === 'All' || project.type === activeType
      const searchable = [project.title, project.summary, project.role, ...project.stack].join(' ').toLowerCase()
      return matchesType && (!query || searchable.includes(query))
    })
  }, [activeType, projectSearch])

  const copyContact = useCallback(async () => {
    if (!hasContact) return
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(contactValue)
      setCopyStatus(hasEmail ? 'email copied' : 'GitHub copied')
    } catch {
      setCopyStatus('copy failed')
    }
    window.setTimeout(() => setCopyStatus(copyDefaultLabel), 2200)
  }, [])

  const navigateTo = useCallback((id) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }, [])

  const cycleTheme = useCallback(() => {
    setTheme((current) => current === 'system' ? 'dark' : current === 'dark' ? 'light' : 'system')
  }, [])

  const openCommandPalette = useCallback(() => {
    if (!commandDialogRef.current?.open) {
      commandDialogRef.current?.showModal()
      setCommandOpen(true)
      window.requestAnimationFrame(() => commandInputRef.current?.focus())
    }
  }, [])

  const closeCommandPalette = useCallback(() => {
    commandDialogRef.current?.close()
  }, [])

  const commands = useMemo(() => {
    const actions = [
      { icon: '01', label: 'Go to selected work', detail: 'Navigation', action: () => navigateTo('work') },
      { icon: '02', label: 'Explore the stack', detail: 'Navigation', action: () => navigateTo('stack') },
      { icon: '03', label: 'View experience', detail: 'Navigation', action: () => navigateTo('experience') },
    ]

    if (hasContact) {
      actions.push({
        icon: hasEmail ? '@' : 'GH',
        label: hasEmail ? 'Copy email address' : 'Copy GitHub profile',
        detail: contactLabel,
        action: copyContact,
      })
    }

    actions.push({ icon: 'TH', label: `Cycle theme (current: ${theme})`, detail: 'Appearance', action: cycleTheme })

    if (hasContact) {
      actions.push({
        icon: '→',
        label: hasEmail ? 'Start a conversation' : 'Open GitHub profile',
        detail: hasEmail ? 'Open email' : contactLabel,
        action: () => {
          if (contactIsExternal) window.open(contactHref, '_blank', 'noopener,noreferrer')
          else window.location.href = contactHref
        },
      })
    }

    return actions
  }, [copyContact, cycleTheme, navigateTo, theme])

  const filteredCommands = useMemo(() => commands.filter((command) => (
    `${command.label} ${command.detail}`.toLowerCase().includes(commandQuery.toLowerCase())
  )), [commandQuery, commands])

  const runCommand = (command) => {
    command.action()
    closeCommandPalette()
  }

  const handleCommandKeys = (event) => {
    if (!filteredCommands.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveCommand((index) => (index + 1) % filteredCommands.length)
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveCommand((index) => (index - 1 + filteredCommands.length) % filteredCommands.length)
    }
    if (event.key === 'Home') {
      event.preventDefault()
      setActiveCommand(0)
    }
    if (event.key === 'End') {
      event.preventDefault()
      setActiveCommand(filteredCommands.length - 1)
    }
    if (event.key === 'Enter' && filteredCommands[activeCommand]) {
      event.preventDefault()
      runCommand(filteredCommands[activeCommand])
    }
  }

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const updateTheme = () => applyTheme(theme, media.matches)
    updateTheme()
    storeTheme(theme)
    media.addEventListener('change', updateTheme)
    return () => media.removeEventListener('change', updateTheme)
  }, [theme])

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (commandDialogRef.current?.open) closeCommandPalette()
        else openCommandPalette()
      }

      const target = event.target
      const isEditing = target instanceof HTMLElement
        && (target.matches('input, textarea, select') || target.isContentEditable)

      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isEditing) {
        event.preventDefault()
        projectSearchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [closeCommandPalette, openCommandPalette])

  useEffect(() => {
    document.body.style.overflow = commandOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [commandOpen])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (activeType === 'All') params.delete('type')
    else params.set('type', activeType)
    if (projectSearch.trim()) params.set('q', projectSearch.trim())
    else params.delete('q')
    const query = params.toString()
    const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', next)
  }, [activeType, projectSearch])

  useEffect(() => {
    const nodes = document.querySelectorAll('[data-reveal]')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'))
      return undefined
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>

      <header className="site-header">
        <a className="brand" href="#top" aria-label={`${profile.name}, home`}>
          <span className="brand-prompt">$</span>
          <span>{profile.handle}</span>
          <i aria-hidden="true" />
        </a>
        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#work"><span>01.</span>work</a>
          <a href="#stack"><span>02.</span>stack</a>
          <a href="#experience"><span>03.</span>experience</a>
          <a href="#contact"><span>04.</span>contact</a>
        </nav>
        <div className="header-actions">
          <button className="theme-button" type="button" onClick={cycleTheme} aria-label={`Cycle theme. Current setting: ${theme}`}>
            <span aria-hidden="true">{theme === 'dark' ? 'D' : theme === 'light' ? 'L' : 'A'}</span>
            <small>{theme}</small>
          </button>
          <button ref={commandTriggerRef} className="command-trigger" type="button" onClick={openCommandPalette}>
            <span>command</span><kbd>Ctrl K</kbd>
          </button>
        </div>
      </header>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <a href="#work"><span>01</span>Work</a>
        <a href="#stack"><span>02</span>Stack</a>
        <a href="#experience"><span>03</span>Log</a>
        <a href="#contact"><span>04</span>Contact</a>
      </nav>

      <main id="main-content">
        <section id="top" className="hero page-width">
          <div className="hero-copy" data-reveal>
            <p className="terminal-label"><span>$</span> whoami</p>
            <p className="hero-identity">{profile.name}<span>/</span>{profile.role}</p>
            <h1><Headline text={profile.headline} /></h1>
            <p className="hero-summary">{profile.summary}</p>
            <div className="hero-actions">
              <a className="primary-action" href="#work">View projects <Arrow /></a>
              {hasContact && (hasEmail ? (
                <button className="secondary-action" type="button" onClick={copyContact}><span>/</span> {copyStatus}</button>
              ) : (
                <a className="secondary-action" href={contactHref} target="_blank" rel="noreferrer">
                  GitHub profile <Arrow diagonal />
                </a>
              ))}
            </div>
            <div className="hero-presence">
              <span><i /> {profile.availability}</span>
              <span>{profile.location}</span>
            </div>
          </div>
          <div className="hero-workspace">
            <ProfilePhotoCard />
            <TerminalPanel />
          </div>
        </section>

        <div className="signal-rail page-width" aria-label="Areas of focus" data-reveal>
          <span>Currently building</span>
          <strong>Product interfaces</strong>
          <strong>Design systems</strong>
          <strong>Frontend architecture</strong>
          <strong>Accessible interactions</strong>
        </div>

        <section id="work" className="work-section page-width">
          <div className="section-heading" data-reveal>
            <p className="terminal-label"><span>//</span> selected_work</p>
            <h2>Builds with real product <em>weight.</em></h2>
            <p>Selected interfaces and systems built from problem framing through production-ready frontend delivery.</p>
          </div>

          <div className="project-explorer" data-reveal>
            <div className="project-search">
              <label htmlFor="project-search"><span>$</span> find ./projects</label>
              <input
                ref={projectSearchRef}
                id="project-search"
                type="search"
                value={projectSearch}
                onChange={(event) => setProjectSearch(event.target.value)}
                placeholder="Search by project or stack..."
                maxLength="120"
              />
              <kbd>/</kbd>
            </div>
            <div className="project-filters" aria-label="Filter projects by type">
              {projectTypes.map((type) => (
                <button
                  type="button"
                  key={type}
                  className={activeType === type ? 'is-active' : ''}
                  aria-pressed={activeType === type}
                  aria-controls="project-grid"
                  onClick={() => setActiveType(type)}
                >
                  {type.toLowerCase()} <span>[{typeCounts[type]}]</span>
                </button>
              ))}
            </div>
            <p className="result-count" aria-live="polite">{visibleProjects.length} project{visibleProjects.length === 1 ? '' : 's'} found</p>
          </div>

          {visibleProjects.length > 0 ? (
            <div id="project-grid" className="project-grid">
              {visibleProjects.map((project) => (
                <ProjectCard key={project.id} project={project} index={projectIndex.get(project.id) ?? 0} />
              ))}
            </div>
          ) : (
            <div className="empty-state" id="project-grid">
              <span>404</span>
              <h3>No matching builds.</h3>
              <p>Try another project name, technology, or type.</p>
              <button type="button" onClick={() => { setProjectSearch(''); setActiveType('All') }}>Clear filters</button>
            </div>
          )}
        </section>

        <section id="stack" className="stack-section page-width">
          <div className="section-heading compact" data-reveal>
            <p className="terminal-label"><span>//</span> capabilities</p>
            <h2>From system design to the final <em>pixel.</em></h2>
          </div>
          <div className="capability-grid">
            {capabilities.map((capability) => (
              <article key={capability.index} className="capability-card" data-reveal>
                <div><span>{capability.index}</span><code>{capability.tag}()</code></div>
                <h3>{capability.title}</h3>
                <p>{capability.description}</p>
              </article>
            ))}
          </div>
          <div className="stack-grid">
            {stackGroups.map((group) => (
              <article key={group.key} className="stack-card" data-reveal>
                <div className="stack-card-head"><span>module</span><code>{group.key}.config.js</code></div>
                <h3>{group.label}</h3>
                <p>{group.description}</p>
                <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
            ))}
          </div>
        </section>

        <section id="experience" className="experience-section page-width">
          <div className="experience-intro" data-reveal>
            <p className="terminal-label"><span>$</span> git log --career</p>
            <h2>Engineering with product judgment.</h2>
            <p>I care about the quiet details: clean state, readable systems, and interactions that make a product feel obvious.</p>
            {hasContact && (
              <a
                href={resumeHref}
                target={contactIsExternal ? '_blank' : undefined}
                rel={contactIsExternal ? 'noreferrer' : undefined}
              >
                {hasEmail ? 'Request full resume' : 'View GitHub profile'} <Arrow />
              </a>
            )}
          </div>
          <div className="git-log" data-reveal>
            {experience.map((item, index) => (
              <article key={item.period}>
                <span className="commit-node" aria-hidden="true" />
                <div className="commit-meta"><code>commit 0{experience.length - index}fd{index}a</code><span>{item.period}</span></div>
                <h3>{item.role}</h3>
                <p className="company">{item.company}</p>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer id="contact" className="site-footer">
        <div className="footer-panel page-width" data-reveal>
          <div className="footer-command"><span>&gt;</span> available_for = <em>"{profile.availability.toLowerCase()}"</em><i /></div>
          <h2>Let&apos;s build something <em>useful.</em></h2>
          <p>Have a product, platform, or interface that deserves a stronger frontend?</p>
          <div className="footer-actions">
            {hasContact ? (
              <>
                <a
                  href={contactHref}
                  target={contactIsExternal ? '_blank' : undefined}
                  rel={contactIsExternal ? 'noreferrer' : undefined}
                >
                  <span>{contactLabel}</span> <Arrow diagonal />
                </a>
                <button type="button" onClick={copyContact}>{copyStatus}</button>
              </>
            ) : (
              <p>Contact details coming soon.</p>
            )}
          </div>
        </div>
        <div className="footer-meta page-width">
          <span>© {currentYear} {profile.name}</span>
          <span>Built with React + intent</span>
          <a href="#top">Back to top [up]</a>
        </div>
      </footer>

      <dialog
        ref={commandDialogRef}
        className="command-dialog"
        aria-labelledby="command-title"
        onClose={() => {
          setCommandOpen(false)
          setCommandQuery('')
          setActiveCommand(0)
          commandTriggerRef.current?.focus()
        }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeCommandPalette()
        }}
      >
        <div className="command-shell">
          <div className="command-search-row">
            <span aria-hidden="true">&gt;_</span>
            <input
              ref={commandInputRef}
              value={commandQuery}
              onChange={(event) => {
                setCommandQuery(event.target.value)
                setActiveCommand(0)
              }}
              onKeyDown={handleCommandKeys}
              aria-label="Search commands"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={commandOpen}
              aria-controls="command-list"
              aria-describedby="command-help"
              aria-activedescendant={filteredCommands[activeCommand] ? `command-option-${activeCommand}` : undefined}
              placeholder="Type a command..."
              autoComplete="off"
            />
            <kbd>ESC</kbd>
          </div>
          <div className="command-head">
            <h2 id="command-title">Command palette</h2>
            <span>{filteredCommands.length} actions</span>
          </div>
          <div id="command-list" className="command-list" role="listbox" aria-label="Available commands">
            {filteredCommands.map((command, index) => (
              <div
                id={`command-option-${index}`}
                key={command.label}
                role="option"
                aria-selected={index === activeCommand}
                className={`command-option${index === activeCommand ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveCommand(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runCommand(command)}
              >
                <span className="command-icon">{command.icon}</span>
                <span><strong>{command.label}</strong><small>{command.detail}</small></span>
                <kbd>ENTER</kbd>
              </div>
            ))}
            {!filteredCommands.length && <p className="no-commands">No command found. Try "work" or "theme".</p>}
          </div>
          <div id="command-help" className="command-help"><span>[up/down] navigate</span><span>[enter] select</span><span>[esc] close</span></div>
        </div>
      </dialog>

      <div className="sr-status" aria-live="polite">
        {copyStatus.includes('copied')
          ? `${hasEmail ? 'Email address' : 'GitHub profile'} copied to clipboard`
          : copyStatus === 'copy failed' ? 'Copy failed. Open the contact link to copy it manually.' : ''}
      </div>
    </div>
  )
}

export default App
