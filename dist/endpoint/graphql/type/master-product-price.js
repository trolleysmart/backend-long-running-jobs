'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.masterProductPricesField = exports.masterProductPriceType = undefined;

var _immutable = require('immutable');

var _graphql = require('graphql');

var _smartGroceryParseServerCommon = require('smart-grocery-parse-server-common');

var masterProductPriceType = new _graphql.GraphQLObjectType({
  name: 'MasterProductPrice',
  fields: function fields() {
    return {
      id: {
        type: _graphql.GraphQLString
      },
      specialType: {
        type: _graphql.GraphQLString
      },
      price: {
        type: _graphql.GraphQLFloat
      }
    };
  }
});

var masterProductPricesField = {
  type: new _graphql.GraphQLList(masterProductPriceType),
  resolve: function resolve() {
    return new Promise(function (resolve, reject) {
      _smartGroceryParseServerCommon.MasterProductPriceService.search((0, _immutable.Map)({})).then(function (info) {
        return resolve(info.map(function (_) {
          return _.merge((0, _immutable.Map)({
            specialType: _.getIn(['priceDetails', 'specialType']),
            price: _.getIn(['priceDetails', 'price'])
          }));
        }).toJS());
      }).catch(function (error) {
        return reject(error);
      });
    });
  }
};

exports.masterProductPriceType = masterProductPriceType;
exports.masterProductPricesField = masterProductPricesField;