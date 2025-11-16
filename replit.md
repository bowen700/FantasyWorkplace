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
  - `league.tsx` - Browse all matchups from all weeks with filtering
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
  - Matchups: `/api/matchups/*` (GET by week, GET all, POST generate, POST recalculate)
  - Leaderboard: `/api/leaderboard`
  - Badges: `/api/badges/*`
  - AI Coach: `/api/ai-coach`
- **storage.ts**: Database abstraction layer (IStorage interface + DatabaseStorage implementation)
- **replitAuth.ts**: Replit Auth integration with session management
- **openai.ts**: OpenAI API integration for AI coaching feedback
- **seed.ts**: Initial data seeding (badges, default season)

### Database Schema (`shared/schema.ts`)
- **users**: User accounts with role (employee, admin, cio) and sales rep number
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
- Deterministic round-robin pairing generation (circle method)
- Normalized KPI scoring system with min/max scaling
- Weighted scoring with edge case handling (min==max returns 0.5, totalWeight==0 skips)
- Win/loss tracking with automatic winner determination
- Playoff qualification
- Admin overwrite capability to regenerate specific weeks

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

## Admin Access Model
- **Admin Access**: Password-based (accessgranted!) - any authenticated user can access admin functions after entering the admin password
- **Admin Functions**: KPI management, season setup, week adjustment, matchup generation, user management
- **Security**: Server-side `requireAdminPassword` middleware verifies session flag on all admin routes
- **Session Management**: Admin access flag is cleared on logout and when users switch profiles

## Authentication Flow
1. Landing page shown to unauthenticated users
2. User enters team password ($@le$te@m2026)
3. User selects their profile from available users or creates a new profile
4. Session managed via PostgreSQL-backed Express sessions
5. Admin page requires separate admin password (accessgranted!) for access
6. Profile switching available via header dropdown menu
7. "Add Profile" button opens profile creation form with auto-assignment to available sales rep slots (1-10)

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

## Current KPI Configuration
The app is configured with 4 KPIs using **point-based scoring**:
1. **Sales Gross Profit** - 300 GP = 1 point
2. **Sales Revenue** - 3,000 revenue = 1 point
3. **Leads Talked To** - 3 leads = 1 point
4. **Deals Closed** - 1 deal = 1 point

Points from all KPIs are summed to calculate the total score for each matchup.

## Sales Team Members
All users have been assigned sales rep numbers:
- **Rep 1**: Bowen Oswald (bowenbarry19@gmail.com) - Admin/User
- **Rep 2**: Maya Anderson (maya@fantasyworkplace.com)
- **Rep 3**: Ethan Martinez (ethan@fantasyworkplace.com)
- **Rep 4**: Sofia Chen (sofia@fantasyworkplace.com)
- **Rep 5**: Liam Johnson (liam@fantasyworkplace.com)
- **Rep 6**: Olivia Davis (olivia@fantasyworkplace.com)
- **Rep 7**: Noah Wilson (noah@fantasyworkplace.com)
- **Rep 8**: Ava Taylor (ava@fantasyworkplace.com)
- **Rep 9**: Lucas Brown (lucas@fantasyworkplace.com)
- **Rep 10**: Chloe Garcia (chloe@fantasyworkplace.com)

## Current Season Data
- **Active Season**: 2025 Q4 Season (Week 1)
- **Week 1 Data**: Uploaded for sales reps 2-10 (Rep 1/Bowen pending manual entry)
- All KPI data is loaded and ready for matchup generation and leaderboard calculations

## Recent Changes

### November 16, 2025 - Profile Creation Feature
- **Add Profile Functionality**:
  - Added "Add Profile" button to both landing page and header profile selection dialogs
  - Created profile creation form with firstName, lastName, email fields
  - Backend endpoint `/api/auth/create-profile` validates input and auto-assigns sales rep numbers
  - Automatic sales rep number assignment (1-10) for new profiles
  - Email uniqueness validation with clear error messages
  - Auto-selects newly created profile after successful creation
  - Form validation with disabled submit until all required fields are filled
  - Toast notifications for success/error feedback
  - Profile creation available during initial login and when switching profiles

### November 15, 2025 - Admin Access Security & Cascade Delete
- **Admin Access Model Change**: Changed from role-based to password-based admin access
  - Any authenticated user can access admin functions after entering admin password (accessgranted!)
  - Admin password prompt shown when clicking Admin in sidebar
  - Server-side security via `requireAdminPassword` middleware
- **Session Security**:
  - Created `requireAdminPassword` middleware to verify `req.session.adminAccessGranted` flag
  - Applied middleware to all admin routes (users, seasons, KPIs, matchups)
  - Admin access flag cleared on logout (`/api/auth/logout`)
  - Admin access flag cleared when switching user profiles (`/api/auth/select-user`)
  - Prevents privilege persistence across user sessions
- **Admin Routes Updated**:
  - All admin CRUD routes now use `requireAuth, requireAdminPassword` middleware chain
  - Provides server-side verification to prevent API bypass
