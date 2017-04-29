'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMasterProductsObjectField = undefined;

var _immutable = require('immutable');

var _graphql = require('graphql');

var _smartGroceryParseServerCommon = require('smart-grocery-parse-server-common');

function getTagObjectType() {
  return new _graphql.GraphQLObjectType({
    name: 'ProductTag',
    fields: function fields() {
      return {
        id: {
          type: _graphql.GraphQLString
        },
        name: {
          type: _graphql.GraphQLString
        },
        weight: {
          type: _graphql.GraphQLInt
        }
      };
    }
  });
}

function getTagsObjectType() {
  return new _graphql.GraphQLList(getTagObjectType());
}

function getMasterProductObjectType() {
  return new _graphql.GraphQLObjectType({
    name: 'MasterProduct',
    fields: function fields() {
      return {
        id: {
          type: _graphql.GraphQLString
        },
        description: {
          type: _graphql.GraphQLString
        },
        barcode: {
          type: _graphql.GraphQLString
        },
        imageUrl: {
          type: _graphql.GraphQLString
        },
        tags: {
          type: getTagsObjectType()
        }
      };
    }
  });
}

function getMasterProductsObjectType() {
  return new _graphql.GraphQLList(getMasterProductObjectType());
}

function getMasterProductsObjectField() {
  return {
    type: getMasterProductsObjectType(),
    resolve: function resolve() {
      return new Promise(function (resolve, reject) {
        var masterProducts = void 0;

        _smartGroceryParseServerCommon.MasterProductService.search((0, _immutable.Map)({})).then(function (results) {
          masterProducts = results;

          return _smartGroceryParseServerCommon.TagService.search((0, _immutable.Map)({}));
        }).then(function (tags) {
          resolve(masterProducts.map(function (masterProduct) {
            return masterProduct.update('tags', function (tagIds) {
              return tagIds.map(function (tagId) {
                return tags.find(function (tag) {
                  return tag.get('id').localeCompare(tagId) === 0;
                });
              });
            }).toJS();
          }));
        }).catch(function (error) {
          return reject(error);
        });
      });
    }
  };
}

exports.getMasterProductsObjectField = getMasterProductsObjectField;
exports.default = getMasterProductsObjectField;