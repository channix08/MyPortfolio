import githubProjects from './github-projects.json'
import { projects as manualProjects } from './projects'
import { normalizeProjects } from './project-utils'

export const projects = normalizeProjects([...githubProjects, ...manualProjects])
