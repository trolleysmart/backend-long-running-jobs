import GraphQLHTTP from 'express-graphql';
import {
  getRootSchema,
} from './graphql';

export default function setupEndPoint(expressInstance) {
  const schema = getRootSchema();

  expressInstance.use('/graphql', GraphQLHTTP({
    schema,
    graphiql: true,
  }));
}
