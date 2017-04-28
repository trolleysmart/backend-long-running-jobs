import {
  GraphQLSchema,
} from 'graphql';
import {
  getRootQueryObjectType,
} from './root-query-object-type';

function getRootSchema() {
  return new GraphQLSchema({
    query: getRootQueryObjectType(),
  });
}

export {
  getRootSchema,
};

export default getRootSchema;
