import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { GameStatus, MediaType } from '@game-tracker/shared';

const GET_GAMES = gql`
  query GetGames {
    games {
      id
      title
      description
      coverUrl
      tags
      media {
        type
        url
      }
    }
  }
`;

const GET_ENTRIES = gql`
  query GetEntries($userId: ID!) {
    entries(userId: $userId) {
      id
      game {
        id
        title
        description
        coverUrl
        tags
        media {
          type
          url
          thumbnailUrl
        }
      }
      status
      progress
      rating
    }
  }
`;

const ADD_ENTRY = gql`
  mutation AddEntry($userId: ID!, $gameId: ID!, $status: GameStatus!, $progress: Int, $rating: Int) {
    addEntry(userId: $userId, gameId: $gameId, status: $status, progress: $progress, rating: $rating) {
      id
      status
      progress
    }
  }
`;

const UPDATE_ENTRY = gql`
  mutation UpdateEntry($id: ID!, $status: GameStatus, $progress: Int, $rating: Int) {
    updateEntry(id: $id, status: $status, progress: $progress, rating: $rating) {
      id
      status
      progress
      rating
    }
  }
`;

const DELETE_ENTRY = gql`
  mutation DeleteEntry($id: ID!) {
    deleteEntry(id: $id)
  }
`;

const ME = gql`
  query Me {
    me {
      id
      name
      username
    }
  }
`;

