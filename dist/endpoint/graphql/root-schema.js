'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRootSchema = undefined;

var _graphql = require('graphql');

var _rootQuery = require('./root-query');

function getRootSchema() {
  return new _graphql.GraphQLSchema({
    query: _rootQuery.rootQueryType
  });
}

exports.getRootSchema = getRootSchema;
exports.default = getRootSchema;