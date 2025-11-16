# Fantasy Workplace - Gamified Performance Management

## Overview
Fantasy Workplace is a gamified performance management platform designed to transform employee KPI tracking into an engaging, fantasy sports-style competition. Its primary purpose is to boost employee motivation, engagement, and performance through friendly rivalry, achievement recognition, and personalized AI coaching. Key capabilities include weekly head-to-head matchups, achievement badges, a dynamic leaderboard, and playoff tournaments. The platform aims to revolutionize traditional performance reviews by making goal achievement an interactive and rewarding experience, fostering a more collaborative and high-performing workplace culture.

## User Preferences
I prefer an iterative development approach, focusing on delivering core features and then refining them based on feedback. Please ask before making significant architectural changes or introducing new libraries. When implementing features, prioritize maintainability and readability. I appreciate clear, concise explanations of technical decisions. Do not make changes to the `shared/schema.ts` file without explicit instruction.

## System Architecture

### UI/UX Decisions
The frontend is built with React and TypeScript, utilizing TailwindCSS for utility-first styling and Shadcn UI for pre-built, accessible components. Wouter is used for routing, and TanStack Query manages data fetching and caching. The design system incorporates Inter for UI and data typography, and Space Grotesk for display and scores, ensuring a modern and clean aesthetic.

### Technical Implementations
- **Frontend**: React + TypeScript, TailwindCSS, Shadcn UI, Wouter, TanStack Query.
- **Backend**: Express.js with Node.js.
- **Database**: PostgreSQL (Neon) with Drizzle ORM for type-safe database interactions.
- **Authentication**: Replit Auth (OpenID Connect) for secure user authentication, managed via PostgreSQL-backed Express sessions.
- **AI Integration**: OpenAI GPT-5 powers the AI Coach feature for personalized feedback.

### Feature Specifications
- **Weekly Matchups**: Implements a deterministic round-robin pairing system (circle method). Features normalized and weighted KPI scoring with edge case handling, automatic winner determination, win/loss tracking, and playoff qualification. Admin can regenerate specific weeks.
- **KPI Management (Admin)**: Allows creation, editing, deletion, weight adjustment, activation toggle, and reordering of KPIs.
- **Data Upload**: Supports manual entry and CSV file uploads with downloadable templates and automatic score calculation.
- **Leaderboard**: Provides real-time rankings, win-loss records, total points, and playoff indicators.
- **Badges & Achievements**: Offers various achievement categories (Performance, Consistency, Comeback, Dominance), a visual gallery, and progress tracking.
- **AI Coach**: Delivers personalized, context-aware KPI feedback, performance analysis, and motivational insights using GPT-5.
- **Admin Access Model**: Implements a password-based admin access system (`accessgranted!`) for authenticated users, with server-side `requireAdminPassword` middleware for security. Admin access flags are cleared on logout or profile switch.
- **User Management**: Admin can manage user roles (employee, admin, cio), assign sales rep numbers (1-10), and manage user profiles, including creation and deletion with cascade effects.
- **Scoring System**: Uses a point-based conversion for KPIs (e.g., 300 GP = 1 point, 3,000 revenue = 1 point, 3 leads = 1 point, 1 deal = 1 point).
- **Season Structure**: Configured for a 12-week season (9 regular, 3 playoff), with updated playoff bracket logic (Quarterfinals, Semifinals, Championship).

### System Design Choices
- **Modular Project Structure**: Separates frontend (`client/`), backend (`server/`), and shared database schema (`shared/`) for maintainability.
- **API Endpoints**: Comprehensive API for Auth, Seasons, KPIs, KPI Data, Matchups, Leaderboard, Badges, and AI Coach.
- **Database Schema**: Defines core entities like users, seasons, kpis, kpiData, matchups, badges, userBadges, aiCoachConversations, and sessions.
- **Environment Variables**: Essential configuration managed via environment variables (e.g., `DATABASE_URL`, `OPENAI_API_KEY`, `SESSION_SECRET`).

## External Dependencies
- **Database**: PostgreSQL (specifically Neon for serverless PostgreSQL).
- **ORM**: Drizzle ORM.
- **Authentication**: Replit Auth (OpenID Connect).
- **AI Service**: OpenAI GPT-5.
- **Frontend Libraries**: React, TypeScript, TailwindCSS, Shadcn UI, Wouter, TanStack Query.
- **Backend Libraries**: Express.js, Node.js.