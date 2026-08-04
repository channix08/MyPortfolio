import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildStack,
  mapRepositoryToProject,
  parseArguments,
  safeHomepage,
  upsertProject,
  validateRepositorySlug,
} from '../scripts/import-github-project.mjs'

const repository = {
  id: 42,
  name: 'demo',
  full_name: 'example/demo',
  owner: { login: 'example' },
  created_at: '2025-04-12T00:00:00Z',
  archived: false,
  description: 'A useful demo.',
  homepage: 'https://demo.example.com',
  language: 'JavaScript',
  stargazers_count: 2,
  forks_count: 1,
}

test('validates CLI arguments without a network request', () => {
  assert.deepEqual(parseArguments(['example/demo', '--dry-run']), {
    dryRun: true,
    slug: { owner: 'example', repository: 'demo' },
  })
  assert.throws(() => validateRepositorySlug('https://github.com/example/demo'), /OWNER\/REPO/)
  assert.throws(() => parseArguments([]), /exactly one/)
})

test('sorts detected languages and sanitizes homepages', () => {
  assert.deepEqual(buildStack({ CSS: 10, JavaScript: 90, HTML: 30 }, ''), ['JavaScript', 'HTML', 'CSS'])
  assert.deepEqual(buildStack({}, 'Dart'), ['Dart'])
  assert.equal(safeHomepage('javascript:alert(1)'), '')
  assert.equal(safeHomepage('https://example.com'), 'https://example.com/')
})

test('maps GitHub metadata and preserves curated overrides on update', () => {
  const mapped = mapRepositoryToProject(repository, { JavaScript: 90, CSS: 10 })
  const existing = [{ ...mapped, overrides: { summary: 'Curated copy', featured: false } }]
  const refreshed = mapRepositoryToProject({ ...repository, description: 'Updated upstream.' }, { TypeScript: 100 })
  const result = upsertProject(existing, refreshed)

  assert.equal(mapped.id, 'github-42')
  assert.equal(mapped.year, 2025)
  assert.equal(mapped.links.repo, 'https://github.com/example/demo')
  assert.equal(result.action, 'Updated')
  assert.deepEqual(result.project.overrides, { summary: 'Curated copy', featured: false })
  assert.equal(existing[0].summary, 'A useful demo.')
})
