import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';
import {
  nodeDefinitions,
} from 'graphql-relay';
import {
  UserService,
} from 'micro-business-parse-server-common';
import getUserType from './user';

const {
  nodeInterface,
  nodeField,
} = nodeDefinitions(
  () => null,
  () => null,
);

const rootQueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    user: {
      type: getUserType(nodeInterface),
      args: {
        username: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      resolve: (_, args) => new Promise((resolve, reject) => {
        UserService.getUserInfo(args.username)
          .then(info => resolve(info))
          .catch(error => reject(error));
      }),
    },
    node: nodeField,
  },
});

export {
  rootQueryType,
};

export default {
  rootQueryType,
};
