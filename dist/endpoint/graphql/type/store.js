'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.storesField = exports.storeType = undefined;

var _immutable = require('immutable');

var _graphql = require('graphql');

var _smartGroceryParseServerCommon = require('smart-grocery-parse-server-common');

var storeType = new _graphql.GraphQLObjectType({
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

var storesField = {
  type: new _graphql.GraphQLList(storeType),
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

exports.storeType = storeType;
exports.storesField = storesField;