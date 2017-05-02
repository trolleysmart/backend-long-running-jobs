'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.specialsField = exports.specialType = undefined;

var _graphql = require('graphql');

var specialType = new _graphql.GraphQLObjectType({
  name: 'Special',
  fields: function fields() {
    return {
      id: {
        type: new _graphql.GraphQLNonNull(_graphql.GraphQLID),
        resolve: function resolve() {
          return 'Test';
        }
      },
      price: {
        type: _graphql.GraphQLFloat
      }
    };
  }
});

var specialsField = {
  type: new _graphql.GraphQLList(specialType),
  resolve: function resolve() {
    return [{
      price: 4.32
    }, {
      price: 5.42
    }];
  }
};

exports.specialType = specialType;
exports.specialsField = specialsField;