# AGENTS.md — VolunteerBridge

> Single source of truth for all AI agents (Codex, Cursor, Claude Code, Windsurf) working on this codebase. Read this fully before touching any file.

---

## Project Overview

VolunteerBridge is a smart volunteer coordination platform for NGOs and local social groups.  
It collects scattered community need data (paper surveys, field reports) and uses AI to match available volunteers with urgent tasks.

**Core problem**: Community need data is fragmented. Volunteers are underutilized. Matching is manual and slow.  
**Core solution**: Centralized need aggregation + Claude AI-powered volunteer matching.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion |
| Database | Firebase Firestore (real-time) |
| Auth | Firebase Authentication |
| File Storage | Firebase Storage |
| AI Engine | Claude API (claude-sonnet-4-20250514) via Anthropic SDK |
| Forms | React Hook Form + Zod |
| Maps | Leaflet.js |
| Charts | Recharts |
| Hosting | Vercel |

---

## The Four Roles

Every feature you build must clearly belong to exactly one role. Never mix role logic in a single component.

### 1. Admin
- Full system visibility — all users, NGOs, tasks, needs, volunteers
- Can approve/reject NGO registrations
- Views aggregate analytics: need heatmaps, volunteer coverage, urgency reports
- Can assign or reassign volunteers to tasks manually
- Route prefix: `/admin/*`

### 2. NGO
- Registers on the platform (pending admin approval)
- Creates and manages tasks (title, description, location, skills needed, urgency level)
- Uploads paper surveys and field reports (PDF/image) — parsed by Claude
- Views matched volunteers for each task
- Route prefix: `/ngo/*`

### 3. Citizen
- Submits community need reports (free text, category, location, urgency)
- Can attach photos
- Tracks status of their submitted reports
- No task management — read-only on task outcomes
- Route prefix: `/citizen/*`

### 4. Volunteer
- Browses AI-matched tasks (filtered by skills, location, availability)
- Accepts or declines task assignments
- Logs task progress and marks completion
- Has a profile with skills, location, availability status
- Route prefix: `/volunteer/*`

---

## Firebase Data Schema

### Collections