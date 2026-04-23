# VolunteerBridge

VolunteerBridge is a smart volunteer coordination platform for NGOs and social impact organizations. It is designed to connect community needs, NGO tasks, and volunteers through role-based workflows and AI-assisted matching.

## Status

This repository currently contains a clean scaffold (folder structure + placeholder files) for a Next.js 14 App Router application.

- No business logic is implemented yet.
- No UI styling is implemented yet.
- Core config files and modules are placeholders.

## Project Location

The application source is located in:

`volunteerbridge/`

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Firebase (Auth, Firestore, Storage)
- Anthropic Claude integration (planned)

## Role Areas

The app scaffold supports multiple role-based route groups:

- Public pages
- Auth
- Admin
- NGO
- Citizen
- Volunteer

## High-Level Structure

```
volunteerbridge/
	app/             # App Router pages and role-based layouts
	api/             # Route handlers for auth, tasks, match, surveys, etc.
	components/      # UI and domain components by role
	lib/             # Integrations, hooks, utilities, and shared types
	constants/       # Shared constants (roles, categories, routes)
```

## Quick Start

### 1) Prerequisites

- Node.js 18+
- npm 9+

### 2) Install dependencies

From the repository root:

```bash
cd volunteerbridge
npm install
```

### 3) Configure environment

Update `volunteerbridge/.env.local` with real keys.

Suggested variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

ANTHROPIC_API_KEY=
```

## What Is Already Included

- Route and layout skeleton for all user roles
- API endpoint file structure
- Component file organization by domain
- Integration and utility module placeholders
- Firebase config placeholders (`firebase.json`, `firestore.rules`, `firestore.indexes.json`)

## Next Implementation Steps

1. Add proper `package.json` scripts and dependencies for Next.js + Tailwind.
2. Configure TypeScript and Next.js settings.
3. Build shared layout and UI primitives.
4. Implement authentication and role-based middleware.
5. Implement API routes and Firebase integration.
6. Add Claude-based volunteer-task matching and survey parsing logic.

## License

This project is currently for Solution Challenge 2026 development use.