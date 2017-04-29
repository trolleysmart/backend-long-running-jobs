'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRootQueryObjectType = undefined;

var _graphql = require('graphql');

var _userObjectType = require('./user-object-type');

var _masterProductObjectType = require('./master-product-object-type');

function getRootQueryObjectType() {
  return new _graphql.GraphQLObjectType({
    name: 'RootQueryType',
    fields: function fields() {
      return {
        user: (0, _userObjectType.getUserObjectField)(),
        masterProducts: (0, _masterProductObjectType.getMasterProductsObjectField)()
      };
    }
  });
}

exports.getRootQueryObjectType = getRootQueryObjectType;
exports.default = getRootQueryObjectType;