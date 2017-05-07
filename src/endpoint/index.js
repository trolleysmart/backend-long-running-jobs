import GraphQLHTTP from 'express-graphql';
import {
  graphql,
} from 'graphql';
import {
  introspectionQuery,
} from 'graphql/utilities';
import {
  getRootSchema,
} from './graphql';

export default function setupEndPoint(expressInstance) {
  const schema = getRootSchema();

  expressInstance.use('/graphql', GraphQLHTTP({
    schema,
    graphiql: true,
  }));

  expressInstance.get('/graphql-schema', (request, response) => {
    graphql(schema, introspectionQuery)
      .then((json) => {
        response.setHeader('Content-Type', 'application/json');
        response.send(JSON.stringify(json, null, 2));
      })
      .catch(error => response.status(500)
        .send(error));
  });
}
