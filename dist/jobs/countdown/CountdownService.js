'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

var _microBusinessParseServerCommon = require('micro-business-parse-server-common');

var _smartGroceryParseServerCommon = require('smart-grocery-parse-server-common');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CountdownService = function CountdownService(_ref) {
  var _this = this;

  var logVerboseFunc = _ref.logVerboseFunc,
      logInfoFunc = _ref.logInfoFunc,
      logErrorFunc = _ref.logErrorFunc;

  _classCallCheck(this, CountdownService);

  this.updateStoreCralwerProductCategoriesConfiguration = function () {
    var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(config) {
      var finalConfig, results, currentConfig, crawlResults, highLevelProductCategories, newConfig;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.t0 = config;

              if (_context.t0) {
                _context.next = 5;
                break;
              }

              _context.next = 4;
              return CountdownService.getConfig();

            case 4:
              _context.t0 = _context.sent;

            case 5:
              finalConfig = _context.t0;


              _this.logInfo(finalConfig, function () {
                return 'Fetching store crawler configuration and the most recent Countdown crawling result for Countdown High Level Product Categories...';
              }); // eslint-disable-line max-len

              _context.next = 9;
              return Promise.all([_smartGroceryParseServerCommon.StoreCrawlerConfigurationService.search((0, _immutable.Map)({
                conditions: (0, _immutable.Map)({
                  name: 'Countdown'
                }),
                topMost: true
              })), _smartGroceryParseServerCommon.CrawlSessionService.search((0, _immutable.Map)({
                conditions: (0, _immutable.Map)({
                  sessionKey: 'Countdown High Level Product Categories'
                }),
                topMost: true
              }))]);

            case 9:
              results = _context.sent;

              _this.logInfo(finalConfig, function () {
                return 'Fetched both store crawler configuration and the most recent Countdown crawling result for Countdown High Level Product Categories.';
              }); // eslint-disable-line max-len

              currentConfig = results[0].first();


              _this.logVerbose(finalConfig, function () {
                return 'Current Store Crawler config for Countdown: ' + currentConfig;
              });

              _context.next = 15;
              return _smartGroceryParseServerCommon.CrawlResultService.search((0, _immutable.Map)({
                conditions: (0, _immutable.Map)({
                  crawlSessionId: results[1].first().get('id')
                })
              }));

            case 15:
              crawlResults = _context.sent;
              highLevelProductCategories = crawlResults.first().getIn(['resultSet', 'highLevelProductCategories']);


              _this.logInfo(finalConfig, function () {
                return 'Updating new Store Crawler config for Countdown';
              });

              newConfig = currentConfig.setIn(['config', 'productCategories'], highLevelProductCategories);


              _this.logVerbose(finalConfig, function () {
                return 'New Store Crawler config for Countdown: ' + JSON.stringify(newConfig);
              });

              _context.next = 22;
              return _smartGroceryParseServerCommon.StoreCrawlerConfigurationService.create(newConfig);

            case 22:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }));

    return function (_x) {
      return _ref2.apply(this, arguments);
    };
  }();

  this.syncToMasterProductList = function (config) {
    var self = _this;
    var syncToMasterProductListInternal = function syncToMasterProductListInternal(finalConfig) {
      self.logInfo(finalConfig, function () {
        return 'Fetching the most recent Countdown crawling result for Countdown Products...';
      });

      return _smartGroceryParseServerCommon.CrawlSessionService.search((0, _immutable.Map)({
        conditions: (0, _immutable.Map)({
          sessionKey: 'Countdown Products'
        }),
        topMost: true
      })).then(function (crawlSessionInfos) {
        var sessionInfo = crawlSessionInfos.first();
        var sessionId = sessionInfo.get('id');
        var products = (0, _immutable.List)();

        self.logInfo(finalConfig, function () {
          return 'Fetched the most recent Countdown crawling result for Countdown Products. Session Id: ' + sessionId;
        });

        var result = _smartGroceryParseServerCommon.CrawlResultService.searchAll((0, _immutable.Map)({
          conditions: (0, _immutable.Map)({
            crawlSessionId: sessionId
          })
        }));

        result.event.subscribe(function (info) {
          var resultSet = info.get('resultSet');

          products = products.concat(resultSet.get('products').filterNot(function (_) {
            return _.get('description').trim().length === 0;
          }));
        });

        return result.promise.then(function () {
          // TODO: 20170506 - Morteza - Need to unsubscribe following event when promise is rejected...
          result.event.unsubscribeAll();

          return new Promise(function (resolve, reject) {
            var productsWithoutDuplication = products.groupBy(function (_) {
              return _.get('description');
            }).map(function (_) {
              return _.first();
            }).valueSeq();

            self.logVerbose(finalConfig, function () {
              return 'Checking whether products already exist...';
            });

            Promise.all(productsWithoutDuplication.map(function (product) {
              return _smartGroceryParseServerCommon.MasterProductService.exists((0, _immutable.Map)({
                conditions: product
              }));
            }).toArray()).then(function (results) {
              self.logVerbose(finalConfig, function () {
                return 'Finished checking whether products already exist.';
              });

              var indexes = (0, _immutable.Range)(0, productsWithoutDuplication.size);
              var productsWithIndexes = productsWithoutDuplication.zipWith(function (product, index) {
                return (0, _immutable.Map)({
                  product: product,
                  index: index
                });
              }, indexes);

              var newProducts = productsWithIndexes.filterNot(function (_) {
                return results[_.get('index')];
              }).map(function (_) {
                return _.get('product');
              });

              if (newProducts.isEmpty()) {
                resolve();
              } else {
                self.logInfo(finalConfig, function () {
                  return 'Saving new products...';
                });

                var newProductInfo = newProducts.map(function (_) {
                  return (0, _immutable.Map)({
                    description: _.get('description'),
                    barcode: _.get('barcode'),
                    imageUrl: _.get('imageUrl')
                  });
                });

                Promise.all(newProductInfo.map(_smartGroceryParseServerCommon.MasterProductService.create).toArray()).then(function () {
                  return resolve();
                }).catch(function (error) {
                  return reject(error);
                });
              }
            });
          });
        });
      });
    };

    return config ? syncToMasterProductListInternal(config) : CountdownService.getConfig().then(syncToMasterProductListInternal);
  };

  this.syncToMasterProductPriceList = function (config) {
    var self = _this;
    var syncToMasterProductPriceListInternal = function syncToMasterProductPriceListInternal(finalConfig, stores) {
      self.logInfo(finalConfig, function () {
        return 'Fetching the most recent Countdown crawling result for Countdown Products Price...';
      });

      return _smartGroceryParseServerCommon.CrawlSessionService.search((0, _immutable.Map)({
        conditions: (0, _immutable.Map)({
          sessionKey: 'Countdown Products'
        }),
        topMost: true
      })).then(function (crawlSessionInfos) {
        var sessionInfo = crawlSessionInfos.first();
        var sessionId = sessionInfo.get('id');
        var products = (0, _immutable.List)();

        self.logInfo(finalConfig, function () {
          return 'Fetched the most recent Countdown crawling result for Countdown Products Price. Session Id: ' + sessionId;
        });

        var result = _smartGroceryParseServerCommon.CrawlResultService.searchAll((0, _immutable.Map)({
          conditions: (0, _immutable.Map)({
            crawlSessionId: sessionId
          })
        }));

        result.event.subscribe(function (info) {
          var resultSet = info.get('resultSet');

          products = products.concat(resultSet.get('products').filterNot(function (_) {
            return _.get('description').trim().length === 0;
          }));
        });

        return result.promise.then(function () {
          result.event.unsubscribeAll();

          var productsWithoutDuplication = products.groupBy(function (_) {
            return _.get('description');
          }).map(function (_) {
            return _.first();
          }).valueSeq();

          self.logVerbose(finalConfig, function () {
            return 'Finding the product in master product...';
          });

          var capturedDate = new Date();

          return Promise.all(productsWithoutDuplication.map(function (product) {
            return new Promise(function (resolve, reject) {
              _smartGroceryParseServerCommon.MasterProductService.search((0, _immutable.Map)({
                conditions: product
              })).then(function (results) {
                if (results.isEmpty()) {
                  reject('No master product found for: ' + JSON.stringify(product.toJS()));
                  resolve();

                  return;
                } else if (results.size > 1) {
                  reject('Multiple master products found for: ' + JSON.stringify(product.toJS()));

                  return;
                }

                var masterProduct = results.first();
                var masterProductPriceInfo = (0, _immutable.Map)({
                  masterProductId: masterProduct.get('id'),
                  storeId: stores.find(function (_) {
                    return _.get('name').localeCompare('Countdown') === 0;
                  }).get('id'),
                  capturedDate: capturedDate,
                  priceDetails: (0, _immutable.Map)({
                    specialType: CountdownService.getSpecialType(product),
                    price: CountdownService.convertPriceStringToDecimal(CountdownService.getPrice(product)),
                    wasPrice: CountdownService.convertPriceStringToDecimal(CountdownService.getWasPrice(product)),
                    multiBuyInfo: CountdownService.getMultiBuyInfo(product)
                  })
                });

                _smartGroceryParseServerCommon.MasterProductPriceService.create(masterProductPriceInfo).then(function () {
                  return resolve();
                }).catch(function (error) {
                  return reject(error);
                });
              }).catch(function (error) {
                return reject(error);
              });
            });
          }).toArray());
        });
      });
    };

    if (config) {
      return CountdownService.getCountdownStore().then(function (store) {
        return syncToMasterProductPriceListInternal(config, _immutable.List.of(store));
      });
    }

    return Promise.all([CountdownService.getConfig(), CountdownService.getCountdownStore()]).then(function (results) {
      return syncToMasterProductPriceListInternal(results[0], _immutable.List.of(results[1]));
    });
  };

  this.syncToTagList = function () {
    var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(config) {
      var finalConfig, existingTags, crawlSessionInfos, sessionInfo, sessionId, tags, result, newTags;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.t0 = config;

              if (_context2.t0) {
                _context2.next = 5;
                break;
              }

              _context2.next = 4;
              return CountdownService.getConfig();

            case 4:
              _context2.t0 = _context2.sent;

            case 5:
              finalConfig = _context2.t0;
              _context2.next = 8;
              return CountdownService.getExistingTags();

            case 8:
              existingTags = _context2.sent;


              _this.logInfo(finalConfig, function () {
                return 'Fetching the most recent Countdown crawling result for Countdown Products Price...';
              });

              _context2.next = 12;
              return _smartGroceryParseServerCommon.CrawlSessionService.search((0, _immutable.Map)({
                conditions: (0, _immutable.Map)({
                  sessionKey: 'Countdown Products'
                }),
                topMost: true
              }));

            case 12:
              crawlSessionInfos = _context2.sent;
              sessionInfo = crawlSessionInfos.first();
              sessionId = sessionInfo.get('id');
              tags = (0, _immutable.Set)();


              _this.logInfo(finalConfig, function () {
                return 'Fetched the most recent Countdown crawling result for Countdown Products Price. Session Id: ' + sessionId;
              });

              result = _smartGroceryParseServerCommon.CrawlResultService.searchAll((0, _immutable.Map)({
                conditions: (0, _immutable.Map)({
                  crawlSessionId: sessionId
                })
              }));
              _context2.prev = 18;

              result.event.subscribe(function (info) {
                var resultSet = info.get('resultSet');

                tags = tags.add(resultSet.get('productCategory'));
              });

              _context2.next = 22;
              return result.promise;

            case 22:
              _context2.prev = 22;

              result.event.unsubscribeAll();
              return _context2.finish(22);

            case 25:
              newTags = tags.filterNot(function (tag) {
                return existingTags.find(function (_) {
                  return _.get('name').toLowerCase().trim().localeCompare(tag.toLowerCase().trim()) === 0;
                });
              });
              _context2.next = 28;
              return Promise.all(newTags.map(function (tag) {
                return _smartGroceryParseServerCommon.TagService.create((0, _immutable.Map)({
                  name: tag,
                  weight: 1
                }));
              }).toArray());

            case 28:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this, [[18,, 22, 25]]);
    }));

    return function (_x2) {
      return _ref3.apply(this, arguments);
    };
  }();

  this.syncMasterProductTags = function () {
    var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(config) {
      var finalConfig, existingTags, crawlSessionInfos, sessionInfo, sessionId, products, result, productsGroupedByDescription;
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.t0 = config;

              if (_context4.t0) {
                _context4.next = 5;
                break;
              }

              _context4.next = 4;
              return CountdownService.getConfig();

            case 4:
              _context4.t0 = _context4.sent;

            case 5:
              finalConfig = _context4.t0;
              _context4.next = 8;
              return CountdownService.getExistingTags();

            case 8:
              existingTags = _context4.sent;


              _this.logInfo(finalConfig, function () {
                return 'Fetching the most recent Countdown crawling result for Countdown Products Price...';
              });

              _context4.next = 12;
              return _smartGroceryParseServerCommon.CrawlSessionService.search((0, _immutable.Map)({
                conditions: (0, _immutable.Map)({
                  sessionKey: 'Countdown Products'
                }),
                topMost: true
              }));

            case 12:
              crawlSessionInfos = _context4.sent;
              sessionInfo = crawlSessionInfos.first();
              sessionId = sessionInfo.get('id');
              products = (0, _immutable.List)();


              _this.logInfo(finalConfig, function () {
                return 'Fetched the most recent Countdown crawling result for Countdown Products Price. Session Id: ' + sessionId;
              });

              result = _smartGroceryParseServerCommon.CrawlResultService.searchAll((0, _immutable.Map)({
                conditions: (0, _immutable.Map)({
                  crawlSessionId: sessionId
                })
              }));
              _context4.prev = 18;

              result.event.subscribe(function (info) {
                var resultSet = info.get('resultSet');

                products = products.concat(resultSet.get('products').filterNot(function (_) {
                  return _.get('description').trim().length === 0;
                }).map(function (_) {
                  return _.set('productCategory', resultSet.get('productCategory'));
                }));
              });

              _context4.next = 22;
              return result.promise;

            case 22:
              _context4.prev = 22;

              result.event.unsubscribeAll();
              return _context4.finish(22);

            case 25:
              productsGroupedByDescription = products.groupBy(function (_) {
                return _.get('description');
              });


              _this.logVerbose(finalConfig, function () {
                return 'Finding the product in master product...';
              });

              _context4.next = 29;
              return Promise.all(productsGroupedByDescription.keySeq().map(function (key) {
                return _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
                  var product, results, existingProduct, tags, notFoundTags, tagIds, newTagIds;
                  return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          product = productsGroupedByDescription.get(key).first();
                          _context3.next = 3;
                          return _smartGroceryParseServerCommon.MasterProductService.search((0, _immutable.Map)({
                            conditions: product
                          }));

                        case 3:
                          results = _context3.sent;

                          if (!results.isEmpty()) {
                            _context3.next = 8;
                            break;
                          }

                          throw new _microBusinessParseServerCommon.Exception('No master product found for: ' + JSON.stringify(product.toJS()));

                        case 8:
                          if (!(results.size > 1)) {
                            _context3.next = 10;
                            break;
                          }

                          throw new _microBusinessParseServerCommon.Exception('Multiple master products found for: ' + JSON.stringify(product.toJS()));

                        case 10:
                          existingProduct = results.first();
                          tags = productsGroupedByDescription.get(key).map(function (_) {
                            return _.get('productCategory');
                          }).toSet();
                          notFoundTags = tags.filterNot(function (tag) {
                            return existingTags.find(function (existingTag) {
                              return existingTag.get('name').toLowerCase().trim().localeCompare(tag.toLowerCase().trim()) === 0;
                            });
                          });

                          if (notFoundTags.isEmpty()) {
                            _context3.next = 15;
                            break;
                          }

                          throw new _microBusinessParseServerCommon.Exception('Multiple master products found for: ' + JSON.stringify(notFoundTags.toJS()));

                        case 15:
                          tagIds = tags.map(function (tag) {
                            return existingTags.find(function (existingTag) {
                              return existingTag.get('name').toLowerCase().trim().localeCompare(tag.toLowerCase().trim()) === 0;
                            }).get('id');
                          });
                          newTagIds = tagIds.filterNot(function (tagId) {
                            return existingProduct.get('tagIds').find(function (id) {
                              return id === tagId;
                            });
                          });

                          if (!newTagIds.isEmpty()) {
                            _context3.next = 19;
                            break;
                          }

                          return _context3.abrupt('return');

                        case 19:
                          _context3.next = 21;
                          return _smartGroceryParseServerCommon.MasterProductService.update(existingProduct.update('tagIds', function (currentTags) {
                            if (currentTags) {
                              return currentTags.concat(newTagIds);
                            }

                            return newTagIds;
                          }));

                        case 21:
                        case 'end':
                          return _context3.stop();
                      }
                    }
                  }, _callee3, _this);
                }));
              }).toArray());

            case 29:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, _this, [[18,, 22, 25]]);
    }));

    return function (_x3) {
      return _ref4.apply(this, arguments);
    };
  }();

  this.logVerbose = function (config, messageFunc) {
    if (_this.logVerboseFunc && config && config.get('logLevel') && config.get('logLevel') >= 3 && messageFunc) {
      _this.logVerboseFunc(messageFunc());
    }
  };

  this.logInfo = function (config, messageFunc) {
    if (_this.logInfoFunc && config && config.get('logLevel') && config.get('logLevel') >= 2 && messageFunc) {
      _this.logInfoFunc(messageFunc());
    }
  };

  this.logError = function (config, messageFunc) {
    if (_this.logErrorFunc && config && config.get('logLevel') && config.get('logLevel') >= 1 && messageFunc) {
      _this.logErrorFunc(messageFunc());
    }
  };

  this.logVerboseFunc = logVerboseFunc;
  this.logInfoFunc = logInfoFunc;
  this.logErrorFunc = logErrorFunc;
};

