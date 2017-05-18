'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _immutable = require('immutable');

var _graphql = require('graphql');

var _graphqlRelay = require('graphql-relay');

var _smartGroceryParseServerCommon = require('smart-grocery-parse-server-common');

var _interface = require('../interface');

var _Specials = require('./Specials');

var _Specials2 = _interopRequireDefault(_Specials);

var _ShoppingList = require('./ShoppingList');

var _ShoppingList2 = _interopRequireDefault(_ShoppingList);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var _connectionDefinition = (0, _graphqlRelay.connectionDefinitions)({
  name: 'Special',
  nodeType: _Specials2.default
}),
    specialsConnection = _connectionDefinition.connectionType;

exports.default = new _graphql.GraphQLObjectType({
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
      resolve: function () {
        var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(_, args) {
          var criteria, specials, result;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  criteria = (0, _immutable.Map)({
                    includeStore: true,
                    includeMasterProduct: true,
                    conditions: (0, _immutable.Map)({
                      contains_masterProductDescription: args.description ? args.description.trim() : undefined,
                      not_specialType: 'none'
                    })
                  });
                  specials = void 0;

                  if (!args.first) {
                    _context.next = 8;
                    break;
                  }

                  _context.next = 5;
                  return _smartGroceryParseServerCommon.MasterProductPriceService.search(criteria.set('limit', args.first));

                case 5:
                  specials = _context.sent;
                  _context.next = 17;
                  break;

                case 8:
                  result = _smartGroceryParseServerCommon.MasterProductPriceService.searchAll(criteria);
                  _context.prev = 9;

                  specials = (0, _immutable.List)();

                  result.event.subscribe(function (info) {
                    specials = specials.push(info);
                  });

                  _context.next = 14;
                  return result.promise;

                case 14:
                  _context.prev = 14;

                  result.event.unsubscribeAll();
                  return _context.finish(14);

                case 17:
                  return _context.abrupt('return', (0, _graphqlRelay.connectionFromArray)(specials.toArray(), args));

                case 18:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, undefined, [[9,, 14, 17]]);
        }));

        return function resolve(_x, _x2) {
          return _ref.apply(this, arguments);
        };
      }()
    },
    shoppingList: {
      type: new _graphql.GraphQLList(_ShoppingList2.default),
      resolve: function () {
        var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(_) {
          var criteria, shoppingList, masterProductPriceIds, masterProductCriteria, result, specials;
          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  criteria = (0, _immutable.Map)({
                    includeMasterProductPrices: true,
                    topMost: true,
                    conditions: (0, _immutable.Map)({
                      userId: _.get('id')
                    })
                  });
                  _context2.next = 3;
                  return _smartGroceryParseServerCommon.ShoppingListService.search(criteria);

                case 3:
                  shoppingList = _context2.sent;

                  if (!shoppingList.isEmpty()) {
                    _context2.next = 6;
                    break;
                  }

                  return _context2.abrupt('return', (0, _immutable.List)());

                case 6:
                  masterProductPriceIds = shoppingList.first().get('masterProductPriceIds');

                  if (!masterProductPriceIds.isEmpty()) {
                    _context2.next = 9;
                    break;
                  }

                  return _context2.abrupt('return', (0, _immutable.List)());

                case 9:
                  masterProductCriteria = (0, _immutable.Map)({
                    includeStore: true,
                    includeMasterProduct: true,
                    conditions: (0, _immutable.Map)({
                      id: masterProductPriceIds.first()
                    })
                  });
                  result = _smartGroceryParseServerCommon.MasterProductPriceService.searchAll(masterProductCriteria);
                  _context2.prev = 11;
                  specials = (0, _immutable.List)();


                  result.event.subscribe(function (info) {
                    specials = specials.push(info);
                    console.log('//////// ' + JSON.stringify(info.toJS()));
                  });
                  _context2.next = 16;
                  return result.promise;

                case 16:
                  return _context2.abrupt('return', specials);

                case 17:
                  _context2.prev = 17;

                  result.event.unsubscribeAll();
                  return _context2.finish(17);

                case 20:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, undefined, [[11,, 17, 20]]);
        }));

        return function resolve(_x3) {
          return _ref2.apply(this, arguments);
        };
      }()
    }
  },
  interfaces: [_interface.NodeInterface]
});