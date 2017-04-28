'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRootSchema = undefined;

var _graphql = require('graphql');

var _rootQueryObjectType = require('./root-query-object-type');

function getRootSchema() {
  return new _graphql.GraphQLSchema({
    query: (0, _rootQueryObjectType.getRootQueryObjectType)()
  });
}

exports.getRootSchema = getRootSchema;
exports.default = getRootSchema;