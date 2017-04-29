'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTagsObjectField = undefined;

var _immutable = require('immutable');

var _graphql = require('graphql');

var _smartGroceryParseServerCommon = require('smart-grocery-parse-server-common');

function getTagObjectType() {
  return new _graphql.GraphQLObjectType({
    name: 'Tag',
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

function getTagsObjectType() {
  return new _graphql.GraphQLList(getTagObjectType());
}

function getTagsObjectField() {
  return {
    type: getTagsObjectType(),
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
}

exports.getTagsObjectField = getTagsObjectField;
exports.default = getTagsObjectField;