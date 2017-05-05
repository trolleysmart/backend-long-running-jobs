'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rootQueryType = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _immutable = require('immutable');

var _graphql = require('graphql');

var _graphqlRelay = require('graphql-relay');

var _smartGroceryParseServerCommon = require('smart-grocery-parse-server-common');

var _microBusinessParseServerCommon = require('micro-business-parse-server-common');

var _nodeDefinitions = (0, _graphqlRelay.nodeDefinitions)(function () {
  return null;
}, function () {
  return null;
}),
    nodeInterface = _nodeDefinitions.nodeInterface,
    nodeField = _nodeDefinitions.nodeField;

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
  },
  interfaces: [nodeInterface]
});

var _connectionDefinition = (0, _graphqlRelay.connectionDefinitions)({
  name: 'Special',
  nodeType: specialType
}),
    specialsConnection = _connectionDefinition.connectionType;

var userType = new _graphql.GraphQLObjectType({
  name: 'User',
  fields: {
    id: {
      type: new _graphql.GraphQLNonNull(_graphql.GraphQLID),
      resolve: function resolve(_) {
        return _.get('id');
      }
    },
    username: {
      type: _graphql.GraphQLString,
      resolve: function resolve(_) {
        return _.get('username');
      }
    },
    specials: {
      type: specialsConnection,
      args: _extends({}, _graphqlRelay.connectionArgs, {
        description: {
          type: _graphql.GraphQLString
        }
      }),
      resolve: function resolve(_, args) {
        var promise = new Promise(function (resolve, reject) {
          _smartGroceryParseServerCommon.MasterProductPriceService.search((0, _immutable.Map)({
            limit: args.first,
            includeStore: true,
            includeMasterProduct: true,
            conditions: (0, _immutable.Map)({
              contains_masterProductDescription: args.description ? args.description.trim() : undefined,
              not_specialType: 'none'
            })
          })).then(function (specials) {
            return resolve(specials.toArray());
          }).catch(function (error) {
            return reject(error);
          });
        });

        return (0, _graphqlRelay.connectionFromPromisedArray)(promise, args);
      }
    }
  },
  interfaces: [nodeInterface]
});

var rootQueryType = new _graphql.GraphQLObjectType({
  name: 'Query',
  fields: {
    user: {
      type: userType,
      args: {
        username: {
          type: new _graphql.GraphQLNonNull(_graphql.GraphQLString)
        }
      },
      resolve: function resolve(_, args) {
        return new Promise(function (resolve, reject) {
          _microBusinessParseServerCommon.UserService.getUserInfo(args.username).then(function (info) {
            return resolve(info);
          }).catch(function (error) {
            return reject(error);
          });
        });
      }
    },
    node: nodeField
  }
});

exports.rootQueryType = rootQueryType;
exports.default = {
  rootQueryType: rootQueryType
};