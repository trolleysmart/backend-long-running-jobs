'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _graphql = require('graphql');

var _microBusinessParseServerCommon = require('micro-business-parse-server-common');

var _user = require('./user');

var _user2 = _interopRequireDefault(_user);

var _interface = require('../interface');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var rootQueryType = new _graphql.GraphQLObjectType({
  name: 'Query',
  fields: {
    user: {
      type: _user2.default,
      args: {
        username: {
          type: new _graphql.GraphQLNonNull(_graphql.GraphQLString)
        }
      },
      resolve: function resolve(_, args) {
        return new Promise(function (resolve, reject) {
          _microBusinessParseServerCommon.UserService.getUserInfo(args.username).then(function (info) {
            return resolve(info);
          }).catch(function (error) {
            return reject(error);
          });
        });
      }
    },
    node: _interface.NodeField
  }
});

exports.default = rootQueryType;