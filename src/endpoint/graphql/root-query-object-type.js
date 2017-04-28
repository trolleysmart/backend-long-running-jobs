import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
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
        resolve: (_, args) => ({
          username: args.username,
        }),
      },
    }),
  });
}

export {
  getRootQueryObjectType,
};

export default getRootQueryObjectType;
