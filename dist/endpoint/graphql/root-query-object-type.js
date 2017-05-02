'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRootQueryObjectType = undefined;

var _graphql = require('graphql');

var _masterProductObjectType = require('./master-product-object-type');

var _masterProductPriceObjectType = require('./master-product-price-object-type');

var _storeObjectType = require('./store-object-type');

var _specials = require('./specials');

var _tagObjectType = require('./tag-object-type');

var _userObjectType = require('./user-object-type');

function getRootQueryObjectType() {
  return new _graphql.GraphQLObjectType({
    name: 'RootQueryType',
    fields: function fields() {
      return {
        masterProducts: _masterProductObjectType.masterProductsField,
        masterProductPrices: _masterProductPriceObjectType.masterProductPricesField,
        tags: _tagObjectType.tagsField,
        stores: _storeObjectType.storesField,
        specials: _specials.specialsField,
        user: _userObjectType.userField
      };
    }
  });
}

exports.getRootQueryObjectType = getRootQueryObjectType;
exports.default = getRootQueryObjectType;