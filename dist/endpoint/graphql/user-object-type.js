'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUserObjectField = undefined;

var _graphql = require('graphql');

var _microBusinessParseServerCommon = require('micro-business-parse-server-common');

function getUserObjectType() {
  return new _graphql.GraphQLObjectType({
    name: 'User',
    fields: function fields() {
      return {
        id: {
          type: _graphql.GraphQLString
        },
        username: {
          type: _graphql.GraphQLString
        }
      };
    }
  });
}

function getUserObjectField() {
  return {
    type: getUserObjectType(),
    args: {
      username: {
        type: new _graphql.GraphQLNonNull(_graphql.GraphQLString)
      }
    },
    resolve: function resolve(_, args) {
      return new Promise(function (resolve, reject) {
        _microBusinessParseServerCommon.UserService.getUserInfo(args.username).then(function (info) {
          return resolve(info.toJS());
        }).catch(function (error) {
          return reject(error);
        });
      });
    }
  };
}

exports.getUserObjectField = getUserObjectField;
exports.default = getUserObjectField;