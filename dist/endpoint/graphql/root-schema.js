'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getRootSchema;

var _graphql = require('graphql');

var _rootQuery = require('./root-query');

function getRootSchema() {
  return new _graphql.GraphQLSchema({
    query: _rootQuery.rootQueryType
  });
}