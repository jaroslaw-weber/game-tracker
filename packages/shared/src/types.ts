export enum GameStatus {
  WISHLIST = 'WISHLIST',
  BACKLOG = 'BACKLOG',
  PLAYING = 'PLAYING',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED'
}

export enum MediaType {
  TRAILER = 'TRAILER',
  GAMEPLAY = 'GAMEPLAY',
  IMAGE = 'IMAGE'
}

export interface Game {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  tags: string[];
  media: Media[];
}

export interface Media {
  id: string;
  gameId: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
}

export interface GameEntry {
  id: string;
  userId: string;
  gameId: string;
  game: Game;
  status: GameStatus;
  progress: number;
  rating?: number;
}

export interface User {
  id: string;
  name: string;
  username: string;
  entries: GameEntry[];
}

export interface AuthPayload {
  token: string;
  user: User;
}
