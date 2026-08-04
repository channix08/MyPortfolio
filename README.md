# Christian Lord Estorba - Portfolio

A modern, responsive developer portfolio built with React and Vite.

Requires Node.js `^20.19.0` or `>=22.12.0`.

## Run locally

```bash
npm install
npm run dev
```

Before publishing, check the project with:

```bash
npm run lint
npm run build
```

## Import a public GitHub project

Use one command with the repository's `OWNER/REPO` name:

```bash
npm run project:github -- channix08/Study-Mate
```

The importer reads the public GitHub repository and its languages, then adds or updates a normalized project in `src/data/github-projects.json`. Search, filters, counts, links, and fallback artwork update automatically.

Preview an import without changing files:

```bash
npm run project:github -- channix08/Study-Mate --dry-run
```

Run the same import again whenever the repository metadata changes. Public repositories work without a token; GitHub's normal unauthenticated API rate limit applies.

To customize an imported card without losing your edits on the next import, add fields inside its `overrides` object. You can override `summary`, `type`, `role`, `impact`, `stack`, `tone`, `image`, or individual `links`.

## Add or customize a project manually

Edit `src/data/projects.js` for hand-written case studies, or use the `overrides` object on an imported entry in `src/data/github-projects.json`.

- `title`, `type`, `year`, `status`, and `summary` control visible details.
- `role` and optional `impact` add project proof.
- `stack` accepts one or more technology labels.
- `tone` supports `cyan`, `green`, `violet`, or `amber`.
- `image` is optional. Put an image in `public/projects` and use a path such as `/projects/my-project.jpg`.
- `links.live`, `links.repo`, and `links.caseStudy` are optional and stay hidden when empty.

The app normalizes missing optional fields so an incomplete project cannot break the page.

## Update your profile

Edit `src/data/site.js` to change the profile, stack, capabilities, and experience.

To add a profile picture:

1. Add the image as `public/profile.jpg`.
2. Set `photo` to `/profile.jpg` in `src/data/site.js`.
3. Adjust `photoPosition`, such as `50% 25%`, to control the crop.

Leave `photo` empty to keep the styled initials placeholder. Add an email when ready; until then, the interface uses the configured GitHub profile as the contact method.
