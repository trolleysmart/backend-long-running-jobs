import {
  GraphQLSchema,
} from 'graphql';
import {
  rootQueryType,
} from './root-query';

export default function getRootSchema() {
  return new GraphQLSchema({
    query: rootQueryType,
  });
}
