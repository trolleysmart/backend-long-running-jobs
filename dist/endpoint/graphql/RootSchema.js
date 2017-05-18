'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getRootSchema;

var _graphql = require('graphql');

var _type = require('./type');

function getRootSchema() {
  return new _graphql.GraphQLSchema({
    query: _type.rootQueryType
  });
}