'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUserObjectType = undefined;

var _graphql = require('graphql');

function getUserObjectType() {
  return new _graphql.GraphQLObjectType({
    name: 'User',
    fields: function fields() {
      return {
        username: {
          type: _graphql.GraphQLString
        },
        emailAddress: {
          type: _graphql.GraphQLString
        },
        emailVerified: {
          type: _graphql.GraphQLBoolean
        }
      };
    }
  });
}

exports.getUserObjectType = getUserObjectType;
exports.default = getUserObjectType;