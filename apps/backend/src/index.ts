import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from '@game-tracker/shared';
import { resolvers } from './resolvers';
import { dataStore } from './data';

interface MyContext {
  userId?: string;
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const port = parseInt(process.env.PORT || '4000');

startStandaloneServer(server, {
  listen: { port },
  context: async ({ req }): Promise<MyContext> => {
    // Get token from authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = dataStore.verifyToken(token);
      if (decoded) {
        return { userId: decoded.userId };
      }
    }
    
    return { userId: undefined };
  },
}).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
