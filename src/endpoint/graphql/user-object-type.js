import {
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

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

export {
  getUserObjectType,
};

export default getUserObjectType;
