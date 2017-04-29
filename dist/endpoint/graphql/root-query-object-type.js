'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRootQueryObjectType = undefined;

var _graphql = require('graphql');

var _masterProductObjectType = require('./master-product-object-type');

var _masterProductPriceObjectType = require('./master-product-price-object-type');

var _storeObjectType = require('./store-object-type');

var _tagObjectType = require('./tag-object-type');

var _userObjectType = require('./user-object-type');

function getRootQueryObjectType() {
  return new _graphql.GraphQLObjectType({
    name: 'RootQueryType',
    fields: function fields() {
      return {
        masterProducts: (0, _masterProductObjectType.getMasterProductsObjectField)(),
        masterProductPrices: (0, _masterProductPriceObjectType.getMasterProductPricesObjectField)(),
        tags: (0, _tagObjectType.getTagsObjectField)(),
        stores: (0, _storeObjectType.getStoresObjectField)(),
        user: (0, _userObjectType.getUserObjectField)()
      };
    }
  });
}

exports.getRootQueryObjectType = getRootQueryObjectType;
exports.default = getRootQueryObjectType;