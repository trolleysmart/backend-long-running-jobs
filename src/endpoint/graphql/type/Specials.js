// @flow

import { GraphQLID, GraphQLFloat, GraphQLObjectType, GraphQLString, GraphQLNonNull } from 'graphql';
import { connectionDefinitions } from 'graphql-relay';
import { NodeInterface } from '../interface';
import multiBuyType from './MultiBuy';

const specialType = new GraphQLObjectType({
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
      resolve: () => '',
    },
    unitSize: {
      type: GraphQLString,
      resolve: () => '',
    },
    expiryDate: {
      type: GraphQLString,
      resolve: () => new Date().toISOString(),
    },
  },
  interfaces: [NodeInterface],
});

const SpecialConnectionDefinition = connectionDefinitions({
  name: 'Special',
  nodeType: specialType,
});

export default SpecialConnectionDefinition;
