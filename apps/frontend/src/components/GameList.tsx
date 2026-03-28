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
        media(type: IMAGE) {
          url
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
  const [mediaMode, setMediaMode] = useState<MediaMode>('IMAGE');

  const { data: meData } = useQuery(ME);
  const userId = meData?.me?.id;

  const { data: gamesData, loading: gamesLoading } = useQuery(GET_GAMES);
  const { data: entriesData, loading: entriesLoading, refetch: refetchEntries } = useQuery(
    GET_ENTRIES,
    { variables: { userId: userId || '' }, skip: !userId }
  );

  const [addEntry] = useMutation(ADD_ENTRY);
  const [updateEntry] = useMutation(UPDATE_ENTRY);

  const handleAddToBacklog = async (gameId: string) => {
    if (!userId) return;
    try {
      await addEntry({
        variables: {
          userId,
          gameId,
          status: GameStatus.BACKLOG,
          progress: 0,
        },
      });
      refetchEntries();
    } catch (err) {
      console.error('Error adding entry:', err);
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

  const handleUpdateProgress = async (entryId: string, progress: number) => {
    try {
      await updateEntry({
        variables: { id: entryId, progress },
      });
      refetchEntries();
    } catch (err) {
      console.error('Error updating progress:', err);
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

          {entriesLoading ? (
            <p>Loading...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {filteredEntries?.map((entry: any) => (
                <GameCard
                  key={entry.id}
                  entry={entry}
                  onUpdateStatus={handleUpdateStatus}
                  onUpdateProgress={handleUpdateProgress}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'games' && (
        <div>
          {gamesLoading ? (
            <p>Loading...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {gamesData?.games?.map((game: any) => (
                <div
                  key={game.id}
                  style={{
                    background: '#1a1a2e',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <img
                    src={game.coverUrl}
                    alt={game.title}
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                  />
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
                    <button
                      onClick={() => handleAddToBacklog(game.id)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Add to Backlog
                    </button>
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
  onUpdateStatus: (entryId: string, status: GameStatus) => void;
  onUpdateProgress: (entryId: string, progress: number) => void;
}

function GameCard({ entry, onUpdateStatus, onUpdateProgress }: GameCardProps) {
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(entry.progress);

  const statusColors: Record<GameStatus, string> = {
    [GameStatus.WISHLIST]: '#ff9800',
    [GameStatus.BACKLOG]: '#2196f3',
    [GameStatus.PLAYING]: '#4caf50',
    [GameStatus.COMPLETED]: '#9c27b0',
    [GameStatus.DROPPED]: '#f44336',
  };

  const handleProgressSubmit = () => {
    onUpdateProgress(entry.id, progressValue);
    setIsEditingProgress(false);
  };

  return (
    <div
      style={{
        background: '#1a1a2e',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
      }}
    >
      <img
        src={entry.game.media[0]?.url || entry.game.coverUrl}
        alt={entry.game.title}
        style={{ width: '100%', height: '200px', objectFit: 'cover' }}
      />
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

        <div style={{ marginBottom: '1rem' }}>
          {isEditingProgress ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={progressValue}
                onChange={(e) => setProgressValue(parseInt(e.target.value))}
                style={{ flex: 1 }}
              />
              <span>{progressValue}%</span>
              <button
                onClick={handleProgressSubmit}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ✓
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingProgress(true)}
              style={{ cursor: 'pointer' }}
            >
              Progress: {entry.progress}%
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: '#333',
                  borderRadius: '4px',
                  marginTop: '0.25rem',
                }}
              >
                <div
                  style={{
                    width: `${entry.progress}%`,
                    height: '100%',
                    background: 'rgb(var(--accent))',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}
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
          }}
        >
          {Object.values(GameStatus).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
