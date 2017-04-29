import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  UserService,
} from 'micro-business-parse-server-common';
import {
  getUserObjectType,
} from './user-object-type';

function getRootQueryObjectType() {
  return new GraphQLObjectType({
    name: 'RootQueryType',
    fields: () => ({
      user: {
        type: getUserObjectType(),
        args: {
          username: {
            type: new GraphQLNonNull(GraphQLString),
          },
        },
        resolve: (_, args) => new Promise((resolve, reject) => {
          UserService.getUserInfo(args.username)
            .then(info => resolve(info.toJS()))
            .catch(error => reject(error));
        }),
      },
    }),
  });
}

export {
  getRootQueryObjectType,
};

export default getRootQueryObjectType;
