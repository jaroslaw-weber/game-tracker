import { dataStore } from './data';
import { GameStatus, MediaType } from '@game-tracker/shared';

export const resolvers = {
  Query: {
    games: () => dataStore.getGames(),
    game: (_: unknown, { id }: { id: string }) => dataStore.getGame(id),
    entries: (_: unknown, { userId }: { userId: string }) => dataStore.getEntries(userId),
    entry: (_: unknown, { id }: { id: string }) => dataStore.getEntry(id),
    user: (_: unknown, { id }: { id: string }) => dataStore.getUser(id),
  },

  Mutation: {
    addGame: (_: unknown, { title, description, coverUrl, tags }: { 
      title: string; 
      description: string; 
      coverUrl: string; 
      tags: string[];
    }) => {
      const game = {
        id: `game-${Date.now()}`,
        title,
        description,
        coverUrl,
        tags,
        media: []
      };
      return dataStore.addGame(game);
    },

    addMedia: (_: unknown, { gameId, type, url, thumbnailUrl }: {
      gameId: string;
      type: string;
      url: string;
      thumbnailUrl?: string;
    }) => {
      const media = {
        id: `media-${Date.now()}`,
        gameId,
        type: type as MediaType,
        url,
        thumbnailUrl
      };
      return dataStore.addMedia(media);
    },

    addEntry: (_: unknown, { userId, gameId, status, progress = 0, rating }: {
      userId: string;
      gameId: string;
      status: string;
      progress?: number;
      rating?: number;
    }) => {
      const game = dataStore.getGame(gameId);
      if (!game) throw new Error('Game not found');

      const entry = {
        id: `entry-${Date.now()}`,
        userId,
        gameId,
        game,
        status: status as GameStatus,
        progress,
        rating
      };
      return dataStore.addEntry(entry);
    },

    updateEntry: (_: unknown, { id, status, progress, rating }: {
      id: string;
      status?: string;
      progress?: number;
      rating?: number;
    }) => {
      const updates: { status?: GameStatus; progress?: number; rating?: number } = {};
      if (status) updates.status = status as GameStatus;
      if (progress !== undefined) updates.progress = progress;
      if (rating !== undefined) updates.rating = rating;

      const entry = dataStore.updateEntry(id, updates);
      if (!entry) throw new Error('Entry not found');
      return entry;
    },

    deleteEntry: (_: unknown, { id }: { id: string }) => {
      return dataStore.deleteEntry(id);
    }
  },

  Game: {
    media: (parent: { id: string; media: { type: string }[] }, { type }: { type?: string }) => {
      if (type) {
        return parent.media.filter((m: { type: string }) => m.type === type);
      }
      return parent.media;
    }
  },

  GameEntry: {
    game: (parent: { gameId: string }) => dataStore.getGame(parent.gameId)
  }
};
