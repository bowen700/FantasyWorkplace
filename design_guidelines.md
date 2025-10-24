# Fantasy Workplace - Design Guidelines

## Design Approach: Reference-Based (Gamified Data Platform)

**Primary Inspiration Sources:**
- **ESPN Fantasy Sports** - Matchup cards, head-to-head layouts, playoff brackets
- **Linear** - Clean data presentation, sophisticated typography, modern dashboard aesthetics
- **Duolingo** - Achievement badges, progress indicators, motivational UI patterns
- **Stripe Dashboard** - Professional data tables, clear hierarchy, restrained use of color

**Core Design Principle:** Balance workplace professionalism with fantasy sports excitement. Create a system that feels legitimate for performance tracking while making data engaging and competitive.

## Typography System

**Font Families (via Google Fonts):**
- **Primary (UI/Data):** Inter - Clean, highly legible for tables and dashboards
- **Display (Headers/Scores):** Space Grotesk - Bold, sporty character for matchup results and leaderboard standings

**Type Scale:**
- Hero numbers (scores): text-6xl to text-8xl, font-bold
- Section headers: text-3xl to text-4xl, font-semibold
- Card titles: text-xl, font-semibold
- Body text: text-base, font-normal
- Data labels: text-sm, font-medium
- Metadata/timestamps: text-xs, font-normal

## Layout & Spacing System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, and 8 as foundational spacing (p-2, m-4, gap-6, h-8)

**Grid Layouts:**
- Dashboard cards: 3-column grid on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Matchup displays: 2-column comparison layout (grid-cols-2)
- Leaderboard: Full-width single column with responsive table
- Admin KPI panel: 2-column form layout (grid-cols-1 lg:grid-cols-2)

**Container Strategy:**
- App shell: Fixed sidebar (w-64) + main content area (flex-1)
- Content max-width: max-w-7xl for wide dashboards, max-w-4xl for forms
- Card padding: p-6 for standard cards, p-8 for feature sections

## Component Library

### Navigation
**Sidebar Navigation (Fixed Left):**
- Full-height sidebar with logo at top
- Navigation items with icons (trophy, chart-bar, upload, settings)
- Role indicator badge (Admin/Employee/CIO)
- Current season week counter at bottom
- Active state: subtle background highlight

**Top Bar:**
- User profile dropdown (right-aligned)
- Notification bell with badge count
- Quick season stats (W-L record)

### Dashboard Components

**Matchup Card (Head-to-Head):**
- Two-column layout with VS badge in center
- Player avatars/initials in circles
- Fantasy scores displayed prominently (large, bold)
- KPI breakdown table below
- Win/loss indicator ribbon
- "View Details" link

**Leaderboard Table:**
- Sticky header row
- Rank badge column (gold/silver/bronze for top 3)
- Player name with avatar
- Win-Loss record
- Total points
- Trend indicator (up/down arrows)
- Expandable rows for KPI details
- Playoff qualification indicator

**KPI Score Cards:**
- Icon representing KPI category
- Large number display for current value
- Comparison to previous week (percentage change)
- Mini sparkline chart showing trend
- Badge for meeting/exceeding targets

**Analytics Dashboard:**
- Chart.js integration for: Line charts (KPI trends over season), bar charts (weekly comparisons), radar charts (multi-KPI performance)
- Time period selector (Week, Season, All-time)
- Export data button

### Admin Panels

**KPI Configuration Panel:**
- Drag-and-drop KPI reordering interface
- Toggle switches for active/inactive KPIs
- Weight slider for each KPI (0-100%)
- Add new KPI modal form
- Preview of score calculation formula

**Matchup Scheduler:**
- Calendar view of season weeks
- Auto-generate matchups button
- Manual override drag-and-drop
- Bye week assignments
- Playoff bracket builder

### Data Upload Interface
- Drag-and-drop file upload zone (dashed border, large target area)
- Manual entry table with inline editing
- CSV/JSON template download links
- Validation feedback inline
- Bulk upload progress indicator

### Gamification Elements

**Badge Display:**
- Circular badge icons with metallic gradients
- Badge gallery grid (unlocked vs locked state)
- Achievement description tooltip on hover
- Recent badges carousel

**Progress Indicators:**
- Circular progress rings for season completion
- Linear progress bars for weekly KPIs
- Level/tier indicators with visual milestones

**AI Coach Panel:**
- Chat-style interface for AI suggestions
- Message bubbles with AI insights
- Action buttons to implement suggestions
- Conversation history

### Forms & Inputs
- Input fields with floating labels
- Dropdown selects with search functionality
- Date pickers for season configuration
- Toggle switches for boolean settings
- Multi-select for KPI assignment
- Form validation with inline error states

### Playoff Bracket
- Single-elimination tournament tree
- Seed numbers for each matchup
- Score display for completed matches
- TBD placeholders for future rounds
- Championship trophy icon at finals

## Animation Strategy

**Minimal, Purpose-Driven Animations:**
- Score counter animations when matchup results load (number count-up)
- Smooth transitions for tab switching and modal overlays (duration-200)
- Hover lift effect on cards (transform scale-105)
- Progress bar fills when data loads
- Badge unlock celebration (brief scale/glow effect)

**Avoid:** Scroll-triggered animations, complex page transitions, decorative motion

## Images & Visual Assets

**Icon Library:** Heroicons via CDN (outline style for navigation, solid style for badges/actions)

**Image Requirements:**

1. **Hero Section (Landing/Welcome Dashboard):**
   - Sports-themed abstract illustration or photo
   - Depicts team collaboration with competitive energy
   - Trophy, charts, or scoreboard elements subtly integrated
   - Placement: Top of main dashboard, full-width hero (h-96)
   - Overlay: Semi-transparent gradient for text legibility

2. **Empty States:**
   - "No matchups scheduled" - Calendar/trophy illustration
   - "No data uploaded" - Upload cloud icon illustration
   - "Season not started" - Countdown clock illustration

3. **User Avatars:**
   - Placeholder: Circular initials with unique background per user
   - Support for uploaded profile photos (optional)

4. **Badge Icons:**
   - Vector graphics for achievements (trophy variants, star levels, milestone markers)
   - Gold, silver, bronze metallic treatments
   - Categories: Performance, Consistency, Comeback, Dominance

5. **AI Coach Avatar:**
   - Friendly robot or coaching whistle icon
   - Circular frame, positioned in chat interface

**Image Placement Strategy:**
- Hero: Welcome dashboard only, not repeated throughout app
- Avatars: Everywhere user identity appears (leaderboard, matchups, profiles)
- Badges: Achievement gallery, profile pages, notification toasts
- Empty states: Center of empty content areas
- AI Coach: Left side of chat messages

This comprehensive design system creates a professional yet engaging gamified experience that motivates employees while maintaining workplace appropriateness.