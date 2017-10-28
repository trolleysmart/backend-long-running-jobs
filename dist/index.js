'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _microBusinessParseServerBackend = require('micro-business-parse-server-backend');

var _microBusinessParseServerBackend2 = _interopRequireDefault(_microBusinessParseServerBackend);

var _trolleySmartStoreCrawler = require('trolley-smart-store-crawler');

var _microBusinessParseServerCommon = require('micro-business-parse-server-common');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var countdownStoreTags = void 0;
var health2000StoreTags = void 0;
var warehouseStoreTags = void 0;

var crawlCountdownProductsDetailsAndCurrentPrice = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(sessionToken) {
    var service;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            service = new _trolleySmartStoreCrawler.CountdownWebCrawlerService({
              logVerboseFunc: function logVerboseFunc(message) {
                return console.log(message);
              },
              logInfoFunc: function logInfoFunc(message) {
                return console.log(message);
              },
              logErrorFunc: function logErrorFunc(message) {
                return console.log(message);
              },
              sessionToken: sessionToken
            });
            _context.t0 = countdownStoreTags;

            if (_context.t0) {
              _context.next = 6;
              break;
            }

            _context.next = 5;
            return service.getStoreTags();

          case 5:
            _context.t0 = _context.sent;

          case 6:
            countdownStoreTags = _context.t0;


            service.crawlProductsDetailsAndCurrentPrice(countdownStoreTags).then(function (count) {
              if (count === 0) {
                return;
              }

              crawlCountdownProductsDetailsAndCurrentPrice(sessionToken);
            }).catch(function () {
              return crawlCountdownProductsDetailsAndCurrentPrice(sessionToken);
            });

          case 8:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function crawlCountdownProductsDetailsAndCurrentPrice(_x) {
    return _ref.apply(this, arguments);
  };
}();

var crawlHealth2000ProductsDetailsAndCurrentPrice = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(sessionToken) {
    var service;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            service = new _trolleySmartStoreCrawler.Health2000WebCrawlerService({
              logVerboseFunc: function logVerboseFunc(message) {
                return console.log(message);
              },
              logInfoFunc: function logInfoFunc(message) {
                return console.log(message);
              },
              logErrorFunc: function logErrorFunc(message) {
                return console.log(message);
              },
              sessionToken: sessionToken
            });
            _context2.t0 = health2000StoreTags;

            if (_context2.t0) {
              _context2.next = 6;
              break;
            }

            _context2.next = 5;
            return service.getStoreTags();

          case 5:
            _context2.t0 = _context2.sent;

          case 6:
            health2000StoreTags = _context2.t0;


            service.crawlProductsDetailsAndCurrentPrice(health2000StoreTags).then(function (count) {
              if (count === 0) {
                return;
              }

              crawlHealth2000ProductsDetailsAndCurrentPrice(sessionToken);
            }).catch(function () {
              return crawlHealth2000ProductsDetailsAndCurrentPrice(sessionToken);
            });

          case 8:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function crawlHealth2000ProductsDetailsAndCurrentPrice(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var crawlWarehouseProductsDetailsAndCurrentPrice = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(sessionToken) {
    var service;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            service = new _trolleySmartStoreCrawler.WarehouseWebCrawlerService({
              logVerboseFunc: function logVerboseFunc(message) {
                return console.log(message);
              },
              logInfoFunc: function logInfoFunc(message) {
                return console.log(message);
              },
              logErrorFunc: function logErrorFunc(message) {
                return console.log(message);
              },
              sessionToken: sessionToken
            });
            _context3.t0 = warehouseStoreTags;

            if (_context3.t0) {
              _context3.next = 6;
              break;
            }

            _context3.next = 5;
            return service.getStoreTags();

          case 5:
            _context3.t0 = _context3.sent;

          case 6:
            warehouseStoreTags = _context3.t0;


            service.crawlProductsDetailsAndCurrentPrice(warehouseStoreTags).then(function (count) {
              if (count === 0) {
                return;
              }

              crawlWarehouseProductsDetailsAndCurrentPrice(sessionToken);
            }).catch(function () {
              return crawlWarehouseProductsDetailsAndCurrentPrice(sessionToken);
            });

          case 8:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function crawlWarehouseProductsDetailsAndCurrentPrice(_x3) {
    return _ref3.apply(this, arguments);
  };
}();

var crawlPriceDetails = function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(crawlerUsername, crawlerPassword) {
    var user;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return _microBusinessParseServerCommon.ParseWrapperService.logIn(crawlerUsername, crawlerPassword);

          case 2:
            user = _context4.sent;

            global.parseServerSessionToken = user.getSessionToken();

            crawlCountdownProductsDetailsAndCurrentPrice(global.parseServerSessionToken);
            crawlHealth2000ProductsDetailsAndCurrentPrice(global.parseServerSessionToken);
            crawlWarehouseProductsDetailsAndCurrentPrice(global.parseServerSessionToken);

          case 7:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  }));

  return function crawlPriceDetails(_x4, _x5) {
    return _ref4.apply(this, arguments);
  };
}();

var parseServerBackendInfo = (0, _microBusinessParseServerBackend2.default)({
  serverHost: process.env.HOST,
  serverPort: process.env.PORT,
  parseServerApplicationId: process.env.PARSE_SERVER_APPLICATION_ID,
  parseServerMasterKey: process.env.PARSE_SERVER_MASTER_KEY,
  parseServerClientKey: process.env.PARSE_SERVER_CLIENT_KEY,
  parseServerJavascriptKey: process.env.PARSE_SERVER_JAVASCRIPT_KEY,
  parseServerFileKey: process.env.PARSE_SERVER_FILE_KEY,
  parseServerDatabaseUri: process.env.PARSE_SERVER_DATABASE_URI,
  startParseDashboard: process.env.START_PARSE_DASHBOARD,
  parseDashboardAuthentication: process.env.PARSE_DASHBOARD_AUTHENTICATION,
  parseServerDashboardApplicationName: process.env.PARSE_SERVER_DASHBOARD_APPLICATION_NAME,
  parseServerDashboardAllowInsecureHTTP: process.env.PARSE_SERVER_DASHBOARD_ALLOW_INSECURE_HTTP,
  parseServerCloudFilePath: _path2.default.resolve(__dirname, 'cloud.js'),
  parseServerAllowClientClassCreation: process.env.PARSE_SERVER_ALLOW_CLIENT_CLASS_CREATION
});

var expressServer = (0, _express2.default)();

expressServer.use('/parse', parseServerBackendInfo.get('parseServer'));

if (parseServerBackendInfo.has('parseDashboard') && parseServerBackendInfo.get('parseDashboard')) {
  expressServer.use('/dashboard', parseServerBackendInfo.get('parseDashboard'));
}

process.on('SIGINT', function () {
  return _microBusinessParseServerCommon.ParseWrapperService.logOut().then(function () {
    return process.exit();
  }).catch(function () {
    return process.exit();
  });
});

expressServer.listen(parseServerBackendInfo.getIn(['config', 'serverPort']), function () {
  console.log('TrolleySmart backend (long running jobs) started.');
  console.log(JSON.stringify(parseServerBackendInfo.get('config').toJS(), null, 2));

  crawlPriceDetails(process.env.CRAWLER_USERNAME, process.env.CRAWLER_PASSWORD);
});