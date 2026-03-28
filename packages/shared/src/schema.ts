export const typeDefs = `
  enum GameStatus {
    WISHLIST
    BACKLOG
    PLAYING
    COMPLETED
    DROPPED
  }

  enum MediaType {
    TRAILER
    GAMEPLAY
    IMAGE
  }

  type Game {
    id: ID!
    title: String!
    description: String!
    coverUrl: String!
    tags: [String!]!
    media(type: MediaType): [Media!]!
  }

  type Media {
    id: ID!
    gameId: ID!
    type: MediaType!
    url: String!
    thumbnailUrl: String
  }

  type GameEntry {
    id: ID!
    userId: ID!
    gameId: ID!
    game: Game!
    status: GameStatus!
    progress: Int!
    rating: Int
  }

  type User {
    id: ID!
    name: String!
    username: String!
    entries: [GameEntry!]!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    games: [Game!]!
    game(id: ID!): Game
    entries(userId: ID!): [GameEntry!]!
    entry(id: ID!): GameEntry
    user(id: ID!): User
    me: User
  }

  type Mutation {
    register(
      name: String!
      username: String!
      password: String!
    ): AuthPayload!

    login(
      username: String!
      password: String!
    ): AuthPayload!

    addGame(
      title: String!
      description: String!
      coverUrl: String!
      tags: [String!]!
    ): Game!
    
    addMedia(
      gameId: ID!
      type: MediaType!
      url: String!
      thumbnailUrl: String
    ): Media!
    
    addEntry(
      userId: ID!
      gameId: ID!
      status: GameStatus!
      progress: Int
      rating: Int
    ): GameEntry!
    
    updateEntry(
      id: ID!
      status: GameStatus
      progress: Int
      rating: Int
    ): GameEntry!
    
    deleteEntry(id: ID!): Boolean!
  }
`;
