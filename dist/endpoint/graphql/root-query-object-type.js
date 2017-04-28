'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRootQueryObjectType = undefined;

var _graphql = require('graphql');

var _userObjectType = require('./user-object-type');

function getRootQueryObjectType() {
  return new _graphql.GraphQLObjectType({
    name: 'RootQueryType',
    fields: function fields() {
      return {
        user: {
          type: (0, _userObjectType.getUserObjectType)(),
          args: {
            username: {
              type: new _graphql.GraphQLNonNull(_graphql.GraphQLString)
            }
          },
          resolve: function resolve(_, args) {
            return {
              username: args.username
            };
          }
        }
      };
    }
  });
}

exports.getRootQueryObjectType = getRootQueryObjectType;
exports.default = getRootQueryObjectType;