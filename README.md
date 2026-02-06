# Clock In

A minimal, focused timer app to help you stay on task. Built with Svelte 5 and SvelteKit.

## Features

- **Customizable duration presets** - Choose from preset durations (default: 1, 5, 10, 20, 40 minutes) or configure your own
- **Task tracking** - Name your current task to stay focused
- **Completion sounds** - Three built-in sounds (chime, bell, digital) generated via Web Audio API
- **Progress tracking** - Records completion stats per duration
- **Persistent settings** - All preferences and stats saved to localStorage

## Getting Started

Install dependencies:

```sh
npm install
```

Start the development server:

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start development server       |
| `npm run build`   | Build for production           |
| `npm run preview` | Preview production build       |
| `npm run check`   | Run Svelte type checking       |
| `npm run lint`    | Check formatting with Prettier |
| `npm run format`  | Format code with Prettier      |

## Tech Stack

- [Svelte 5](https://svelte.dev/) with runes
- [SvelteKit](https://kit.svelte.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- Web Audio API for sounds
