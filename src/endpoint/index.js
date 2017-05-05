import GraphQLHTTP from 'express-graphql';
import {
  getRootSchema,
} from './graphql/root-schema';

function setupEndPoint(expressInstance) {
  const schema = getRootSchema();

  expressInstance.use('/graphql', GraphQLHTTP({
    schema,
    graphiql: true,
  }));
}

export {
  setupEndPoint,
};

export default {
  setupEndPoint,
};
