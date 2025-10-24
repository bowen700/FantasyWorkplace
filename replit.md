# Fantasy Workplace - Gamified Performance Management

## Overview
Fantasy Workplace is a gamified performance management platform that transforms employee KPI tracking into friendly, fantasy sports-style competition. Employees compete in weekly head-to-head matchups, earn badges for achievements, and advance to playoff tournaments.

## Tech Stack
- **Frontend**: React + TypeScript, TailwindCSS, Shadcn UI, Wouter (routing), TanStack Query
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **AI**: OpenAI GPT-5 for AI Coach feature
- **Design System**: Inter (UI/data), Space Grotesk (display/scores)

## Project Structure

### Frontend (`client/src/`)
- **pages/**: All application pages
  - `landing.tsx` - Public landing page for unauthenticated users
  - `dashboard.tsx` - Main dashboard with quick stats and recent matchups
  - `matchups.tsx` - Head-to-head matchup results and history
  - `leaderboard.tsx` - Season rankings with win/loss records
  - `upload.tsx` - KPI data upload (manual entry or CSV file)
  - `badges.tsx` - Achievement gallery with earned/locked badges
  - `admin.tsx` - Admin panel for KPI/season/matchup management
- **components/**: Reusable UI components
  - `app-sidebar.tsx` - Navigation sidebar with role-based menu
  - `header.tsx` - Top bar with user profile dropdown
- **hooks/**: Custom React hooks
  - `useAuth.ts` - Authentication state management

### Backend (`server/`)
- **routes.ts**: All API endpoints
  - Auth: `/api/auth/user`
  - Seasons: `/api/seasons/*`
  - KPIs: `/api/kpis/*`
  - KPI Data: `/api/kpi-data/*`
  - Matchups: `/api/matchups/*`
  - Leaderboard: `/api/leaderboard`
  - Badges: `/api/badges/*`
  - AI Coach: `/api/ai-coach`
- **storage.ts**: Database abstraction layer (IStorage interface + DatabaseStorage implementation)
- **replitAuth.ts**: Replit Auth integration with session management
- **openai.ts**: OpenAI API integration for AI coaching feedback
- **seed.ts**: Initial data seeding (badges, default season)

### Database Schema (`shared/schema.ts`)
- **users**: User accounts with role (employee, admin, cio)
- **seasons**: Competition periods (10-week regular season + 4-week playoffs)
- **kpis**: Performance indicators with weights and display order
- **kpiData**: Weekly performance data submitted by users
- **matchups**: Head-to-head pairings with scores and winners
- **badges**: Achievement definitions
- **userBadges**: Badges earned by users
- **aiCoachConversations**: AI coaching conversation history
- **sessions**: Replit Auth session storage

## Key Features

### 1. Weekly Matchups
- Automatic pairing generation
- Weighted KPI scoring system
- Win/loss tracking
- Playoff qualification

### 2. KPI Management (Admin)
- Create/edit/delete KPIs
- Adjust weights dynamically
- Toggle active/inactive status
- Reorder for display

### 3. Data Upload
- Manual entry with inline forms
- CSV file upload
- Downloadable templates
- Automatic score calculation

### 4. Leaderboard
- Real-time rankings
- Win-loss records
- Total points
- Playoff indicators

### 5. Badges & Achievements
- Performance, Consistency, Comeback, Dominance categories
- Visual badge gallery
- Progress tracking
- Recent achievements

### 6. AI Coach
- Personalized KPI feedback using GPT-5
- Context-aware suggestions
- Performance analysis
- Motivational insights

## Role-Based Access
- **Employee**: View matchups, upload data, see leaderboard, collect badges
- **Admin**: All employee features + KPI management, season setup, matchup generation
- **CIO**: Admin access for oversight (excluded from competition)

## Authentication Flow
1. Landing page shown to unauthenticated users
2. "Sign In" redirects to `/api/login` (Replit Auth)
3. After auth, redirected to dashboard
4. Session managed via PostgreSQL-backed Express sessions
5. Auto-refresh of expired tokens

## Database Operations
- **Push schema**: `npm run db:push`
- **Force push**: `npm run db:push --force`
- Seeding runs automatically on server start

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for AI Coach
- `SESSION_SECRET` - Express session secret
- `REPLIT_DOMAINS` - Replit domain for OAuth
- `REPL_ID` - Replit project ID

## Design Guidelines
See `design_guidelines.md` for comprehensive design system documentation including:
- Typography (Inter + Space Grotesk)
- Color system
- Component patterns
- Spacing standards
- Animation principles

## Development
- Start server: `npm run dev`
- Runs on port 5000
- Vite HMR for frontend
- Express server for backend + API

## Recent Changes
- Full implementation of Fantasy Workplace MVP
- Complete database schema with relations
- All frontend pages and components built
- Backend API routes implemented
- Replit Auth integration
- OpenAI AI Coach feature
- Seed data for badges and default season
- Admin panel for KPI/season management
- Leaderboard calculations
- Matchup scoring system
