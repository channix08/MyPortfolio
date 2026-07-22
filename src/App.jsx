import { useEffect, useMemo, useState } from 'react'
import './App.css'
import heroArtwork from './assets/hero.png'
import { projects } from './data/projects'

const services = [
  {
    number: '01',
    title: 'Product websites',
    description: 'Clear, high-converting websites that make complex products feel simple and worth exploring.',
  },
  {
    number: '02',
    title: 'Frontend systems',
    description: 'Responsive React interfaces and reusable components that stay tidy as your product grows.',
  },
  {
    number: '03',
    title: 'Design direction',
    description: 'A strong visual point of view, from typography and layout to motion and interaction details.',
  },
]

const experience = [
  { period: '2024 — Now', role: 'Senior Frontend Engineer', company: 'Beacon Studio' },
  { period: '2022 — 2024', role: 'Frontend Product Engineer', company: 'LedgerFlow' },
  { period: '2020 — 2022', role: 'Independent Designer & Developer', company: 'Freelance' },
]

const stats = [
  ['06+', 'Years crafting for the web'],
  ['26', 'Digital products shipped'],
  ['09', 'Design systems delivered'],
]

function Arrow({ diagonal = false }) {
  return <span aria-hidden="true">{diagonal ? '↗' : '→'}</span>
}

function ProjectVisual({ project, index }) {
  if (project.cover) {
    return <img src={project.cover} alt={`${project.title} project preview`} />
  }

  return (
    <div className="project-mockup" style={{ '--project-accent': project.accent }} aria-hidden="true">
      <div className="mockup-bar">
        <span />
        <span />
        <span />
        <i />
      </div>
      <div className={`mockup-screen mockup-screen-${(index % 3) + 1}`}>
        <div className="mockup-kicker" />
        <div className="mockup-title" />
        <div className="mockup-title short" />
        <div className="mockup-button" />
        <div className="mockup-panel">
          <span />
          <span />
          <span />
        </div>
      </div>
      <span className="project-monogram">{project.monogram}</span>
    </div>
  )
}

