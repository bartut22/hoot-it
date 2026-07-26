# OwlQuest

OwlQuest (formerly Hoot It) is a React + Vite social challenge app for college communities. Users sign in through Supabase, complete timed challenges, submit photo or video evidence, and track progress through a college-based leaderboard, social feed, and profile system.

## What It Does

- Challenge flow: browse active challenges, open a capture flow, and submit proof for review.
- Social layer: view a feed of posts, follow other users, and open post detail overlays.
- Competition: compare individual and college performance on the leaderboard.
- Profiles: inspect points, completion progress, follower counts, and personal stats.
- Admin tools: access a dedicated moderation view for challenge and submission management.

## Tech Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS v4
- React Router
- Supabase Auth, Database, and Storage
- Sonner for toast notifications

## Getting Started

### Prerequisites

- Node.js 20 or newer
- pnpm
- A Supabase project with the database, auth, storage, and edge functions used by the app

### Install

```bash
pnpm install
```

### Environment Variables

Create a local `.env` file and provide the Supabase client credentials:

```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Run Locally

```bash
pnpm dev
```

### Build for Production

```bash
pnpm build
```

### Preview the Production Build

```bash
pnpm preview
```

## Scripts

- `pnpm dev` - Start the Vite development server.
- `pnpm build` - Type-check and build the production bundle.
- `pnpm preview` - Serve the production build locally.
- `pnpm format` - Run the project formatter.

## Project Structure

- `src/App.tsx` - App shell, routing, modal overlays, and auth state handling.
- `src/main.tsx` - React bootstrap entry point.
- `src/screens/` - Route-level screens for challenges, feed, leaderboard, profiles, onboarding, and admin.
- `src/components/` - Reusable UI components such as navigation, post cards, OTP input, and skeletons.
- `src/hooks/` - Data-fetching and derived-state hooks for Supabase queries and app state.
- `src/lib/` - Shared utilities, router helpers, college metadata, and Supabase client setup.
- `supabase/functions/` - Edge functions for backend workflows such as login OTP and avatar sync.

## Authentication Flow

The app uses Supabase for authentication and onboarding:

- Existing users can sign in through the auth callback flow.
- First-time users are routed through onboarding to capture profile details.
- The app persists session state client-side and updates the UI immediately when auth changes.

## Notes

- The app is optimized for the Figma Make environment, where the Vite dev server is already available during development.
- Routes include stack-style overlays for profiles and posts, so navigation can behave like a mobile app even in the browser.

