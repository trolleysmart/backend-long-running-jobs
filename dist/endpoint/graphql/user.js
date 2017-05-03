'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.userField = exports.userType = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _immutable = require('immutable');

var _graphql = require('graphql');

var _graphqlRelay = require('graphql-relay');

var _microBusinessParseServerCommon = require('micro-business-parse-server-common');

var _smartGroceryParseServerCommon = require('smart-grocery-parse-server-common');

var _specials = require('./specials');

var userType = new _graphql.GraphQLObjectType({
  name: 'User',
  fields: function fields() {
    return {
      id: {
        type: _graphql.GraphQLString
      },
      username: {
        type: _graphql.GraphQLString
      },
      specials: {
        type: _specials.specialsConnection,
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
                specialTypes: _immutable.List.of('special')
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