CountdownService.getConfig = _asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
  var config, jobConfig;
  return regeneratorRuntime.wrap(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return _microBusinessParseServerCommon.ParseWrapperService.getConfig();

        case 2:
          config = _context5.sent;
          jobConfig = config.get('Job');

          if (!jobConfig) {
            _context5.next = 6;
            break;
          }

          return _context5.abrupt('return', _immutable2.default.fromJS(jobConfig));

        case 6:
          throw new _microBusinessParseServerCommon.Exception('No config found called Job.');

        case 7:
        case 'end':
          return _context5.stop();
      }
    }
  }, _callee5, undefined);
}));
CountdownService.getCountdownStore = _asyncToGenerator(regeneratorRuntime.mark(function _callee6() {
  var criteria, results;
  return regeneratorRuntime.wrap(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          criteria = (0, _immutable.Map)({
            conditions: (0, _immutable.Map)({
              name: 'Countdown'
            })
          });
          _context6.next = 3;
          return _smartGroceryParseServerCommon.StoreService.search(criteria);

        case 3:
          results = _context6.sent;

          if (!results.isEmpty()) {
            _context6.next = 8;
            break;
          }

          throw new _microBusinessParseServerCommon.Exception('No store found called Countdown.');

        case 8:
          if (!(results.size === 1)) {
            _context6.next = 12;
            break;
          }

          return _context6.abrupt('return', results.first());

        case 12:
          throw new _microBusinessParseServerCommon.Exception('Multiple store found called Countdown.');

        case 13:
        case 'end':
          return _context6.stop();
      }
    }
  }, _callee6, undefined);
}));
CountdownService.getExistingTags = _asyncToGenerator(regeneratorRuntime.mark(function _callee7() {
  var result, tags;
  return regeneratorRuntime.wrap(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          result = _smartGroceryParseServerCommon.TagService.searchAll((0, _immutable.Map)());
          _context7.prev = 1;
          tags = (0, _immutable.List)();


          result.event.subscribe(function (info) {
            tags = tags.push(info);
          });

          _context7.next = 6;
          return result.promise;

        case 6:
          return _context7.abrupt('return', tags);

        case 7:
          _context7.prev = 7;

          result.event.unsubscribeAll();
          return _context7.finish(7);

        case 10:
        case 'end':
          return _context7.stop();
      }
    }
  }, _callee7, undefined, [[1,, 7, 10]]);
}));

