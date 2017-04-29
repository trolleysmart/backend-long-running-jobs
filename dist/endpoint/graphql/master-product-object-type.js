'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMasterProductsObjectField = undefined;

var _immutable = require('immutable');

var _graphql = require('graphql');

var _smartGroceryParseServerCommon = require('smart-grocery-parse-server-common');

function getMasterProductObjectType() {
  return new _graphql.GraphQLObjectType({
    name: 'MasterProduct',
    fields: function fields() {
      return {
        id: {
          type: _graphql.GraphQLString
        },
        description: {
          type: _graphql.GraphQLString
        },
        barcode: {
          type: _graphql.GraphQLString
        },
        imageUrl: {
          type: _graphql.GraphQLString
        },
        tags: {
          type: new _graphql.GraphQLList(_graphql.GraphQLString)
        }
      };
    }
  });
}

function getMasterProductsObjectType() {
  return new _graphql.GraphQLList(getMasterProductObjectType());
}

function getMasterProductsObjectField() {
  return {
    type: getMasterProductsObjectType(),
    resolve: function resolve() {
      return new Promise(function (resolve, reject) {
        _smartGroceryParseServerCommon.MasterProductService.search((0, _immutable.Map)({})).then(function (info) {
          return resolve(info.toJS());
        }).catch(function (error) {
          return reject(error);
        });
      });
    }
  };
}

exports.getMasterProductsObjectField = getMasterProductsObjectField;
exports.default = getMasterProductsObjectField;