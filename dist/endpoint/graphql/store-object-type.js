'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getStoresObjectField = undefined;

var _immutable = require('immutable');

var _graphql = require('graphql');

var _smartGroceryParseServerCommon = require('smart-grocery-parse-server-common');

function getStoreObjectType() {
  return new _graphql.GraphQLObjectType({
    name: 'Store',
    fields: function fields() {
      return {
        id: {
          type: _graphql.GraphQLString
        },
        name: {
          type: _graphql.GraphQLString
        }
      };
    }
  });
}

function getStoresObjectType() {
  return new _graphql.GraphQLList(getStoreObjectType());
}

function getStoresObjectField() {
  return {
    type: getStoresObjectType(),
    resolve: function resolve() {
      return new Promise(function (resolve, reject) {
        _smartGroceryParseServerCommon.StoreService.search((0, _immutable.Map)({})).then(function (info) {
          return resolve(info.toJS());
        }).catch(function (error) {
          return reject(error);
        });
      });
    }
  };
}

exports.getStoresObjectField = getStoresObjectField;
exports.default = getStoresObjectField;