function ProjectCard({ project, index }) {
  const content = (
    <>
      <div className="project-visual">
        <ProjectVisual project={project} index={index} />
        <div className="project-index">0{index + 1}</div>
      </div>
      <div className="project-copy">
        <div className="project-heading-row">
          <div>
            <p className="project-type">{project.category} · {project.year}</p>
            <h3>{project.title}</h3>
          </div>
          <span className="project-arrow"><Arrow diagonal /></span>
        </div>
        <p>{project.description}</p>
        <div className="project-footer">
          <ul aria-label="Technologies used">
            {project.technologies.map((technology) => <li key={technology}>{technology}</li>)}
          </ul>
          <strong>{project.result}</strong>
        </div>
      </div>
    </>
  )

  if (project.url) {
    return (
      <a className="project-card" href={project.url} target="_blank" rel="noreferrer" aria-label={`View ${project.title} project`}>
        {content}
      </a>
    )
  }

  return <article className="project-card">{content}</article>
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')
  const [copyStatus, setCopyStatus] = useState('Copy email')
  const [darkMode, setDarkMode] = useState(false)
  const email = 'hello@jordandiaz.dev'

  const filters = useMemo(
    () => ['All', ...new Set(projects.map((project) => project.category))],
    [],
  )

  const visibleProjects = activeFilter === 'All'
    ? projects
    : projects.filter((project) => project.category === activeFilter)

  useEffect(() => {
    const nodes = document.querySelectorAll('[data-reveal]')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) {
      nodes.forEach((node) => node.classList.add('is-visible'))
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -5% 0px' },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [activeFilter])

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
  }, [darkMode])

  const closeMenu = () => setMenuOpen(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopyStatus('Copied!')
    } catch {
      setCopyStatus(email)
    }
    window.setTimeout(() => setCopyStatus('Copy email'), 2200)
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jordan Diaz, home" onClick={closeMenu}>
          <span className="brand-dot" />
          Jordan Diaz
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>

        <nav className={menuOpen ? 'site-nav is-open' : 'site-nav'} aria-label="Primary navigation">
          <a href="#work" onClick={closeMenu}>Work</a>
          <a href="#about" onClick={closeMenu}>About</a>
          <a href="#experience" onClick={closeMenu}>Experience</a>
          <a href="#contact" onClick={closeMenu}>Let’s talk <Arrow diagonal /></a>
        </nav>

        <button
          className="theme-toggle"
          type="button"
          aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
          onClick={() => setDarkMode((value) => !value)}
        >
          <span className="theme-toggle-track"><span /></span>
          {darkMode ? 'Light' : 'Dark'}
        </button>
      </header>

      <main id="top">
        <section className="hero section-wrap">
          <div className="hero-copy" data-reveal>
            <div className="availability"><i /> Available for select projects</div>
            <h1>Designing digital experiences with <em>clarity</em> and character.</h1>
            <p>
              I’m Jordan, a designer and frontend engineer creating thoughtful websites and
              products for ambitious teams.
            </p>
            <div className="hero-actions">
              <a className="button button-dark" href="#work">Explore my work <Arrow /></a>
              <button className="text-button" type="button" onClick={copyEmail}>{copyStatus}</button>
            </div>
          </div>

          <div className="hero-art" data-reveal>
            <div className="hero-art-topline">
              <span>Independent creative developer</span>
              <span>Based in Boston · Working worldwide</span>
            </div>
            <div className="art-stage">
              <div className="art-disc art-disc-one" />
              <div className="art-disc art-disc-two" />
              <img src={heroArtwork} alt="Layered interface illustration" />
              <div className="art-note art-note-left">Design systems</div>
              <div className="art-note art-note-right">Creative code</div>
              <div className="art-stamp"><span>JD</span><small>©26</small></div>
            </div>
          </div>

          <div className="hero-stats" data-reveal>
            {stats.map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="work" className="projects section-wrap">
          <div className="section-intro" data-reveal>
            <div>
              <p className="eyebrow">Selected work / 2022—2026</p>
              <h2>Projects built to be <em>used</em>, not just viewed.</h2>
            </div>
            <p>A selection of product, brand, and platform work shaped from early thinking through final frontend delivery.</p>
          </div>

          <div className="project-filters" aria-label="Filter projects" data-reveal>
            {filters.map((filter) => (
              <button
                type="button"
                key={filter}
                className={activeFilter === filter ? 'is-active' : ''}
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="project-grid">
            {visibleProjects.map((project, index) => (
              <ProjectCard key={project.title} project={project} index={index} />
            ))}
          </div>
        </section>

        <section id="about" className="about section-wrap">
          <div className="about-heading" data-reveal>
            <p className="eyebrow">What I bring</p>
            <h2>One partner from first idea to <em>finished</em> interface.</h2>
          </div>
          <div className="service-list">
            {services.map((service) => (
              <article key={service.number} data-reveal>
                <span>{service.number}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="experience" className="experience section-wrap">
          <div className="experience-quote" data-reveal>
            <p className="eyebrow">A little about me</p>
            <blockquote>
              “I care about the quiet details—the spacing, words, and interactions that make a product feel <em>obvious</em>.”
            </blockquote>
          </div>
          <div className="experience-list" data-reveal>
            <p className="list-label">Experience</p>
            {experience.map((item) => (
              <article key={item.period}>
                <span>{item.period}</span>
                <div>
                  <h3>{item.role}</h3>
                  <p>{item.company}</p>
                </div>
              </article>
            ))}
            <a href={`mailto:${email}?subject=Résumé request`}>Request full résumé <Arrow diagonal /></a>
          </div>
        </section>
      </main>

      <footer id="contact" className="footer">
        <div className="footer-main section-wrap" data-reveal>
          <p className="eyebrow">Have something in mind?</p>
          <h2>Let’s make it <em>real.</em></h2>
          <a href={`mailto:${email}`}>{email} <Arrow diagonal /></a>
        </div>
        <div className="footer-meta section-wrap">
          <span>© 2026 Jordan Diaz</span>
          <div>
            <a href={`mailto:${email}`}>Email</a>
            <a href="#work">Selected work</a>
            <a href="#top">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
