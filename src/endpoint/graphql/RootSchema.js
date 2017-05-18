// @flow

import { GraphQLSchema } from 'graphql';
import { rootQueryType } from './type';

export default function getRootSchema() {
  return new GraphQLSchema({
    query: rootQueryType,
  });
}
