# Game Tracker

A full-stack GraphQL app for tracking games and deciding what to play next.

## Core Concept

**Media-first game wishlist & backlog tracker** - helps users visually explore their game library and decide what to play next.

### Key Features

- 🎮 **Game Management**: Track games with status (Wishlist, Backlog, Playing, Completed, Dropped), progress %, and ratings
- 🎥 **Media-First UI**: Browse games with trailers, gameplay clips, and screenshots
- 🏷 **Tagging**: Filter games by tags (e.g., "cozy", "challenging", "multiplayer")
- 🔐 **Authentication**: Secure login/register with JWT tokens

## Tech Stack

- **Runtime**: Bun
- **Backend**: Apollo Server, GraphQL, SQLite (bun:sqlite)
- **Frontend**: Astro, React, Apollo Client
- **Authentication**: bcryptjs, jsonwebtoken

## Project Structure

```
game-tracker/
├── apps/
│   ├── backend/          # Apollo Server + GraphQL + SQLite
│   └── frontend/         # Astro + React + Apollo Client
├── packages/
│   └── shared/           # Shared types and GraphQL schema
└── package.json          # Bun workspace configuration
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed

### Installation

```bash
# Install dependencies
bun install

# Set up environment variables
cd apps/backend
cp .env.example .env
# Edit .env and set a secure JWT_SECRET

# Build shared package
cd ../../packages/shared
bun run build

# Start development servers (from root)
cd ../..
bun run dev
```

This starts:
- Backend: http://localhost:4000 (GraphQL Playground)
- Frontend: http://localhost:3000

## Demo Credentials

- Username: `player1`
- Password: `password123`

## Scripts

- `bun run dev` - Start all dev servers
- `bun run dev:backend` - Start backend only
- `bun run dev:frontend` - Start frontend only
- `bun run build` - Build all packages
- `bun run typecheck` - Run TypeScript checks

## GraphQL Example

```graphql
# Login
mutation {
  login(username: "player1", password: "password123") {
    token
    user { id name }
  }
}

# Get entries
query {
  entries(userId: "user-1") {
    id
    status
    progress
    game { title coverUrl }
  }
}
```
