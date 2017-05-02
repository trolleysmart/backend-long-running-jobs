import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLID,
} from 'graphql';

const specialType = new GraphQLObjectType({
  name: 'Special',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: () => 'Test',
    },
    price: {
      type: GraphQLFloat,
    },
  }),
});

const specialsField = {
  type: new GraphQLList(specialType),
  resolve: () => [{
    price: 4.32,
  }, {
    price: 5.42,
  }],
};

export {
  specialType,
  specialsField,
};
