import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLInt,
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import {
  connectionDefinitions,
} from 'graphql-relay';

const multiBuyType = new GraphQLObjectType({
  name: 'MultiBuy',
  fields: () => ({
    count: {
      type: GraphQLInt,
      resolve: _ => _.get('count'),
    },
    price: {
      type: GraphQLFloat,
      resolve: _ => _.get('price'),
    },
  }),
});

const specialType = new GraphQLObjectType({
  name: 'Special',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: _ => _.get('id'),
    },
    description: {
      type: GraphQLString,
      resolve: _ => _.getIn(['masterProduct', 'description']),
    },
    storeName: {
      type: GraphQLString,
      resolve: _ => _.getIn(['store', 'name']),
    },
    specialType: {
      type: GraphQLString,
      resolve: _ => _.getIn(['priceDetails', 'specialType']),
    },
    price: {
      type: GraphQLFloat,
      resolve: _ => _.getIn(['priceDetails', 'price']),
    },
    wasPrice: {
      type: GraphQLFloat,
      resolve: _ => _.getIn(['priceDetails', 'wasPrice']),
    },
    multiBuy: {
      type: multiBuyType,
      resolve: _ => _.getIn(['priceDetails', 'multiBuyInfo']),
    },
  }),
});

const {
  connectionType: specialsConnection,
  edgeType: specialEdge,
} = connectionDefinitions({
  name: 'Special',
  nodeType: specialType,
});

export {
  specialType,
  specialsConnection,
  specialEdge,
};
