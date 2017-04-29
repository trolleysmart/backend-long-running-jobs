'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CountdownService = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

var _microBusinessParseServerCommon = require('micro-business-parse-server-common');

var _smartGroceryParseServerCommon = require('smart-grocery-parse-server-common');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CountdownService = function () {
  _createClass(CountdownService, null, [{
    key: 'getConfig',
    value: function getConfig() {
      return new Promise(function (resolve, reject) {
        _microBusinessParseServerCommon.ParseWrapperService.getConfig().then(function (config) {
          var jobConfig = config.get('Job');

          if (jobConfig) {
            resolve(_immutable2.default.fromJS(jobConfig));
          } else {
            reject('No config found called Job.');
          }
        }).catch(function (error) {
          return reject(error);
        });
      });
    }
  }, {
    key: 'getCountdownStore',
    value: function getCountdownStore() {
      return new Promise(function (resolve, reject) {
        var criteria = (0, _immutable.Map)({
          conditions: (0, _immutable.Map)({
            name: 'Countdown'
          })
        });

        _smartGroceryParseServerCommon.StoreService.search(criteria).then(function (results) {
          if (results.isEmpty()) {
            reject('No store found called Countdown.');
          } else if (results.size === 1) {
            resolve(results.first());
          } else {
            reject('Multiple store found called Countdown.');
          }
        }).catch(function (error) {
          return reject(error);
        });
      });
    }
  }, {
    key: 'getExistingTags',
    value: function getExistingTags() {
      return new Promise(function (resolve, reject) {
        var tags = (0, _immutable.List)();
        var result = _smartGroceryParseServerCommon.TagService.searchAll((0, _immutable.Map)());

        result.event.subscribe(function (info) {
          tags = tags.push(info);
        });

        result.promise.then(function () {
          return resolve(tags);
        }).catch(function (error) {
          console.log(error);
          reject(error);
        });
      });
    }
  }, {
    key: 'getSpecialType',
    value: function getSpecialType(product) {
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
    }
  }, {
    key: 'getPrice',
    value: function getPrice(product) {
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
    }
  }, {
    key: 'getWasPrice',
    value: function getWasPrice(product) {
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
    }
  }, {
    key: 'getMultiBuyInfo',
    value: function getMultiBuyInfo(product) {
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
    }
  }, {
    key: 'convertPriceStringToDecimal',
    value: function convertPriceStringToDecimal(price) {
      return price ? parseFloat(price) : undefined;
    }
  }]);

  function CountdownService(_ref) {
    var logVerboseFunc = _ref.logVerboseFunc,
        logInfoFunc = _ref.logInfoFunc,
        logErrorFunc = _ref.logErrorFunc;

    _classCallCheck(this, CountdownService);

    this.logVerboseFunc = logVerboseFunc;
    this.logInfoFunc = logInfoFunc;
    this.logErrorFunc = logErrorFunc;

    this.updateStoreCralwerProductCategoriesConfiguration = this.updateStoreCralwerProductCategoriesConfiguration.bind(this);
    this.syncToMasterProductList = this.syncToMasterProductList.bind(this);
    this.syncToMasterProductPriceList = this.syncToMasterProductPriceList.bind(this);
    this.syncToTagList = this.syncToTagList.bind(this);
    this.syncMasterProductTags = this.syncMasterProductTags.bind(this);
    this.logVerbose = this.logVerbose.bind(this);
    this.logInfo = this.logInfo.bind(this);
    this.logError = this.logError.bind(this);
  }

  _createClass(CountdownService, [{
    key: 'updateStoreCralwerProductCategoriesConfiguration',
    value: function updateStoreCralwerProductCategoriesConfiguration(config) {
      var self = this;
      var updateStoreCralwerProductCategoriesConfigurationInternal = function updateStoreCralwerProductCategoriesConfigurationInternal(finalConfig) {
        var currentConfig = void 0;

        self.logInfo(finalConfig, function () {
          return 'Fetching store crawler configuration and the most recent Countdown crawling result for Countdown High Level Product Categories...';
        }); // eslint-disable-line max-len

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
        }))]).then(function (results) {
          self.logInfo(finalConfig, function () {
            return 'Fetched both store crawler configuration and the most recent Countdown crawling result for Countdown High Level Product Categories.';
          }); // eslint-disable-line max-len

          currentConfig = results[0].first();

          self.logVerbose(finalConfig, function () {
            return 'Current Store Crawler config for Countdown: ' + currentConfig;
          });

          return _smartGroceryParseServerCommon.CrawlResultService.search((0, _immutable.Map)({
            conditions: (0, _immutable.Map)({
              crawlSessionId: results[1].first().get('id')
            })
          }));
        }).then(function (results) {
          var highLevelProductCategories = results.first().getIn(['resultSet', 'highLevelProductCategories']);

          self.logInfo(finalConfig, function () {
            return 'Updating new Store Crawler config for Countdown';
          });

          var newConfig = currentConfig.setIn(['config', 'productCategories'], highLevelProductCategories);

          self.logVerbose(finalConfig, function () {
            return 'New Store Crawler config for Countdown: ' + JSON.stringify(newConfig);
          });

          return _smartGroceryParseServerCommon.StoreCrawlerConfigurationService.create(newConfig);
        });
      };

      return config ? updateStoreCralwerProductCategoriesConfigurationInternal(config) : CountdownService.getConfig().then(updateStoreCralwerProductCategoriesConfigurationInternal);
    }
  }, {
    key: 'syncToMasterProductList',
    value: function syncToMasterProductList(config) {
      var self = this;
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

            self.logVerbose(finalConfig, function () {
              return 'Received result sets for Session Id: ' + sessionId;
            });

            products = products.concat(resultSet.get('products').filterNot(function (_) {
              return _.get('description').trim().length === 0;
            }));
          });

          return result.promise.then(function () {
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
                return _smartGroceryParseServerCommon.MasterProductService.exists(product);
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
    }
  }, {
    key: 'syncToMasterProductPriceList',
    value: function syncToMasterProductPriceList(config) {
      var self = this;
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

            self.logVerbose(finalConfig, function () {
              return 'Received result sets for Session Id: ' + sessionId;
            });

            products = products.concat(resultSet.get('products').filterNot(function (_) {
              return _.get('description').trim().length === 0;
            }));
          });

          return result.promise.then(function () {
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
    }
  }, {
    key: 'syncToTagList',
    value: function syncToTagList(config) {
      var self = this;
      var syncToTagListInternal = function syncToTagListInternal(finalConfig, existingTags) {
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
          var tags = (0, _immutable.Set)();

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

            self.logVerbose(finalConfig, function () {
              return 'Received result sets for Session Id: ' + sessionId;
            });

            tags = tags.add(resultSet.get('productCategory'));
          });

          return result.promise.then(function () {
            var newTags = tags.filterNot(function (tag) {
              return existingTags.find(function (_) {
                return _.get('name').toLowerCase().trim().localeCompare(tag.toLowerCase().trim()) === 0;
              });
            });

            return Promise.all(newTags.map(function (tag) {
              return _smartGroceryParseServerCommon.TagService.create((0, _immutable.Map)({
                name: tag,
                weight: 1
              }));
            }).toArray());
          });
        });
      };

      if (config) {
        return CountdownService.getExistingTags().then(function (existingTags) {
          return syncToTagListInternal(config, existingTags);
        });
      }

      return Promise.all([CountdownService.getConfig(), CountdownService.getExistingTags()]).then(function (results) {
        return syncToTagListInternal(results[0], results[1]);
      });
    }
  }, {
    key: 'syncMasterProductTags',
    value: function syncMasterProductTags(config) {
      var self = this;
      var syncMasterProductTagsInternal = function syncMasterProductTagsInternal(finalConfig, existingTags) {
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

            self.logVerbose(finalConfig, function () {
              return 'Received result sets for Session Id: ' + sessionId;
            });

            products = products.concat(resultSet.get('products').filterNot(function (_) {
              return _.get('description').trim().length === 0;
            }).map(function (_) {
              return _.set('productCategory', resultSet.get('productCategory'));
            }));
          });

          return result.promise.then(function () {
            var productsGroupedByDescription = products.groupBy(function (_) {
              return _.get('description');
            });

            self.logVerbose(finalConfig, function () {
              return 'Finding the product in master product...';
            });

            return Promise.all(productsGroupedByDescription.keySeq().map(function (key) {
              return new Promise(function (resolve, reject) {
                var product = productsGroupedByDescription.get(key).first();

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

                  var existingProduct = results.first();

                  var tags = productsGroupedByDescription.get(key).map(function (_) {
                    return _.get('productCategory');
                  }).toSet();
                  var notFoundTags = tags.filterNot(function (tag) {
                    return existingTags.find(function (existingTag) {
                      return existingTag.get('name').toLowerCase().trim().localeCompare(tag.toLowerCase().trim()) === 0;
                    });
                  });

                  if (!notFoundTags.isEmpty()) {
                    reject('Multiple master products found for: ' + JSON.stringify(notFoundTags.toJS()));

                    return;
                  }

                  var tagIds = tags.map(function (tag) {
                    return existingTags.find(function (existingTag) {
                      return existingTag.get('name').toLowerCase().trim().localeCompare(tag.toLowerCase().trim()) === 0;
                    }).get('id');
                  });

                  var newTagIds = tagIds.filterNot(function (tagId) {
                    return existingProduct.get('tags').orSome((0, _immutable.List)()).find(function (id) {
                      return id === tagId;
                    });
                  });

                  if (newTagIds.isEmpty()) {
                    resolve();

                    return;
                  }

                  _smartGroceryParseServerCommon.MasterProductService.update(existingProduct.update('tags', function (currentTags) {
                    if (currentTags) {
                      return currentTags.concat(newTagIds);
                    }

                    return newTagIds;
                  })).then(function () {
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
        return CountdownService.getExistingTags().then(function (existingTags) {
          return syncMasterProductTagsInternal(config, existingTags);
        });
      }

      return Promise.all([CountdownService.getConfig(), CountdownService.getExistingTags()]).then(function (results) {
        return syncMasterProductTagsInternal(results[0], results[1]);
      });
    }
  }, {
    key: 'logVerbose',
    value: function logVerbose(config, messageFunc) {
      if (this.logVerboseFunc && config && config.get('logLevel') && config.get('logLevel') >= 3 && messageFunc) {
        this.logVerboseFunc(messageFunc());
      }
    }
  }, {
    key: 'logInfo',
    value: function logInfo(config, messageFunc) {
      if (this.logInfoFunc && config && config.get('logLevel') && config.get('logLevel') >= 2 && messageFunc) {
        this.logInfoFunc(messageFunc());
      }
    }
  }, {
    key: 'logError',
    value: function logError(config, messageFunc) {
      if (this.logErrorFunc && config && config.get('logLevel') && config.get('logLevel') >= 1 && messageFunc) {
        this.logErrorFunc(messageFunc());
      }
    }
  }]);

  return CountdownService;
}();

exports.CountdownService = CountdownService;
exports.default = CountdownService;