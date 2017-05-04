import fs from 'fs';
import path from 'path';
import GraphQLHTTP from 'express-graphql';
import {
  graphql,
  printSchema,
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
      .then((json) => {
        response.setHeader('Content-Type', 'application/json');
        response.send(JSON.stringify(json, null, 2));
      })
      .catch(error => response.status(500)
        .send(error));
  });

  expressInstance.get('/graphql-schema-modern', (request, response) => response.send(printSchema(schema)));
  expressInstance.get('/graphql-schema-modern1', (request, response) => {
    const schemaPath = path.resolve(__dirname, '../../schema.graphql');

    fs.writeFileSync(schemaPath, printSchema(schema));

    response.send('Done');
  });
}

export {
  setupEndPoint,
};

export default {
  setupEndPoint,
};
