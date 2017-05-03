'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rootQueryType = undefined;

var _graphql = require('graphql');

var _viewer = require('./viewer');

var rootQueryType = new _graphql.GraphQLObjectType({
  name: 'RootQueryType',
  fields: function fields() {
    return {
      viewer: _viewer.viewerField
    };
  }
});

exports.rootQueryType = rootQueryType;
exports.default = {
  rootQueryType: rootQueryType
};