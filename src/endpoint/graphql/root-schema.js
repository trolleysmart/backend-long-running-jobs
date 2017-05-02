import {
  GraphQLSchema,
} from 'graphql';
import {
  rootQueryType,
} from './root-query';

function getRootSchema() {
  return new GraphQLSchema({
    query: rootQueryType,
  });
}

export {
  getRootSchema,
};

export default getRootSchema;
