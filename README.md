# Christian Lord V. Estorba - Portfolio

A responsive portfolio built with React and Vite.

## Add a project

Open `src/data/projects.js`, duplicate one project object, and replace its content. The project explorer, search, filters, counts, and fallback artwork update automatically.

- `title`, `type`, `year`, `status`, and `summary` control the visible project details.
- `role` and optional `impact` add project proof.
- `stack` accepts any number of technology labels.
- `tone` selects a controlled preview color: `cyan`, `green`, `violet`, or `amber`.
- `image` is optional. Add an image to `public/projects` and use a path such as `/projects/my-project.jpg`.
- `links.live`, `links.repo`, and `links.caseStudy` are all optional and stay hidden when empty.

Update the portfolio profile, technical stack, capabilities, and experience in `src/data/site.js`.

## Add your profile picture

1. Add your image to `public/profile.jpg`.
2. Open `src/data/site.js` and set `photo` to `/profile.jpg`.
3. Use `photoPosition` to adjust the crop, for example `50% 25%` to show more of the upper part of the photo.

The hero shows a styled initials placeholder until a photo path is supplied.

## Run locally

```bash
npm run dev
```

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
