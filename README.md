# DataLens BI

Analyst-first business intelligence platform. Upload CSV/Excel, build charts and pivots, export branded reports, save company-level configurations.

> **Status:** Day 1 of 30 · Foundation phase

## Stack

React 18 + TypeScript + Vite · TailwindCSS + shadcn/ui · Supabase (Postgres + Auth + Storage) · ECharts · Vercel.

Full breakdown: [`project_plan/TECH_STACK.md`](./project_plan/TECH_STACK.md)

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in your Supabase URL + anon key

# 3. Run dev server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173).

## Scripts

| Command            | Purpose                              |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start dev server with HMR            |
| `npm run build`    | Production build to `dist/`          |
| `npm run preview`  | Preview production build locally     |
| `npm run lint`     | Run ESLint                           |
| `npm run format`   | Auto-format with Prettier            |
| `npm run typecheck`| TypeScript check without emitting    |

## Project structure

```
datalens-bi/
├── project_plan/        # 30-day build plan, tech stack docs, progress tracker
├── src/
│   ├── app/             # Route components, root layout
│   ├── features/        # Feature modules (auth/, upload/, charts/, ...)
│   ├── components/ui/   # shadcn/ui primitives
│   ├── lib/             # Supabase client, utilities
│   ├── hooks/           # Shared React hooks
│   └── types/           # Shared TypeScript types
├── index.html
└── vite.config.ts
```

## Documentation

- [Project plan (30 days)](./project_plan/PROJECT_PLAN.md)
- [Day 1 build plan](./project_plan/DAY_1_PLAN.md)
- [Tech stack rationale](./project_plan/TECH_STACK.md)
- [Interactive progress tracker](./project_plan/progress.html) — open in browser
