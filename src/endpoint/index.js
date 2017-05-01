import GraphQLHTTP from 'express-graphql';
import {
  graphql,
} from 'graphql';
import {
  introspectionQuery,
} from 'graphql/utilities';
import {
  getRootSchema,
} from './graphql/root-schema';

function setupEndPoint(expressInstance) {
  const schema = getRootSchema();

  expressInstance.use('/graphql', GraphQLHTTP({
    schema,
    graphiql: true,
  }));

  expressInstance.get('/graphql-schema', (request, response) => {
    graphql(schema, introspectionQuery)
      .then(json => response.send(JSON.stringify(json, null, 2)))
      .catch(error => response.status(500).send(error));
  });
}

export {
  setupEndPoint,
};

export default {
  setupEndPoint,
};
