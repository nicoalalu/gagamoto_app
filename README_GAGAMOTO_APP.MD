# 🟡 Gagamoto Manager

## 📌 Project Overview

Gagamoto Manager is a private web application designed to manage all operational and statistical aspects of an amateur football team.

The application centralizes:

- Match scheduling
- Attendance management
- Match results
- Goals and cards tracking
- MVP voting system
- Player rating system
- Historical and aggregated statistics

The system is intended exclusively for internal team use.

---

# 🎯 Core Objectives

1. Provide a single source of truth for match data.
2. Enable players to confirm attendance.
3. Record historical performance data.
4. Implement structured MVP and rating systems.
5. Maintain simple, low-cost, serverless architecture.

---

# 🔐 Authentication & Access Model

- Google OAuth authentication.
- Only whitelisted email addresses can access the system.
- All authenticated users have full permissions (no role separation).
- The system is private and not publicly accessible.

---

# 🏠 Main Features

## 1️⃣ Match Management

Users can:

- Create matches (date + opponent).
- Edit future matches.
- Add match results (only if match date < current date).
- Register goals per player.
- Register yellow/red cards.

---

## 2️⃣ Attendance System

For each match:

- Players can confirm attendance.
- Players can decline attendance (mandatory justification required).
- Attendance can be modified for future matches.

---

## 3️⃣ MVP Voting System

### Rules

- Activated when a match has a result recorded.
- Voting window: 24 hours after match date.
- Each player:
  - Can vote for exactly one teammate.
  - Cannot vote for themselves.
- After 24 hours:
  - Voting closes automatically.
  - The most voted player is declared MVP.
  - The MVP result is persisted.

Tie resolution strategy: TBD (either allow ties or first-vote priority).

---

## 4️⃣ Player Rating System

During the same 24-hour voting window:

- Each player may rate teammates.
- Rating scale: 1–10.
- Self-rating is not allowed.
- Ratings are optional.
- After 24 hours:
  - Rating submission closes.
  - Average rating per player for that match is calculated and stored.

---

## 5️⃣ Statistics Module

### Team-Level Statistics

- Total matches played
- Wins / Draws / Losses
- Historical results
- Future fixtures
- Current league position (manual or computed)

### Player-Level Statistics

- Total goals
- Total assists
- Yellow cards
- Red cards
- MVP awards won
- Historical average rating
- Per-match ratings

---

# 🧠 Business Rules

- Users must be authenticated.
- No actions allowed outside MVP/rating time window.
- Self-voting and self-rating are forbidden.
- Only past matches can receive results.
- Attendance justification is mandatory when declining.

---

# 🗄 Data Model (Conceptual)

### users
- id
- name
- email
- image
- created_at

### matches
- id
- date
- opponent
- goals_for
- goals_against
- created_at

### attendance
- id
- match_id
- user_id
- status (yes/no)
- excuse (nullable)
- updated_at

### goals
- id
- match_id
- user_id

### cards
- id
- match_id
- user_id
- type (yellow/red)

### votes_mvp
- id
- match_id
- voter_id
- voted_user_id
- unique(match_id, voter_id)

### ratings
- id
- match_id
- rater_id
- rated_user_id
- score (1–10)
- unique(match_id, rater_id, rated_user_id)

---

# ⏱ Temporal Logic

For each match:

voting_deadline = match_date + 24 hours

- If current_time <= voting_deadline → voting/rating enabled.
- If current_time > voting_deadline → voting/rating disabled.
- MVP and rating averages must be computed once and persisted.

No cron jobs required for MVP version.

---

# 🏗 Technical Architecture (MVP)

- Frontend + Backend: Next.js (App Router)
- Auth: NextAuth (Google Provider)
- Database: PostgreSQL (Supabase or Neon)
- Hosting: Vercel
- Deployment: GitHub → Automatic Vercel CI/CD

Architecture:

User → Next.js (Vercel Serverless) → PostgreSQL

---

# 🚫 Non-Goals (MVP)

- Public access
- Multi-team support
- Complex role management
- Real-time updates
- Advanced analytics
- Payment systems

---

# 🔮 Future Extensions (Optional)

- Seasonal ranking
- Player performance trends
- Auto-generated league table
- Push notifications
- Match reports
- API for Instagram integration

---

# 📊 Complexity Level

Medium.

Includes:
- OAuth authentication
- Temporal constraints
- Relational integrity
- Aggregation logic
- Stateful voting windows

Designed to remain lightweight and maintainable.

---

# 🧩 Intended Usage

This document provides structured context for:

- AI agents generating code
- Developers implementing the MVP
- Architecture reasoning
- Database schema creation
- API route design