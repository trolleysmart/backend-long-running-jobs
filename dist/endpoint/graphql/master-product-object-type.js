'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMasterProductsObjectField = undefined;

var _graphql = require('graphql');

var _graphqlFields = require('graphql-fields');

var _graphqlFields2 = _interopRequireDefault(_graphqlFields);

var _immutable = require('immutable');

var _smartGroceryParseServerCommon = require('smart-grocery-parse-server-common');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
    args: {
      description: {
        type: _graphql.GraphQLString
      }
    },
    resolve: function resolve(parent, args, context, info) {
      return new Promise(function (resolve, reject) {
        var fields = (0, _graphqlFields2.default)(info);
        var masterProducts = void 0;

        _smartGroceryParseServerCommon.MasterProductService.search((0, _immutable.Map)({
          fields: (0, _immutable.List)().concat(fields.description ? _immutable.List.of('description') : (0, _immutable.List)()).concat(fields.barcode ? _immutable.List.of('barcode') : (0, _immutable.List)()).concat(fields.imageUrl ? _immutable.List.of('imageUrl') : (0, _immutable.List)()).concat(fields.tags ? _immutable.List.of('tags') : (0, _immutable.List)()),
          conditions: (0, _immutable.Map)({
            contains_description: args.description && args.description.trim().length > 0 ? args.description.trim() : undefined
          })
        })).then(function (results) {
          masterProducts = results;

          if (fields.tags && masterProducts.find(function (_) {
            return !_.get('tags').isEmpty();
          })) {
            var tagIds = masterProducts.filterNot(function (_) {
              return _.get('tags').isEmpty();
            }).flatMap(function (_) {
              return _.get('tags');
            }).toSet().toList();

            return _smartGroceryParseServerCommon.TagService.search((0, _immutable.Map)({
              fields: (0, _immutable.List)().concat(fields.tags.name ? _immutable.List.of('name') : (0, _immutable.List)()).concat(fields.tags.weight ? _immutable.List.of('weight') : (0, _immutable.List)()),
              conditions: (0, _immutable.Map)({
                ids: tagIds
              })
            }));
          }

          return (0, _immutable.List)();
        }).then(function (tags) {
          if (fields.tags) {
            resolve(masterProducts.map(function (masterProduct) {
              return masterProduct.update('tags', function (tagIds) {
                return tagIds.map(function (tagId) {
                  return tags.find(function (tag) {
                    return tag.get('id').localeCompare(tagId) === 0;
                  });
                });
              }).toJS();
            }));
          } else {
            resolve(masterProducts.toJS());
          }
        }).catch(function (error) {
          return reject(error);
        });
      });
    }
  };
}

exports.getMasterProductsObjectField = getMasterProductsObjectField;
exports.default = getMasterProductsObjectField;