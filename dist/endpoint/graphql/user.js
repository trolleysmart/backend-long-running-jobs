'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _immutable = require('immutable');

var _graphql = require('graphql');

var _graphqlRelay = require('graphql-relay');

var _smartGroceryParseServerCommon = require('smart-grocery-parse-server-common');

var _specials = require('./specials');

var _specials2 = _interopRequireDefault(_specials);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (nodeInterface) {
  var _connectionDefinition = (0, _graphqlRelay.connectionDefinitions)({
    name: 'Special',
    nodeType: (0, _specials2.default)(nodeInterface)
  }),
      specialsConnection = _connectionDefinition.connectionType;

  var userType = new _graphql.GraphQLObjectType({
    name: 'User',
    fields: {
      id: {
        type: new _graphql.GraphQLNonNull(_graphql.GraphQLID),
        resolve: function resolve(_) {
          return _.get('id');
        }
      },
      username: {
        type: _graphql.GraphQLString,
        resolve: function resolve(_) {
          return _.get('username');
        }
      },
      specials: {
        type: specialsConnection,
        args: _extends({}, _graphqlRelay.connectionArgs, {
          description: {
            type: _graphql.GraphQLString
          }
        }),
        resolve: function resolve(_, args) {
          var promise = new Promise(function (resolve, reject) {
            _smartGroceryParseServerCommon.MasterProductPriceService.search((0, _immutable.Map)({
              limit: args.first,
              includeStore: true,
              includeMasterProduct: true,
              conditions: (0, _immutable.Map)({
                contains_masterProductDescription: args.description ? args.description.trim() : undefined,
                not_specialType: 'none'
              })
            })).then(function (specials) {
              return resolve(specials.toArray());
            }).catch(function (error) {
              return reject(error);
            });
          });

          return (0, _graphqlRelay.connectionFromPromisedArray)(promise, args);
        }
      }
    },
    interfaces: [nodeInterface]
  });

  return userType;
};