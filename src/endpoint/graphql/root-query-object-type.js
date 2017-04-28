import {
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

function getRootQueryObjectType() {
  return new GraphQLObjectType({
    name: 'RootQueryType',
    fields: () => ({
      hello: {
        type: GraphQLString,
        resolve: () => 'Hello World!!!',
      },
    }),
  });
}

export {
  getRootQueryObjectType,
};

export default getRootQueryObjectType;
