'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.specialEdge = exports.specialsConnection = exports.specialType = undefined;

var _graphql = require('graphql');

var _graphqlRelay = require('graphql-relay');

var multiBuyType = new _graphql.GraphQLObjectType({
  name: 'MultiBuy',
  fields: function fields() {
    return {
      count: {
        type: _graphql.GraphQLInt,
        resolve: function resolve(_) {
          return _.get('count');
        }
      },
      price: {
        type: _graphql.GraphQLFloat,
        resolve: function resolve(_) {
          return _.get('price');
        }
      }
    };
  }
});

var specialType = new _graphql.GraphQLObjectType({
  name: 'Special',
  fields: function fields() {
    return {
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
      storeName: {
        type: _graphql.GraphQLString,
        resolve: function resolve(_) {
          return _.getIn(['store', 'name']);
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
        type: multiBuyType,
        resolve: function resolve(_) {
          return _.getIn(['priceDetails', 'multiBuyInfo']);
        }
      }
    };
  }
});

var _connectionDefinition = (0, _graphqlRelay.connectionDefinitions)({
  name: 'Special',
  nodeType: specialType
}),
    specialsConnection = _connectionDefinition.connectionType,
    specialEdge = _connectionDefinition.edgeType;

exports.specialType = specialType;
exports.specialsConnection = specialsConnection;
exports.specialEdge = specialEdge;