import GraphQLHTTP from 'express-graphql';
import {
  getRootSchema,
} from './graphql/root-schema';

function setupEndPoint(expressInstance) {
  expressInstance.use('/graphql', GraphQLHTTP({
    schema: getRootSchema(),
    graphiql: true,
  }));
}

export {
  setupEndPoint,
};

export default {
  setupEndPoint,
};
