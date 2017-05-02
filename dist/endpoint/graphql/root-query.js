'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rootQueryType = undefined;

var _graphql = require('graphql');

var _masterProduct = require('./master-product');

var _masterProductPrice = require('./master-product-price');

var _store = require('./store');

var _specials = require('./specials');

var _tag = require('./tag');

var _user = require('./user');

var rootQueryType = new _graphql.GraphQLObjectType({
  name: 'RootQueryType',
  fields: function fields() {
    return {
      masterProducts: _masterProduct.masterProductsField,
      masterProductPrices: _masterProductPrice.masterProductPricesField,
      tags: _tag.tagsField,
      stores: _store.storesField,
      specials: _specials.specialsField,
      user: _user.userField
    };
  }
});

exports.rootQueryType = rootQueryType;
exports.default = {
  rootQueryType: rootQueryType
};