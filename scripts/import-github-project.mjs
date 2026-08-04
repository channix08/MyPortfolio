#!/usr/bin/env node

import { readFile, rename, unlink, writeFile } from 'node:fs/promises'

const API_ROOT = 'https://api.github.com/repos'
const PROJECTS_FILE = new URL('../src/data/github-projects.json', import.meta.url)
const TONES = ['cyan', 'green', 'violet', 'amber']

const usage = `Usage:
  node scripts/import-github-project.mjs OWNER/REPO [--dry-run]

Options:
  --dry-run  Print the imported project without changing any files.
  -h, --help Show this help message.

Example:
  node scripts/import-github-project.mjs channix08/MyPortfolio --dry-run`

function parseArguments(args) {
  if (args.includes('--help') || args.includes('-h')) {
    return { help: true }
  }

  const knownFlags = new Set(['--dry-run'])
  const unknownFlag = args.find((argument) => argument.startsWith('-') && !knownFlags.has(argument))
  if (unknownFlag) {
    throw new Error(`Unknown option: ${unknownFlag}`)
  }

  const positional = args.filter((argument) => !argument.startsWith('-'))
  if (positional.length !== 1) {
    throw new Error('Provide exactly one public GitHub repository as OWNER/REPO.')
  }

  return {
    dryRun: args.includes('--dry-run'),
    slug: validateRepositorySlug(positional[0]),
  }
}

function validateRepositorySlug(slug) {
  if (slug !== slug.trim()) {
    throw new Error('Repository names cannot start or end with whitespace.')
  }

  const parts = slug.split('/')
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid repository "${slug}". Use OWNER/REPO, not a GitHub URL.`)
  }

  const [owner, repository] = parts
  const validOwner = /^[A-Za-z0-9-]{1,39}$/.test(owner)
    && !owner.startsWith('-')
    && !owner.endsWith('-')
  const validRepository = /^[A-Za-z0-9._-]{1,100}$/.test(repository)
    && repository !== '.'
    && repository !== '..'

  if (!validOwner || !validRepository) {
    throw new Error(`Invalid repository "${slug}". Use a valid GitHub OWNER/REPO slug.`)
  }

  return { owner, repository }
}

async function fetchGitHubJson(url, resourceName) {
  let response

  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'portfolio-project-importer',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
  } catch (error) {
    throw new Error(`Could not connect to GitHub while fetching ${resourceName}: ${error.message}`)
  }

  if (!response.ok) {
    let apiMessage = ''
    try {
      const body = await response.json()
      apiMessage = typeof body?.message === 'string' ? ` GitHub says: ${body.message}` : ''
    } catch {
      // A useful status-based message is still available when the body is not JSON.
    }

    if (response.status === 404) {
      throw new Error(`GitHub could not find this public repository.${apiMessage}`)
    }

    if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
      const resetHeader = response.headers.get('x-ratelimit-reset')
      const resetSeconds = resetHeader ? Number(resetHeader) : Number.NaN
      const resetMessage = Number.isFinite(resetSeconds)
        ? ` Try again after ${new Date(resetSeconds * 1000).toISOString()}.`
        : ' Try again later.'
      throw new Error(`GitHub's unauthenticated API rate limit was reached.${resetMessage}`)
    }

    throw new Error(`GitHub returned ${response.status} while fetching ${resourceName}.${apiMessage}`)
  }

  try {
    return await response.json()
  } catch {
    throw new Error(`GitHub returned invalid JSON for ${resourceName}.`)
  }
}

function safeHomepage(value) {
  if (!value) return ''

  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''
  } catch {
    return ''
  }
}

function buildStack(languages, primaryLanguage) {
  const detectedLanguages = Object.entries(languages)
    .filter(([name, bytes]) => name && Number.isFinite(bytes) && bytes > 0)
    .sort(([nameA, bytesA], [nameB, bytesB]) => bytesB - bytesA || nameA.localeCompare(nameB))
    .map(([name]) => name)

  if (detectedLanguages.length > 0) {
    return detectedLanguages.slice(0, 6)
  }

  return primaryLanguage ? [primaryLanguage] : ['GitHub']
}

function buildImpact(repository) {
  const metrics = []
  if (repository.stargazers_count > 0) {
    metrics.push(`${repository.stargazers_count} GitHub star${repository.stargazers_count === 1 ? '' : 's'}`)
  }
  if (repository.forks_count > 0) {
    metrics.push(`${repository.forks_count} fork${repository.forks_count === 1 ? '' : 's'}`)
  }
  return metrics.join(' / ')
}

