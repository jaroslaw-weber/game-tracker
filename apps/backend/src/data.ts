import Database from 'better-sqlite3';
import { Game, GameEntry, Media, User, GameStatus, MediaType, AuthPayload } from '@game-tracker/shared';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// SQLite data store
class DataStore {
  private db: Database.Database;

  constructor() {
    this.db = new Database('game-tracker.db');
    this.initDatabase();
    this.seedData();
  }

  private initDatabase() {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        coverUrl TEXT NOT NULL,
        tags TEXT NOT NULL -- JSON array
      );

      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY,
        gameId TEXT NOT NULL,
        type TEXT NOT NULL,
        url TEXT NOT NULL,
        thumbnailUrl TEXT,
        FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS entries (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        gameId TEXT NOT NULL,
        status TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        rating INTEGER,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE
      );
    `);
  }

  private seedData() {
    // Check if we already have data
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (userCount.count > 0) return;

    // Create a mock user with hashed password (password: "password123")
    const userId = 'user-1';
    const passwordHash = bcrypt.hashSync('password123', SALT_ROUNDS);
    this.db.prepare('INSERT INTO users (id, name, username, passwordHash) VALUES (?, ?, ?, ?)')
      .run(userId, 'Player One', 'player1', passwordHash);

    // Create some games
    const games = [
      {
        id: 'game-1',
        title: 'Hollow Knight',
        description: 'A challenging action-adventure through a vast, interconnected world of insects and heroes.',
        coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1rgi.webp',
        tags: JSON.stringify(['metroidvania', 'challenging', 'atmospheric', 'indie'])
      },
      {
        id: 'game-2',
        title: 'Stardew Valley',
        description: 'A farming simulation game where you inherit your grandfather\'s farm and start a new life.',
        coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1mxf.webp',
        tags: JSON.stringify(['cozy', 'farming', 'simulation', 'multiplayer'])
      },
      {
        id: 'game-3',
        title: 'Elden Ring',
        description: 'An action RPG set in a vast, dark fantasy world created by Hidetaka Miyazaki and George R.R. Martin.',
        coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.webp',
        tags: JSON.stringify(['souls-like', 'challenging', 'open-world', 'rpg'])
      },
      {
        id: 'game-4',
        title: 'Celeste',
        description: 'A platformer about climbing a mountain and dealing with personal struggles.',
        coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1n6w.webp',
        tags: JSON.stringify(['platformer', 'challenging', 'story-rich', 'pixel-art'])
      }
    ];

    const insertGame = this.db.prepare(
      'INSERT INTO games (id, title, description, coverUrl, tags) VALUES (?, ?, ?, ?, ?)'
    );

    games.forEach(game => {
      insertGame.run(game.id, game.title, game.description, game.coverUrl, game.tags);

      // Add media for each game
      const mediaItems = [
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

      const insertMedia = this.db.prepare(
        'INSERT INTO media (id, gameId, type, url, thumbnailUrl) VALUES (?, ?, ?, ?, ?)'
      );

      mediaItems.forEach(media => {
        insertMedia.run(media.id, media.gameId, media.type, media.url, media.thumbnailUrl);
      });
    });

    // Create entries for the user
    const entries = [
      {
        id: 'entry-1',
        userId: userId,
        gameId: 'game-1',
        status: GameStatus.PLAYING,
        progress: 45,
        rating: null
      },
      {
        id: 'entry-2',
        userId: userId,
        gameId: 'game-2',
        status: GameStatus.COMPLETED,
        progress: 100,
        rating: 9
      },
      {
        id: 'entry-3',
        userId: userId,
        gameId: 'game-3',
        status: GameStatus.BACKLOG,
        progress: 0,
        rating: null
      },
      {
        id: 'entry-4',
        userId: userId,
        gameId: 'game-4',
        status: GameStatus.WISHLIST,
        progress: 0,
        rating: null
      }
    ];

    const insertEntry = this.db.prepare(
      'INSERT INTO entries (id, userId, gameId, status, progress, rating) VALUES (?, ?, ?, ?, ?, ?)'
    );

    entries.forEach(entry => {
      insertEntry.run(entry.id, entry.userId, entry.gameId, entry.status, entry.progress, entry.rating);
    });
  }

  // Authentication
  async register(name: string, username: string, password: string): Promise<AuthPayload> {
    // Check if username already exists
    const existing = this.db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      throw new Error('Username already taken');
    }

    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    this.db.prepare(
      'INSERT INTO users (id, name, username, passwordHash) VALUES (?, ?, ?, ?)'
    ).run(id, name, username, passwordHash);

    const user = this.getUser(id)!;
    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '7d' });

    return { token, user };
  }

  async login(username: string, password: string): Promise<AuthPayload> {
    const row = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!row) {
      throw new Error('Invalid username or password');
    }

    const valid = await bcrypt.compare(password, row.passwordHash);
    if (!valid) {
      throw new Error('Invalid username or password');
    }

    const user = this.getUser(row.id)!;
    const token = jwt.sign({ userId: row.id }, JWT_SECRET, { expiresIn: '7d' });

    return { token, user };
  }

  verifyToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded;
    } catch {
      return null;
    }
  }

  // Games
  getGames(): Game[] {
    const rows = this.db.prepare('SELECT * FROM games').all() as any[];
    return rows.map(row => this.mapGame(row));
  }

  getGame(id: string): Game | undefined {
    const row = this.db.prepare('SELECT * FROM games WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return this.mapGame(row);
  }

  addGame(game: Omit<Game, 'media'>): Game {
    const id = randomUUID();
    this.db.prepare(
      'INSERT INTO games (id, title, description, coverUrl, tags) VALUES (?, ?, ?, ?, ?)'
    ).run(id, game.title, game.description, game.coverUrl, JSON.stringify(game.tags));

    return {
      ...game,
      id,
      media: []
    };
  }

  private mapGame(row: any): Game {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      coverUrl: row.coverUrl,
      tags: JSON.parse(row.tags),
      media: this.getMediaByGame(row.id)
    };
  }

  // Media
  getMediaByGame(gameId: string, type?: MediaType): Media[] {
    let query = 'SELECT * FROM media WHERE gameId = ?';
    const params: any[] = [gameId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    const rows = this.db.prepare(query).all(...params) as any[];
    return rows.map(row => ({
      id: row.id,
      gameId: row.gameId,
      type: row.type as MediaType,
      url: row.url,
      thumbnailUrl: row.thumbnailUrl
    }));
  }

  addMedia(media: Omit<Media, 'id'>): Media {
    const id = randomUUID();
    this.db.prepare(
      'INSERT INTO media (id, gameId, type, url, thumbnailUrl) VALUES (?, ?, ?, ?, ?)'
    ).run(id, media.gameId, media.type, media.url, media.thumbnailUrl);

    return {
      ...media,
      id
    };
  }

  // Entries
  getEntries(userId: string): GameEntry[] {
    const rows = this.db.prepare('SELECT * FROM entries WHERE userId = ?').all(userId) as any[];
    return rows.map(row => this.mapEntry(row));
  }

  getEntry(id: string): GameEntry | undefined {
    const row = this.db.prepare('SELECT * FROM entries WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return this.mapEntry(row);
  }

  addEntry(entry: Omit<GameEntry, 'id' | 'game'> & { gameId: string }): GameEntry {
    const id = randomUUID();
    this.db.prepare(
      'INSERT INTO entries (id, userId, gameId, status, progress, rating) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, entry.userId, entry.gameId, entry.status, entry.progress, entry.rating);

    const game = this.getGame(entry.gameId);
    if (!game) throw new Error('Game not found');

    return {
      id,
      userId: entry.userId,
      gameId: entry.gameId,
      game,
      status: entry.status,
      progress: entry.progress,
      rating: entry.rating
    };
  }

  updateEntry(id: string, updates: Partial<GameEntry>): GameEntry | undefined {
    const sets: string[] = [];
    const values: any[] = [];

    if (updates.status !== undefined) {
      sets.push('status = ?');
      values.push(updates.status);
    }
    if (updates.progress !== undefined) {
      sets.push('progress = ?');
      values.push(updates.progress);
    }
    if (updates.rating !== undefined) {
      sets.push('rating = ?');
      values.push(updates.rating);
    }

    if (sets.length === 0) return this.getEntry(id);

    values.push(id);
    this.db.prepare(`UPDATE entries SET ${sets.join(', ')} WHERE id = ?`).run(...values);

    return this.getEntry(id);
  }

  deleteEntry(id: string): boolean {
    const result = this.db.prepare('DELETE FROM entries WHERE id = ?').run(id);
    return result.changes > 0;
  }

  private mapEntry(row: any): GameEntry {
    const game = this.getGame(row.gameId);
    if (!game) throw new Error(`Game ${row.gameId} not found`);

    return {
      id: row.id,
      userId: row.userId,
      gameId: row.gameId,
      game,
      status: row.status as GameStatus,
      progress: row.progress,
      rating: row.rating
    };
  }

  // Users
  getUser(id: string): User | undefined {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!row) return undefined;

    return {
      id: row.id,
      name: row.name,
      username: row.username,
      entries: this.getEntries(row.id)
    };
  }
}

export const dataStore = new DataStore();
export { JWT_SECRET };
