import { dataStore } from './data';
import { GameStatus, MediaType } from '@game-tracker/shared';

export const resolvers = {
  Query: {
    games: () => dataStore.getGames(),
    game: (_: unknown, { id }: { id: string }) => dataStore.getGame(id),
    entries: (_: unknown, { userId }: { userId: string }) => dataStore.getEntries(userId),
    entry: (_: unknown, { id }: { id: string }) => dataStore.getEntry(id),
    user: (_: unknown, { id }: { id: string }) => dataStore.getUser(id),
    me: (_: unknown, __: unknown, context: { userId?: string }) => {
      if (!context.userId) throw new Error('Not authenticated');
      return dataStore.getUser(context.userId);
    },
  },

  Mutation: {
    register: async (_: unknown, { name, username, password }: { 
      name: string; 
      username: string; 
      password: string;
    }) => {
      return dataStore.register(name, username, password);
    },

    login: async (_: unknown, { username, password }: { 
      username: string; 
      password: string;
    }) => {
      return dataStore.login(username, password);
    },

    addGame: (_: unknown, { title, description, coverUrl, tags }: { 
      title: string; 
      description: string; 
      coverUrl: string; 
      tags: string[];
    }) => {
      const game = {
        title,
        description,
        coverUrl,
        tags,
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
      const entry = {
        userId,
        gameId,
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