CountdownService.getSpecialType = function (product) {
  if (product.has('special') && product.get('special')) {
    return 'special';
  }

  if (product.has('onecard') && product.get('onecard')) {
    return 'onecard';
  }

  if (product.has('specialMultiBuyText') && product.get('specialMultiBuyText') || product.has('multiBuyText') && product.get('multiBuyText')) {
    return 'multibuy';
  }

  return 'none';
};

CountdownService.getPrice = function (product) {
  var specialType = CountdownService.getSpecialType(product);
  var price = product.get('price');

  if (specialType.localeCompare('special') === 0) {
    return price.substring(1, price.indexOf(' '));
  } else if (specialType.localeCompare('onecard') === 0) {
    if (product.has('nonClubPrice')) {
      var nonClubPrice = product.get('nonClubPrice');

      return nonClubPrice.substring(nonClubPrice.indexOf('$') + 1);
    }

    return price.substring(1, price.indexOf(' '));
  } else if (specialType.localeCompare('multibuy') === 0) {
    return price.substring(1, price.indexOf(' '));
  }

  return price.substring(1, price.indexOf(' '));
};

CountdownService.getWasPrice = function (product) {
  var specialType = CountdownService.getSpecialType(product);

  if (specialType.localeCompare('special') === 0) {
    return product.has('wasPrice') ? product.get('wasPrice').substring(product.get('wasPrice').indexOf('$') + 1) : undefined;
  } else if (specialType.localeCompare('onecard') === 0) {
    if (product.has('clubPrice')) {
      var clubPrice = product.get('clubPrice');

      return clubPrice.substring(1, clubPrice.indexOf(' '));
    }

    return undefined;
  } else if (specialType.localeCompare('multibuy') === 0) {
    return undefined;
  }

  return undefined;
};

CountdownService.getMultiBuyInfo = function (product) {
  var specialType = CountdownService.getSpecialType(product);

  if (specialType.localeCompare('multibuy') === 0) {
    if (product.has('specialMultiBuyText')) {
      var specialMultiBuyText = product.get('specialMultiBuyText');

      return (0, _immutable.Map)({
        count: parseInt(specialMultiBuyText.substring(0, specialMultiBuyText.indexOf('for')), 10),
        price: CountdownService.convertPriceStringToDecimal(specialMultiBuyText.substring(specialMultiBuyText.indexOf('for') + 'for'.length))
      });
    } else if (product.has('multiBuyText')) {
      var multiBuyText = product.get('multiBuyText');

      return (0, _immutable.Map)({
        count: parseInt(multiBuyText.substring(0, multiBuyText.indexOf(' ')), 10),
        price: CountdownService.convertPriceStringToDecimal(multiBuyText.substring(multiBuyText.indexOf('for ') + 'for '.length))
      });
    }

    return undefined;
  }

  return undefined;
};

CountdownService.convertPriceStringToDecimal = function (price) {
  if (price) {
    return parseFloat(price);
  }

  return undefined;
};

exports.default = CountdownService;