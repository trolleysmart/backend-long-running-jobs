// @flow

import { GraphQLID, GraphQLFloat, GraphQLObjectType, GraphQLString, GraphQLNonNull } from 'graphql';
import { connectionDefinitions } from 'graphql-relay';
import { NodeInterface } from '../interface';
import multiBuyType from './MultiBuy';

const shoppingListType = new GraphQLObjectType({
  name: 'ShoppingList',
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: _ => _.get('id'),
    },
    stapleShoppingListId: {
      type: GraphQLID,
      resolve: _ => _.get('stapleShoppingListId'),
    },
    masterProductPriceId: {
      type: GraphQLID,
      resolve: _ => _.get('masterProductPriceId'),
    },
    description: {
      type: GraphQLString,
      resolve: _ => _.get('description'),
    },
    imageUrl: {
      type: GraphQLString,
      resolve: _ => _.get('imageUrl'),
    },
    barcode: {
      type: GraphQLString,
      resolve: _ => _.get('barcode'),
    },
    specialType: {
      type: GraphQLString,
      resolve: _ => _.get('specialType'),
    },
    price: {
      type: GraphQLFloat,
      resolve: _ => _.get('price'),
    },
    wasPrice: {
      type: GraphQLFloat,
      resolve: _ => _.get('wasPrice'),
    },
    multiBuy: {
      type: multiBuyType,
      resolve: _ => _.get('multiBuyInfo'),
    },
    storeName: {
      type: GraphQLString,
      resolve: _ => _.get('storeName'),
    },
    storeImageUrl: {
      type: GraphQLString,
      resolve: _ => _.get('storeImageUrl'),
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

const ShoppingListConnectionDefinition = connectionDefinitions({
  name: 'ShoppingList',
  nodeType: shoppingListType,
});

export default ShoppingListConnectionDefinition;
