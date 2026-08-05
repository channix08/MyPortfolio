import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isProjectFeatured,
  normalizeProject,
  normalizeProjects,
  safeImage,
  safeLink,
} from '../src/data/project-utils.js'

test('normalizes overrides, stack values, and safe links', () => {
  const project = normalizeProject({
    id: 'demo',
    title: ' Demo ',
    stack: [' React ', 'React', '', 42],
    image: '/projects/demo.jpg',
    links: { repo: 'javascript:alert(1)', caseStudy: '/case-studies/demo' },
    overrides: {
      title: 'Published demo',
      links: { repo: 'https://github.com/example/demo' },
    },
  }, 0)

  assert.equal(project.title, 'Published demo')
  assert.deepEqual(project.stack, ['React'])
  assert.equal(project.image, '/projects/demo.jpg')
  assert.equal(project.links.repo, 'https://github.com/example/demo')
  assert.equal(project.links.caseStudy, '/case-studies/demo')
})

test('rejects unsafe, incomplete, and protocol-relative URLs', () => {
  assert.equal(safeLink('github.com/example/demo'), '')
  assert.equal(safeLink('javascript:alert(1)'), '')
  assert.equal(safeLink('//example.com/demo', { allowRelative: true }), '')
  assert.equal(safeImage('#portrait'), '')
  assert.equal(safeImage('/profile.jpg'), '/profile.jpg')
})

test('applies featured overrides and deterministic duplicate IDs', () => {
  const projects = normalizeProjects([
    { id: 'same', title: 'One', featured: true, overrides: { featured: false } },
    { id: 'same', title: 'Two', featured: true },
    { id: 'same', title: 'Three', featured: true },
  ])

  assert.equal(isProjectFeatured({ featured: true, overrides: { featured: false } }), false)
  assert.deepEqual(projects.map((project) => project.id), ['same', 'same-2'])
})
