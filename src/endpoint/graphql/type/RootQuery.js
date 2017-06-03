// @flow

import { GraphQLObjectType, GraphQLString, GraphQLNonNull } from 'graphql';
import { UserService } from 'micro-business-parse-server-common';
import UserType from './User';
import { NodeField } from '../interface';

const rootQueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    user: {
      type: UserType,
      args: {
        username: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      resolve: (_, args) => UserService.getUserInfo(args.username),
    },
    node: NodeField,
  },
});

export default rootQueryType;
