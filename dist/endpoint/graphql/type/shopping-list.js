'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _graphql = require('graphql');

var _interface = require('../interface');

var _specials = require('./specials');

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

exports.default = new _graphql.GraphQLObjectType({
  name: 'ShoppingList',
  fields: {
    id: {
      type: new _graphql.GraphQLNonNull(_graphql.GraphQLID),
      resolve: function resolve(_) {
        return _.get('id');
      }
    },
    description: {
      type: _graphql.GraphQLString,
      resolve: function resolve(_) {
        return _.getIn(['masterProduct', 'description']);
      }
    },
    imageUrl: {
      type: _graphql.GraphQLString,
      resolve: function resolve(_) {
        return _.getIn(['masterProduct', 'imageUrl']);
      }
    },
    barcode: {
      type: _graphql.GraphQLString,
      resolve: function resolve(_) {
        return _.getIn(['masterProduct', 'barcode']);
      }
    },
    specialType: {
      type: _graphql.GraphQLString,
      resolve: function resolve(_) {
        return _.getIn(['priceDetails', 'specialType']);
      }
    },
    price: {
      type: _graphql.GraphQLFloat,
      resolve: function resolve(_) {
        return _.getIn(['priceDetails', 'price']);
      }
    },
    wasPrice: {
      type: _graphql.GraphQLFloat,
      resolve: function resolve(_) {
        return _.getIn(['priceDetails', 'wasPrice']);
      }
    },
    multiBuy: {
      type: _specials.multiBuyType,
      resolve: function resolve(_) {
        return _.getIn(['priceDetails', 'multiBuyInfo']);
      }
    },
    storeName: {
      type: _graphql.GraphQLString,
      resolve: function resolve(_) {
        return _.getIn(['store', 'name']);
      }
    },
    storeImageUrl: {
      type: _graphql.GraphQLString,
      resolve: function resolve(_) {
        return _.getIn(['store', 'imageUrl']);
      }
    },
    comments: {
      type: _graphql.GraphQLString,
      resolve: function resolve() {
        return '';
      }
    },
    unitSize: {
      type: _graphql.GraphQLString,
      resolve: function resolve() {
        return '';
      }
    },
    expiryDate: {
      type: _graphql.GraphQLString,
      resolve: function resolve() {
        return new Date().toISOString();
      }
    }
  },
  interfaces: [_interface.NodeInterface]
});