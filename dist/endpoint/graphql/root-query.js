'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rootQueryType = undefined;

var _graphql = require('graphql');

var _graphqlRelay = require('graphql-relay');

var _microBusinessParseServerCommon = require('micro-business-parse-server-common');

var _user = require('./user');

var _user2 = _interopRequireDefault(_user);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _nodeDefinitions = (0, _graphqlRelay.nodeDefinitions)(function () {
  return null;
}, function () {
  return null;
}),
    nodeInterface = _nodeDefinitions.nodeInterface,
    nodeField = _nodeDefinitions.nodeField;

var rootQueryType = new _graphql.GraphQLObjectType({
  name: 'Query',
  fields: {
    user: {
      type: (0, _user2.default)(nodeInterface),
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
    node: nodeField
  }
});

exports.rootQueryType = rootQueryType;
exports.default = {
  rootQueryType: rootQueryType
};