'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tagsField = exports.tagType = undefined;

var _immutable = require('immutable');

var _graphql = require('graphql');

var _smartGroceryParseServerCommon = require('smart-grocery-parse-server-common');

var tagType = new _graphql.GraphQLObjectType({
  name: 'Tag',
  fields: function fields() {
    return {
      id: {
        type: _graphql.GraphQLString
      },
      name: {
        type: _graphql.GraphQLString
      },
      weight: {
        type: _graphql.GraphQLInt
      }
    };
  }
});

var tagsField = {
  type: new _graphql.GraphQLList(tagType),
  resolve: function resolve() {
    return new Promise(function (resolve, reject) {
      _smartGroceryParseServerCommon.TagService.search((0, _immutable.Map)({})).then(function (info) {
        return resolve(info.toJS());
      }).catch(function (error) {
        return reject(error);
      });
    });
  }
};

exports.tagType = tagType;
exports.tagsField = tagsField;