'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.viewerField = exports.viewerType = undefined;

var _graphql = require('graphql');

var _masterProduct = require('./master-product');

var _masterProductPrice = require('./master-product-price');

var _store = require('./store');

var _tag = require('./tag');

var _user = require('./user');

var viewerType = new _graphql.GraphQLObjectType({
  name: 'Viewer',
  fields: function fields() {
    return {
      masterProducts: _masterProduct.masterProductsField,
      masterProductPrices: _masterProductPrice.masterProductPricesField,
      tags: _tag.tagsField,
      stores: _store.storesField,
      user: _user.userField
    };
  }
});

var viewerField = {
  type: viewerType,
  resolve: function resolve() {
    return {};
  }
};

exports.viewerType = viewerType;
exports.viewerField = viewerField;