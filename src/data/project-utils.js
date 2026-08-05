const tones = ['cyan', 'green', 'violet', 'amber']

function text(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function slugify(value, fallback) {
  const slug = text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return slug || fallback
}

function year(value) {
  if (Number.isFinite(value)) return value
  return typeof value === 'string' && value.trim() ? value.trim() : 'Now'
}

export function safeLink(value, { allowRelative = false } = {}) {
  const candidate = text(value)
  if (!candidate) return ''

  if (allowRelative && (candidate.startsWith('/') || candidate.startsWith('#')) && !candidate.startsWith('//')) {
    return candidate
  }

  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''
  } catch {
    return ''
  }
}

export function safeImage(value) {
  const candidate = text(value)
  if (candidate.startsWith('/') && !candidate.startsWith('//')) return candidate
  return safeLink(candidate)
}

export function normalizeProject(project, index) {
  const overrides = project?.overrides && typeof project.overrides === 'object' && !Array.isArray(project.overrides)
    ? project.overrides
    : {}
  const resolvedProject = {
    ...project,
    ...overrides,
    links: {
      ...(project?.links && typeof project.links === 'object' ? project.links : {}),
      ...(overrides.links && typeof overrides.links === 'object' ? overrides.links : {}),
    },
  }
  const stack = Array.isArray(resolvedProject.stack)
    ? [...new Set(resolvedProject.stack.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()))]
    : []
  const links = resolvedProject.links
  const title = text(resolvedProject.title, `Project ${index + 1}`)

  return {
    id: text(resolvedProject.id, slugify(title, `project-${index + 1}`)),
    title,
    type: text(resolvedProject.type, 'Project'),
    year: year(resolvedProject.year),
    status: text(resolvedProject.status, 'In progress'),
    summary: text(resolvedProject.summary, 'Project details and source are available through the links below.'),
    role: text(resolvedProject.role, 'Developer'),
    impact: text(resolvedProject.impact),
    stack: stack.length ? stack.slice(0, 8) : ['GitHub'],
    tone: tones.includes(resolvedProject.tone) ? resolvedProject.tone : tones[index % tones.length],
    image: safeImage(resolvedProject.image),
    links: {
      live: safeLink(links.live),
      repo: safeLink(links.repo),
      caseStudy: safeLink(links.caseStudy, { allowRelative: true }),
    },
  }
}

export function isProjectFeatured(project) {
  const override = project?.overrides?.featured
  return (typeof override === 'boolean' ? override : project?.featured) !== false
}

export function normalizeProjects(projects) {
  const idCounts = new Map()

  return projects
    .filter(isProjectFeatured)
    .map(normalizeProject)
    .map((project) => {
      const count = (idCounts.get(project.id) ?? 0) + 1
      idCounts.set(project.id, count)
      return count === 1 ? project : { ...project, id: `${project.id}-${count}` }
    })
}
