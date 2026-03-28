import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GameList } from './GameList';
import { Auth } from './Auth';
import { useState, useEffect } from 'react';

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export function GameTracker() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleLogin = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <ApolloProvider client={client}>
      <div>
        {!token ? (
          <Auth onLogin={handleLogin} />
        ) : (
          <div>
            <button onClick={handleLogout} style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              padding: '0.5rem 1rem',
              background: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}>
              Logout
            </button>
            <GameList />
          </div>
        )}
      </div>
    </ApolloProvider>
  );
}
