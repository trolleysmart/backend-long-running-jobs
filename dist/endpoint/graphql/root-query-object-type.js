'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRootQueryObjectType = undefined;

var _graphql = require('graphql');

var _masterProductObjectType = require('./master-product-object-type');

var _tagObjectType = require('./tag-object-type');

var _userObjectType = require('./user-object-type');

function getRootQueryObjectType() {
  return new _graphql.GraphQLObjectType({
    name: 'RootQueryType',
    fields: function fields() {
      return {
        masterProducts: (0, _masterProductObjectType.getMasterProductsObjectField)(),
        tags: (0, _tagObjectType.getTagsObjectField)(),
        user: (0, _userObjectType.getUserObjectField)()
      };
    }
  });
}

exports.getRootQueryObjectType = getRootQueryObjectType;
exports.default = getRootQueryObjectType;