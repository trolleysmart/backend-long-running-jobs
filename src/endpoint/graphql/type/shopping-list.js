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
import {
  multiBuyType,
} from './specials';

// const multiBuyType = new GraphQLObjectType({
//   name: 'MultiBuy',
//   fields: () => ({
//     count: {
//       type: GraphQLInt,
//       resolve: _ => _.get('count'),
//     },
//     price: {
//       type: GraphQLFloat,
//       resolve: _ => _.get('price'),
//     },
//   }),
// });

export default new GraphQLObjectType({
  name: 'ShoppingList',
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
      resolve: () => '',
    },
    unitSize: {
      type: GraphQLString,
      resolve: () => '',
    },
    expiryDate: {
      type: GraphQLString,
      resolve: () => new Date()
        .toISOString(),
    },
  },
  interfaces: [NodeInterface],
});
