#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { projects as manualProjects } from '../src/data/projects.js'
import { capabilities, experience, profile, stackGroups } from '../src/data/site.js'
import { isProjectFeatured, safeImage, safeLink } from '../src/data/project-utils.js'

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDirectory = resolve(rootDirectory, 'public')
const issues = []

function report(message) {
  issues.push(message)
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function requiredText(value, label) {
  if (typeof value !== 'string' || !value.trim()) report(`${label} must be a non-empty string.`)
}

function resolvedProject(project) {
  const overrides = isObject(project?.overrides) ? project.overrides : {}
  return {
    ...project,
    ...overrides,
    links: {
      ...(isObject(project?.links) ? project.links : {}),
      ...(isObject(overrides.links) ? overrides.links : {}),
    },
  }
}

async function validateLocalAsset(value, label) {
  if (!value?.startsWith('/') || value.startsWith('//')) return

  let pathname
  try {
    pathname = decodeURIComponent(new URL(value, 'https://portfolio.local').pathname)
  } catch {
    report(`${label} contains an invalid local path.`)
    return
  }

  const filePath = resolve(publicDirectory, `.${pathname}`)
  if (filePath !== publicDirectory && !filePath.startsWith(`${publicDirectory}${sep}`)) {
    report(`${label} must stay inside the public directory.`)
    return
  }

  try {
    await access(filePath)
  } catch {
    report(`${label} points to missing file public${pathname}.`)
  }
}

function validateLink(value, label, allowRelative = false) {
  if (value === undefined || value === null || value === '') return
  if (typeof value !== 'string' || !safeLink(value, { allowRelative })) {
    report(`${label} must be a complete http(s) URL${allowRelative ? ' or a site-relative /path or #anchor' : ''}.`)
  }
}

async function validateProject(project, source, index) {
  if (!isObject(project)) {
    report(`${source}[${index}] must be an object.`)
    return
  }

  const resolved = resolvedProject(project)
  const label = `${source}[${index}]`
  requiredText(resolved.id, `${label}.id`)
  requiredText(resolved.title, `${label}.title`)
  requiredText(resolved.summary, `${label}.summary`)

  if (isProjectFeatured(project) && (!Array.isArray(resolved.stack) || resolved.stack.length === 0)) {
    report(`${label}.stack must contain at least one technology when the project is featured.`)
  }

  validateLink(resolved.links?.live, `${label}.links.live`)
  validateLink(resolved.links?.repo, `${label}.links.repo`)
  validateLink(resolved.links?.caseStudy, `${label}.links.caseStudy`, true)

  if (resolved.image) {
    if (!safeImage(resolved.image)) report(`${label}.image must be a complete http(s) URL or a public /path.`)
    else await validateLocalAsset(resolved.image, `${label}.image`)
  }
}

async function readGithubProjects() {
  try {
    const value = JSON.parse(await readFile(resolve(rootDirectory, 'src/data/github-projects.json'), 'utf8'))
    if (!Array.isArray(value)) {
      report('src/data/github-projects.json must contain a JSON array.')
      return []
    }
    return value
  } catch (error) {
    report(`src/data/github-projects.json is not valid JSON: ${error.message}`)
    return []
  }
}

async function main() {
  requiredText(profile.name, 'profile.name')
  requiredText(profile.handle, 'profile.handle')
  requiredText(profile.role, 'profile.role')

  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    report('profile.email must be a valid email address or an empty string.')
  }
  validateLink(profile.github, 'profile.github')
  if (!profile.email && !safeLink(profile.github)) report('Add either profile.email or a valid profile.github contact URL.')

  if (profile.photo) {
    if (!safeImage(profile.photo)) report('profile.photo must be a complete http(s) URL or a public /path.')
    else await validateLocalAsset(profile.photo, 'profile.photo')
    requiredText(profile.photoAlt, 'profile.photoAlt')
  }

  if (profile.resumeUrl) {
    const resume = safeImage(profile.resumeUrl)
    if (!resume) report('profile.resumeUrl must be a complete http(s) URL or a public /path.')
    else await validateLocalAsset(profile.resumeUrl, 'profile.resumeUrl')
  }

  if (!Array.isArray(stackGroups) || stackGroups.length === 0) report('stackGroups must contain at least one group.')
  if (!Array.isArray(capabilities) || capabilities.length === 0) report('capabilities must contain at least one item.')
  if (!Array.isArray(experience)) report('experience must be an array.')

  const githubProjects = await readGithubProjects()
  const sources = [
    ...githubProjects.map((project, index) => ({ project, source: 'github-projects', index })),
    ...manualProjects.map((project, index) => ({ project, source: 'projects', index })),
  ]
  const seenIds = new Set()

  for (const item of sources) {
    await validateProject(item.project, item.source, item.index)
    const id = resolvedProject(item.project).id
    if (typeof id === 'string' && id.trim()) {
      if (seenIds.has(id.trim())) report(`Project id "${id.trim()}" is duplicated.`)
      seenIds.add(id.trim())
    }
  }

  const featuredCount = sources.filter(({ project }) => isProjectFeatured(project)).length
  if (featuredCount === 0) report('At least one project must be featured before publishing.')

  if (issues.length) {
    console.error(`Content validation failed with ${issues.length} issue${issues.length === 1 ? '' : 's'}:`)
    issues.forEach((issue) => console.error(`- ${issue}`))
    process.exitCode = 1
    return
  }

  console.log(`Content validation passed: ${featuredCount} featured project${featuredCount === 1 ? '' : 's'}, ${sources.length} total records.`)
}

await main()