function mapRepositoryToProject(repository, languages) {
  if (!Number.isSafeInteger(repository.id) || typeof repository.name !== 'string') {
    throw new Error('GitHub returned incomplete repository metadata.')
  }

  const createdAt = new Date(repository.created_at)
  if (Number.isNaN(createdAt.getTime())) {
    throw new Error('GitHub returned an invalid repository creation date.')
  }

  const fullName = typeof repository.full_name === 'string'
    ? repository.full_name
    : `${repository.owner?.login}/${repository.name}`
  const canonicalParts = fullName.split('/')
  if (canonicalParts.length !== 2 || canonicalParts.some((part) => !part)) {
    throw new Error('GitHub returned an invalid canonical repository name.')
  }

  return {
    id: `github-${repository.id}`,
    title: repository.name,
    type: 'GitHub Project',
    year: createdAt.getUTCFullYear(),
    status: repository.archived ? 'Archived' : 'Active',
    summary: repository.description?.trim() || `A public GitHub repository for ${repository.name}.`,
    role: 'Developer',
    impact: buildImpact(repository),
    stack: buildStack(languages, repository.language),
    tone: TONES[repository.id % TONES.length],
    featured: true,
    image: '',
    links: {
      live: safeHomepage(repository.homepage),
      repo: `https://github.com/${canonicalParts.map(encodeURIComponent).join('/')}`,
      caseStudy: '',
    },
    overrides: {},
  }
}

async function readProjects() {
  let contents
  try {
    contents = await readFile(PROJECTS_FILE, 'utf8')
  } catch (error) {
    throw new Error(`Could not read ${PROJECTS_FILE.pathname}: ${error.message}`)
  }

  let projects
  try {
    projects = JSON.parse(contents)
  } catch (error) {
    throw new Error(`The GitHub projects file contains invalid JSON: ${error.message}`)
  }

  if (!Array.isArray(projects)) {
    throw new Error('The GitHub projects file must contain a JSON array.')
  }

  return projects
}

async function writeProjects(projects) {
  const temporaryFile = new URL(`../src/data/github-projects.json.${process.pid}.tmp`, import.meta.url)
  await writeFile(temporaryFile, `${JSON.stringify(projects, null, 2)}\n`, 'utf8')

  try {
    await rename(temporaryFile, PROJECTS_FILE)
  } catch (error) {
    await unlink(temporaryFile).catch(() => {})
    throw new Error(`Could not update ${PROJECTS_FILE.pathname}: ${error.message}`)
  }
}

async function main() {
  let options
  try {
    options = parseArguments(process.argv.slice(2))
  } catch (error) {
    console.error(`Error: ${error.message}\n\n${usage}`)
    process.exitCode = 1
    return
  }

  if (options.help) {
    console.log(usage)
    return
  }

  const owner = encodeURIComponent(options.slug.owner)
  const repository = encodeURIComponent(options.slug.repository)
  const repositoryUrl = `${API_ROOT}/${owner}/${repository}`
  const languagesUrl = `${API_ROOT}/${owner}/${repository}/languages`

  try {
    const repositoryData = await fetchGitHubJson(repositoryUrl, 'repository metadata')
    const languages = await fetchGitHubJson(languagesUrl, 'repository languages')

    if (!languages || typeof languages !== 'object' || Array.isArray(languages)) {
      throw new Error('GitHub returned invalid repository language data.')
    }

    const project = mapRepositoryToProject(repositoryData, languages)

    if (options.dryRun) {
      console.log(JSON.stringify(project, null, 2))
      return
    }

    const projects = await readProjects()
    const existingIndex = projects.findIndex((item) => item?.id === project.id)
    const action = existingIndex === -1 ? 'Added' : 'Updated'

    if (existingIndex === -1) {
      projects.push(project)
    } else {
      const existingOverrides = projects[existingIndex]?.overrides
      project.overrides = existingOverrides && typeof existingOverrides === 'object' && !Array.isArray(existingOverrides)
        ? existingOverrides
        : {}
      projects[existingIndex] = project
    }

    await writeProjects(projects)
    console.log(`${action} ${repositoryData.full_name} in src/data/github-projects.json.`)
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exitCode = 1
  }
}

await main()
