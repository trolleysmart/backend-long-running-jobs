'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.userField = exports.userType = undefined;

var _graphql = require('graphql');

var _microBusinessParseServerCommon = require('micro-business-parse-server-common');

var userType = new _graphql.GraphQLObjectType({
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

var userField = {
  type: userType,
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

exports.userType = userType;
exports.userField = userField;