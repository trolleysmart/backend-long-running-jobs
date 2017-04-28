'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRootQueryObjectType = undefined;

var _graphql = require('graphql');

function getRootQueryObjectType() {
  return new _graphql.GraphQLObjectType({
    name: 'RootQueryType',
    fields: function fields() {
      return {
        hello: {
          type: _graphql.GraphQLString,
          resolve: function resolve() {
            return 'Hello World!!!';
          }
        }
      };
    }
  });
}

exports.getRootQueryObjectType = getRootQueryObjectType;
exports.default = getRootQueryObjectType;