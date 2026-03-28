# game-tracker
my example graphql project for tracking and wishlisting games locally

---

## Project Concept: Media-First Game Wishlist & "What to Play Next" App

### 1. Overview

This is a **full-stack web app** that helps users:

* track games they've played
* manage a wishlist / backlog
* **decide what to play next**

The core differentiator:
**media-first browsing (trailers, gameplay, images)**
**decision-focused UX (not just tracking)**

Instead of just listing games, the app helps users **visually compare games** and choose their next one.

---

### 2. Core Value Proposition

Most trackers (like backlog apps) focus on:

* storing lists
* tracking completion

This app focuses on:

* **decision making**
* **visual discovery**
* **reducing choice paralysis**

> "I have 50 games. What should I play next?"

---

### 3. Key Features

#### Game Management

* Add game to:

  * Wishlist
  * Backlog
  * Playing
  * Completed
* Track:

  * progress (%)
  * rating
  * play status

---

#### Media-First UI (Main Feature)

Each game has 3 viewing modes:

* **Trailer mode**

  * shows official trailers (YouTube embeds)

* **Gameplay mode**

  * shows raw gameplay clips

* **Image mode**

  * shows screenshots (carousel/grid)

Users can switch modes globally or per game.

---

#### "What to Play Next" Focus

Special UX for decision making:

* shortlist / "consider next" state
* compare games visually
* filter by:

  * tags (e.g. "short", "relaxing", "story-rich")
  * platform
  * estimated time (later)
* sort by:

  * last updated
  * rating
  * progress

---

#### Tags & Discovery

* predefined or user-generated tags
* examples:

  * "cozy"
  * "grindy"
  * "story heavy"
  * "multiplayer"

Used for filtering and narrowing choices.

---

#### User Tracking

* personal game entries
* stats:

  * total games
  * completed
  * backlog
  * wishlist

---

### 4. Core UX Flow

#### Flow 1: Add & Track

1. User searches game
2. Adds to wishlist
3. Later moves to:

   * backlog → playing → completed

---

#### Flow 2: Decide What to Play

1. User opens backlog
2. switches media mode (trailer/gameplay/images)
3. browses visually
4. filters by tags/platform
5. picks one → sets to "playing"

---

#### Flow 3: Track Progress

1. update progress %
2. optionally rate
3. mark completed

---

### 5. GraphQL Design Philosophy

GraphQL is used because:

* frontend needs **different data per mode**
* avoids overfetching media
* enables flexible UI

#### Example:

**Image mode query**

```graphql
games {
  id
  title
  coverUrl
  media(type: IMAGE) {
    url
  }
}
```

**Trailer mode query**

```graphql
games {
  id
  title
  media(type: TRAILER) {
    url
  }
}
```

---

### 6. Data Model (Simplified)

#### Game

* id
* title
* description
* coverUrl
* tags

#### Media

* id
* gameId
* type: TRAILER | GAMEPLAY | IMAGE
* url
* thumbnailUrl

#### GameEntry (core table)

* id
* userId
* gameId
* status:

  * WISHLIST
  * BACKLOG
  * PLAYING
  * COMPLETED
  * DROPPED
* progress
* rating

#### Tag

* id
* name

---

### 7. Tech Stack

#### Backend

* Node.js + TypeScript
* Apollo Server (GraphQL)
* Prisma + PostgreSQL

#### Frontend

* React + TypeScript
* Apollo Client
* Tailwind

---

### 8. Key Learning Goals

This project is designed to learn:

#### GraphQL

* schema design
* resolvers
* nested relationships
* filtering & arguments
* enums
* media-based queries

#### Apollo Client

* queries & mutations
* cache updates
* fragments
* UI state handling

#### Full-stack TypeScript

* shared types mindset
* end-to-end data safety

---

### 9. MVP Scope

Keep it small:

* add game
* change status
* 3 media modes
* basic filtering
* simple UI (grid + details page)

No auth needed at first (mock user is fine).

---

### 10. Possible Extensions

* "compare games" view
* recommendation system
* time-to-beat integration
* friend activity
* AI "what should I play next?" assistant

---

### 11. One-line Summary

> A media-first game tracker that helps users visually explore their backlog and decide what to play next.