- **Cascade Delete Implementation**:
  - Updated `deleteUser` to cascade delete all related data in a database transaction
  - Deletes: KPI data, user badges, AI coach conversations, matchups (where user is player1, player2, or winner)
  - Transaction ensures atomicity - all deletes succeed or all rollback
  - Enhanced delete confirmation dialog to explicitly list all data that will be deleted
  - Delete button styled with destructive colors and updated text to "Delete User and All Data"

### November 12, 2025 - Admin User Management System
- **User Management Storage & API**: 
  - Added `updateUser` and `deleteUser` methods to storage interface
  - Implemented GET /api/users, PATCH /api/users/:id, DELETE /api/users/:id API routes
  - Added Zod validation schema (`updateUserSchema`) for user updates
  - Implemented conflict detection for duplicate salesRepNumber assignments (returns 409 with clear error message)
  - Added delete protection to prevent removing the last admin
- **Database Schema Enhancement**:
  - Added unique constraint on `salesRepNumber` column to enforce league size limit at database level
  - Prevents duplicate assignments through application-level and database-level checks
- **Auto-Assignment System**:
  - Modified `replitAuth.ts` upsertUser to automatically assign new users to available slots 1-10
  - Sets `salesRepNumber` to null if all 10 slots are filled (waitlist)
  - Uses deterministic assignment: finds lowest available number
- **Waitlist Notification**:
  - Added Alert component to matchups page when `user.salesRepNumber === null`
  - Displays clear message directing users to contact admin for activation
- **Admin User Management UI** (New "Users" tab in Admin page):
  - Sales rep number availability legend (1-10) showing taken/available spots
  - Waitlist panel showing users with null salesRepNumber
  - Users table with avatar, name, email, role, sales rep #, status, and actions
  - Edit dialog for updating role (employee/admin/cio) and sales rep assignment
  - Frontend prevents selecting already-assigned numbers (disabled in dropdown)
  - Delete confirmation dialog with warning about data loss
  - Toast notifications for success/error feedback
- **Admin Tab Styling**:
  - Styled Admin menu item in sidebar with black background and white text
  - Dark mode compatible (inverts to white background with black text)
  - Visually distinct from other navigation items
- **Role Update**:
  - Changed Bowen Oswald (bowenbarry19@gmail.com) role to admin in database

### November 10, 2025 - Season Structure Changes & Enhanced Matchup Page
- **Season Structure Update**: Changed from 10 regular + 4 playoff to 9 regular + 3 playoff weeks (total 12 weeks)
  - Regular season: Weeks 1-9
  - Playoffs: Weeks 10-12
  - Updated playoff bracket logic for weeks 10-12 (was 11-13)
  - Week 10: Quarterfinals (Seeds 3v6, 4v5) with byes for Seeds 1-2
  - Week 11: Semifinals (1 vs Winner(3v6), 2 vs Winner(4v5))
  - Week 12: Championship Final
- **Matchup Generation**: Generated round-robin matchups for weeks 2-9 using circle method
  - All 10 users face each other exactly once during regular season
  - No byes needed with even number of players
- **League Page Updates**:
  - Week selector limited to 12 weeks
  - Playoff bracket visualization updated for weeks 10-12
  - Bold current week in dropdown
- **Matchup Page Enhancements**:
  - Week selector limited to 12 weeks with bold current week indicator
  - KPI submission section only shown on current week
  - Changed title to "Submit/Edit KPI Data"
  - Pre-populated all 4 KPIs with existing values or zeros for current week
  - Changed submit button text to "Submit These KPI Adjustments"
  - Individual KPI scores now show converted points in bold (e.g., "4.0 pts") instead of raw values
  - Added collapsible "How the score is calculated" explanation
- **Navigation Cleanup**: Removed Dashboard page, route, and sidebar link
- **Routing Fix**: Added `/matchups` route alongside root `/` route for better accessibility
- **Testing & Validation**: 
  - Completed end-to-end testing with OIDC authentication
  - Verified all playoff empty state messaging references weeks 10-12 (no Week 13 references)
  - Confirmed matchup page displays KPI breakdown with converted points
- **Database**: Confirmed 10 active sales reps after removing test users

### Earlier - Playoff System & Scoring Updates
- **Scoring System Overhaul**: Replaced weighted normalization with simple point-based conversion (300 GP=1pt, 3000 revenue=1pt, 3 leads=1pt, 1 deal=1pt)
- **Database Cleanup**: Removed 3 John Doe test users, confirmed exactly 10 active sales reps
- **Accessibility**: Fixed duplicate H1 element issue in app header

### Earlier Changes
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
- Added sales rep numbers to user profiles
- Loaded Week 1 performance data for 9 sales reps from external data source
- Implemented deterministic round-robin matchup generation using circle method
- Built League page for browsing all matchups with week filtering
- Added matchup overwrite functionality (delete-before-insert)
- Added recalculate endpoint for admin score refresh