export function GameList() {
  const [activeTab, setActiveTab] = useState<'games' | 'entries'>('entries');
  const [selectedStatus, setSelectedStatus] = useState<GameStatus | 'ALL'>('ALL');
  const [mediaMode, setMediaMode] = useState<MediaType>('IMAGE');
  const [addingGames, setAddingGames] = useState<Record<string, 'wishlist' | 'playing' | null>>({});

  const { data: meData } = useQuery(ME);
  const userId = meData?.me?.id;

  const { data: gamesData, loading: gamesLoading } = useQuery(GET_GAMES);
  const { data: entriesData, loading: entriesLoading, refetch: refetchEntries } = useQuery(
    GET_ENTRIES,
    { variables: { userId: userId || '' }, skip: !userId }
  );

  const [addEntry] = useMutation(ADD_ENTRY);
  const [updateEntry] = useMutation(UPDATE_ENTRY);
  const [deleteEntry] = useMutation(DELETE_ENTRY);

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to remove this game from your collection?')) return;
    try {
      await deleteEntry({
        variables: { id: entryId },
      });
      refetchEntries();
    } catch (err) {
      console.error('Error deleting entry:', err);
      alert('Failed to remove game from collection');
    }
  };

  const handleAddToWishlist = async (gameId: string) => {
    if (!userId) return;
    setAddingGames(prev => ({ ...prev, [gameId]: 'wishlist' }));
    try {
      await addEntry({
        variables: {
          userId,
          gameId,
          status: GameStatus.WISHLIST,
          progress: 0,
        },
      });
      refetchEntries();
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        alert('This game is already in your collection!');
      } else {
        console.error('Error adding entry:', err);
        alert('Failed to add game to wishlist');
      }
    } finally {
      setTimeout(() => {
        setAddingGames(prev => ({ ...prev, [gameId]: null }));
      }, 1000);
    }
  };

  const handleAddToPlayed = async (gameId: string) => {
    if (!userId) return;
    setAddingGames(prev => ({ ...prev, [gameId]: 'playing' }));
    try {
      await addEntry({
        variables: {
          userId,
          gameId,
          status: GameStatus.PLAYING,
          progress: 0,
        },
      });
      refetchEntries();
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        alert('This game is already in your collection!');
      } else {
        console.error('Error adding entry:', err);
        alert('Failed to add game to playing');
      }
    } finally {
      setTimeout(() => {
        setAddingGames(prev => ({ ...prev, [gameId]: null }));
      }, 1000);
    }
  };

  const handleUpdateStatus = async (entryId: string, status: GameStatus) => {
    try {
      await updateEntry({
        variables: { id: entryId, status },
      });
      refetchEntries();
    } catch (err) {
      console.error('Error updating entry:', err);
    }
  };

  const filteredEntries = entriesData?.entries?.filter(
    (entry: any) => selectedStatus === 'ALL' || entry.status === selectedStatus
  );

  const statusColors: Record<GameStatus, string> = {
    [GameStatus.WISHLIST]: '#ff9800',
    [GameStatus.BACKLOG]: '#2196f3',
    [GameStatus.PLAYING]: '#4caf50',
    [GameStatus.COMPLETED]: '#9c27b0',
    [GameStatus.DROPPED]: '#f44336',
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <button
          onClick={() => setActiveTab('entries')}
          style={{
            padding: '0.75rem 1.5rem',
            marginRight: '0.5rem',
            background: activeTab === 'entries' ? 'rgb(var(--accent))' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          My Games
        </button>
        <button
          onClick={() => setActiveTab('games')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'games' ? 'rgb(var(--accent))' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          All Games
        </button>
      </div>

      {activeTab === 'entries' && (
        <div>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => setSelectedStatus('ALL')}
              style={{
                padding: '0.5rem 1rem',
                background: selectedStatus === 'ALL' ? 'rgb(var(--accent))' : '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              All
            </button>
            {Object.values(GameStatus).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                style={{
                  padding: '0.5rem 1rem',
                  background: selectedStatus === status ? statusColors[status] : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {status}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <span style={{ padding: '0.5rem 1rem', color: '#aaa' }}>View:</span>
            <button
              onClick={() => setMediaMode('IMAGE')}
              style={{
                padding: '0.5rem 1rem',
                background: mediaMode === 'IMAGE' ? 'rgb(var(--accent))' : '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Image
            </button>
            <button
              onClick={() => setMediaMode('TRAILER')}
              style={{
                padding: '0.5rem 1rem',
                background: mediaMode === 'TRAILER' ? 'rgb(var(--accent))' : '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Trailer
            </button>
            <button
              onClick={() => setMediaMode('GAMEPLAY')}
              style={{
                padding: '0.5rem 1rem',
                background: mediaMode === 'GAMEPLAY' ? 'rgb(var(--accent))' : '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Gameplay
            </button>
          </div>

          {entriesLoading ? (
            <p>Loading...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: mediaMode === 'IMAGE' ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
              {filteredEntries?.map((entry: any) => (
                <GameCard
                  key={entry.id}
                  entry={entry}
                  mediaMode={mediaMode}
                  onUpdateStatus={handleUpdateStatus}
                  onDeleteEntry={handleDeleteEntry}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'games' && (
        <div>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <span style={{ padding: '0.5rem 1rem', color: '#aaa' }}>View:</span>
            <button
              onClick={() => setMediaMode('IMAGE')}
              style={{
                padding: '0.5rem 1rem',
                background: mediaMode === 'IMAGE' ? 'rgb(var(--accent))' : '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Image
            </button>
            <button
              onClick={() => setMediaMode('TRAILER')}
              style={{
                padding: '0.5rem 1rem',
                background: mediaMode === 'TRAILER' ? 'rgb(var(--accent))' : '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Trailer
            </button>
            <button
              onClick={() => setMediaMode('GAMEPLAY')}
              style={{
                padding: '0.5rem 1rem',
                background: mediaMode === 'GAMEPLAY' ? 'rgb(var(--accent))' : '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Gameplay
            </button>
          </div>

          {gamesLoading ? (
            <p>Loading...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: mediaMode === 'IMAGE' ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
              {gamesData?.games?.map((game: any) => {
                const isVideo = mediaMode === 'TRAILER' || mediaMode === 'GAMEPLAY';
                const mediaItem = game.media?.find((m: any) => m.type === mediaMode);
                const mediaUrl = isVideo ? mediaItem?.url : game.coverUrl;
                
                return (
                  <div
                    key={game.id}
                    style={{
                      background: '#1a1a2e',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    {isVideo && mediaUrl ? (
                      <iframe
                        src={mediaUrl}
                        title={`${game.title} ${mediaMode.toLowerCase()}`}
                        style={{ width: '100%', aspectRatio: '16/9', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <img
                        src={game.coverUrl}
                        alt={game.title}
                        style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover' }}
                      />
                    )}
                    <div style={{ padding: '1rem' }}>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>{game.title}</h3>
                      <p style={{ fontSize: '0.875rem', color: '#aaa', marginBottom: '1rem' }}>
                        {game.description}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {game.tags.map((tag: string) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.5rem',
                              background: '#333',
                              borderRadius: '4px',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleAddToWishlist(game.id)}
                        disabled={addingGames[game.id] !== undefined}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: addingGames[game.id] === 'wishlist' ? '#666' : '#ff9800',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: addingGames[game.id] !== undefined ? 'not-allowed' : 'pointer',
                          opacity: addingGames[game.id] !== undefined ? 0.7 : 1,
                        }}
                      >
                        {addingGames[game.id] === 'wishlist' ? 'Added!' : 'Wishlist'}
                      </button>
                      <button
                        onClick={() => handleAddToPlayed(game.id)}
                        disabled={addingGames[game.id] !== undefined}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: addingGames[game.id] === 'playing' ? '#666' : '#4caf50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: addingGames[game.id] !== undefined ? 'not-allowed' : 'pointer',
                          opacity: addingGames[game.id] !== undefined ? 0.7 : 1,
                        }}
                      >
                        {addingGames[game.id] === 'playing' ? 'Added!' : 'Playing'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface GameCardProps {
  entry: any;
  mediaMode: MediaType;
  onUpdateStatus: (entryId: string, status: GameStatus) => void;
  onDeleteEntry: (entryId: string) => void;
}

function GameCard({ entry, mediaMode, onUpdateStatus, onDeleteEntry }: GameCardProps) {
  const statusColors: Record<GameStatus, string> = {
    [GameStatus.WISHLIST]: '#ff9800',
    [GameStatus.BACKLOG]: '#2196f3',
    [GameStatus.PLAYING]: '#4caf50',
    [GameStatus.COMPLETED]: '#9c27b0',
    [GameStatus.DROPPED]: '#f44336',
  };

  const getMediaUrl = () => {
    if (mediaMode === 'IMAGE') {
      return entry.game.coverUrl;
    }
    const media = entry.game.media?.find((m: any) => m.type === mediaMode);
    return media?.url || entry.game.coverUrl;
  };

  const isVideo = mediaMode === 'TRAILER' || mediaMode === 'GAMEPLAY';

  return (
    <div
      style={{
        background: '#1a1a2e',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
      }}
    >
      {isVideo ? (
        <iframe
          src={getMediaUrl()}
          title={`${entry.game.title} ${mediaMode.toLowerCase()}`}
          style={{ width: '100%', aspectRatio: '16/9', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <img
          src={getMediaUrl()}
          alt={entry.game.title}
          style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover' }}
        />
      )}
      <div style={{ padding: '1rem' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '0.25rem 0.5rem',
            background: statusColors[entry.status as GameStatus],
            borderRadius: '4px',
            fontSize: '0.75rem',
            marginBottom: '0.5rem',
          }}
        >
          {entry.status}
        </div>

        <h3 style={{ margin: '0 0 0.5rem 0' }}>{entry.game.title}</h3>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {entry.game.tags.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                background: '#333',
                borderRadius: '4px',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <select
          value={entry.status}
          onChange={(e) => onUpdateStatus(entry.id, e.target.value as GameStatus)}
          style={{
            width: '100%',
            padding: '0.5rem',
            background: '#0f0f1e',
            color: 'white',
            border: '1px solid #444',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '0.5rem',
          }}
        >
          {Object.values(GameStatus).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <button
          onClick={() => onDeleteEntry(entry.id)}
          style={{
            width: '100%',
            padding: '0.5rem',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
