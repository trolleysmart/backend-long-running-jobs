import {
  GraphQLID,
  GraphQLFloat,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';
import {
  NodeInterface,
} from '../interface';

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

export default new GraphQLObjectType({
  name: 'Special',
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: _ => _.get('id'),
    },
    description: {
      type: GraphQLString,
      resolve: _ => _.getIn(['masterProduct', 'description']),
    },
    imageUrl: {
      type: GraphQLString,
      resolve: _ => _.getIn(['masterProduct', 'imageUrl']),
    },
    barcode: {
      type: GraphQLString,
      resolve: _ => _.getIn(['masterProduct', 'barcode']),
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
    storeName: {
      type: GraphQLString,
      resolve: _ => _.getIn(['store', 'name']),
    },
    storeImageUrl: {
      type: GraphQLString,
      resolve: _ => _.getIn(['store', 'imageUrl']),
    },
    comments: {
      type: GraphQLString,
      resolve: () => 'Limited 4 per person',
    },
    unitSize: {
      type: GraphQLString,
      resolve: () => '$0.80/100gr',
    },
    expiryDate: {
      type: GraphQLString,
      resolve: () => new Date().toISOString(),
    },
  },
  interfaces: [NodeInterface],
});