'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _immutable = require('immutable');

var _graphql = require('graphql');

var _graphqlRelay = require('graphql-relay');

var _smartGroceryParseServerCommon = require('smart-grocery-parse-server-common');

var _Specials = require('./Specials');

var _Specials2 = _interopRequireDefault(_Specials);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = new _graphql.GraphQLObjectType({
  name: 'ShoppingList',
  fields: {
    specials: {
      type: _Specials2.default,
      args: _extends({}, _graphqlRelay.connectionArgs),
      resolve: function () {
        var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(_, args) {
          var masterProductCriteria, result, specials;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  if (!_.isEmpty()) {
                    _context.next = 2;
                    break;
                  }

                  return _context.abrupt('return', (0, _immutable.List)());

                case 2:
                  masterProductCriteria = (0, _immutable.Map)({
                    includeStore: true,
                    includeMasterProduct: true,
                    ids: _
                  });
                  result = _smartGroceryParseServerCommon.MasterProductPriceService.searchAll(masterProductCriteria);
                  _context.prev = 4;
                  specials = (0, _immutable.List)();


                  result.event.subscribe(function (info) {
                    return specials = specials.push(info);
                  });

                  _context.next = 9;
                  return result.promise;

                case 9:
                  return _context.abrupt('return', (0, _graphqlRelay.connectionFromArray)(specials.toArray(), args));

                case 10:
                  _context.prev = 10;

                  result.event.unsubscribeAll();
                  return _context.finish(10);

                case 13:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, undefined, [[4,, 10, 13]]);
        }));

        return function resolve(_x, _x2) {
          return _ref.apply(this, arguments);
        };
      }()
    }
  }
});