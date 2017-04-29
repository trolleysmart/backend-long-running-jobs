import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  UserService,
} from 'micro-business-parse-server-common';

function getUserObjectType() {
  return new GraphQLObjectType({
    name: 'User',
    fields: () => ({
      id: {
        type: GraphQLString,
      },
      username: {
        type: GraphQLString,
      },
    }),
  });
}

function getUserObjectField() {
  return {
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
  };
}

export {
  getUserObjectField,
};

export default getUserObjectField;
