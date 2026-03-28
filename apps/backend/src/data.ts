import { Game, GameEntry, Media, User, GameStatus, MediaType } from '@game-tracker/shared';

// In-memory data store
class DataStore {
  private games: Map<string, Game> = new Map();
  private entries: Map<string, GameEntry> = new Map();
  private media: Map<string, Media> = new Map();
  private users: Map<string, User> = new Map();

  constructor() {
    // Seed with initial data
    this.seedData();
  }

  private seedData() {
    // Create a mock user
    const user: User = {
      id: 'user-1',
      name: 'Player One',
      entries: []
    };
    this.users.set(user.id, user);

    // Create some games
    const games: Game[] = [
      {
        id: 'game-1',
        title: 'Hollow Knight',
        description: 'A challenging action-adventure through a vast, interconnected world of insects and heroes.',
        coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1rgi.webp',
        tags: ['metroidvania', 'challenging', 'atmospheric', 'indie'],
        media: []
      },
      {
        id: 'game-2',
        title: 'Stardew Valley',
        description: 'A farming simulation game where you inherit your grandfather\'s farm and start a new life.',
        coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1mxf.webp',
        tags: ['cozy', 'farming', 'simulation', 'multiplayer'],
        media: []
      },
      {
        id: 'game-3',
        title: 'Elden Ring',
        description: 'An action RPG set in a vast, dark fantasy world created by Hidetaka Miyazaki and George R.R. Martin.',
        coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.webp',
        tags: ['souls-like', 'challenging', 'open-world', 'rpg'],
        media: []
      },
      {
        id: 'game-4',
        title: 'Celeste',
        description: 'A platformer about climbing a mountain and dealing with personal struggles.',
        coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1n6w.webp',
        tags: ['platformer', 'challenging', 'story-rich', 'pixel-art'],
        media: []
      }
    ];

    games.forEach(game => {
      this.games.set(game.id, game);
      
      // Add some media for each game
      const mediaItems: Media[] = [
        {
          id: `media-${game.id}-1`,
          gameId: game.id,
          type: MediaType.TRAILER,
          url: 'https://www.youtube.com/embed/sample-trailer',
          thumbnailUrl: game.coverUrl
        },
        {
          id: `media-${game.id}-2`,
          gameId: game.id,
          type: MediaType.GAMEPLAY,
          url: 'https://www.youtube.com/embed/sample-gameplay',
          thumbnailUrl: game.coverUrl
        },
        {
          id: `media-${game.id}-3`,
          gameId: game.id,
          type: MediaType.IMAGE,
          url: game.coverUrl,
          thumbnailUrl: game.coverUrl
        }
      ];

      mediaItems.forEach(media => {
        this.media.set(media.id, media);
        game.media.push(media);
      });
    });

    // Create some entries for the user
    const entries: GameEntry[] = [
      {
        id: 'entry-1',
        userId: 'user-1',
        gameId: 'game-1',
        game: this.games.get('game-1')!,
        status: GameStatus.PLAYING,
        progress: 45,
        rating: undefined
      },
      {
        id: 'entry-2',
        userId: 'user-1',
        gameId: 'game-2',
        game: this.games.get('game-2')!,
        status: GameStatus.COMPLETED,
        progress: 100,
        rating: 9
      },
      {
        id: 'entry-3',
        userId: 'user-1',
        gameId: 'game-3',
        game: this.games.get('game-3')!,
        status: GameStatus.BACKLOG,
        progress: 0,
        rating: undefined
      },
      {
        id: 'entry-4',
        userId: 'user-1',
        gameId: 'game-4',
        game: this.games.get('game-4')!,
        status: GameStatus.WISHLIST,
        progress: 0,
        rating: undefined
      }
    ];

    entries.forEach(entry => {
      this.entries.set(entry.id, entry);
      user.entries.push(entry);
    });
  }

  // Games
  getGames(): Game[] {
    return Array.from(this.games.values());
  }

  getGame(id: string): Game | undefined {
    return this.games.get(id);
  }

  addGame(game: Game): Game {
    this.games.set(game.id, game);
    return game;
  }

  // Media
  getMediaByGame(gameId: string, type?: MediaType): Media[] {
    const game = this.games.get(gameId);
    if (!game) return [];
    
    if (type) {
      return game.media.filter(m => m.type === type);
    }
    return game.media;
  }

  addMedia(media: Media): Media {
    this.media.set(media.id, media);
    const game = this.games.get(media.gameId);
    if (game) {
      game.media.push(media);
    }
    return media;
  }

  // Entries
  getEntries(userId: string): GameEntry[] {
    return Array.from(this.entries.values()).filter(e => e.userId === userId);
  }

  getEntry(id: string): GameEntry | undefined {
    return this.entries.get(id);
  }

  addEntry(entry: GameEntry): GameEntry {
    this.entries.set(entry.id, entry);
    const user = this.users.get(entry.userId);
    if (user) {
      user.entries.push(entry);
    }
    return entry;
  }

  updateEntry(id: string, updates: Partial<GameEntry>): GameEntry | undefined {
    const entry = this.entries.get(id);
    if (!entry) return undefined;

    const updated = { ...entry, ...updates };
    this.entries.set(id, updated);

    // Update user's entries array
    const user = this.users.get(entry.userId);
    if (user) {
      const index = user.entries.findIndex(e => e.id === id);
      if (index !== -1) {
        user.entries[index] = updated;
      }
    }

    return updated;
  }

  deleteEntry(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;

    this.entries.delete(id);

    // Remove from user's entries
    const user = this.users.get(entry.userId);
    if (user) {
      user.entries = user.entries.filter(e => e.id !== id);
    }

    return true;
  }

  // Users
  getUser(id: string): User | undefined {
    return this.users.get(id);
  }
}

export const dataStore = new DataStore();
