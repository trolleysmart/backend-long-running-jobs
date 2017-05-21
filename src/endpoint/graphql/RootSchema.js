// @flow

import { GraphQLSchema } from 'graphql';
import { rootMutationType } from './mutation';
import { rootQueryType } from './type';

export default function getRootSchema() {
  return new GraphQLSchema({
    query: rootQueryType,
    mutation: rootMutationType,
  });
}
