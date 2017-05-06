import Immutable, {
  List,
  Map,
  Range,
  Set,
} from 'immutable';
import {
  ParseWrapperService,
} from 'micro-business-parse-server-common';
import {
  CrawlResultService,
  CrawlSessionService,
  StoreCrawlerConfigurationService,
  MasterProductService,
  MasterProductPriceService,
  StoreService,
  TagService,
} from 'smart-grocery-parse-server-common';

export default class CountdownService {
  static getConfig = () => new Promise((resolve, reject) => {
    ParseWrapperService.getConfig()
      .then((config) => {
        const jobConfig = config.get('Job');

        if (jobConfig) {
          resolve(Immutable.fromJS(jobConfig));
        } else {
          reject('No config found called Job.');
        }
      })
      .catch(error => reject(error));
  })

  static getCountdownStore = () => new Promise((resolve, reject) => {
    const criteria = Map({
      conditions: Map({
        name: 'Countdown',
      }),
    });

    StoreService.search(criteria)
      .then((results) => {
        if (results.isEmpty()) {
          reject('No store found called Countdown.');
        } else if (results.size === 1) {
          resolve(results.first());
        } else {
          reject('Multiple store found called Countdown.');
        }
      })
      .catch(error => reject(error));
  })

  static getExistingTags = () => new Promise((resolve, reject) => {
    let tags = List();
    const result = TagService.searchAll(Map());

    result.event.subscribe((info) => {
      tags = tags.push(info);
    });

    result.promise.then(() => {
      result.event.unsubscribeAll();
      resolve(tags);
    })
      .catch((error) => {
        result.event.unsubscribeAll();
        reject(error);
      });
  })

  static getSpecialType = (product) => {
    if (product.has('special') && product.get('special')) {
      return 'special';
    }

    if (product.has('onecard') && product.get('onecard')) {
      return 'onecard';
    }

    if ((product.has('specialMultiBuyText') && product.get('specialMultiBuyText')) || (product.has('multiBuyText') && product.get('multiBuyText'))) {
      return 'multibuy';
    }

    return 'none';
  }

  static getPrice = (product) => {
    const specialType = CountdownService.getSpecialType(product);
    const price = product.get('price');

    if (specialType.localeCompare('special') === 0) {
      return price.substring(1, price.indexOf(' '));
    } else if (specialType.localeCompare('onecard') === 0) {
      if (product.has('nonClubPrice')) {
        const nonClubPrice = product.get('nonClubPrice');

        return nonClubPrice.substring(nonClubPrice.indexOf('$') + 1);
      }

      return price.substring(1, price.indexOf(' '));
    } else if (specialType.localeCompare('multibuy') === 0) {
      return price.substring(1, price.indexOf(' '));
    }

    return price.substring(1, price.indexOf(' '));
  }

  static getWasPrice = (product) => {
    const specialType = CountdownService.getSpecialType(product);

    if (specialType.localeCompare('special') === 0) {
      return product.has('wasPrice') ? product.get('wasPrice')
        .substring(product.get('wasPrice')
          .indexOf('$') + 1) : undefined;
    } else if (specialType.localeCompare('onecard') === 0) {
      if (product.has('clubPrice')) {
        const clubPrice = product.get('clubPrice');

        return clubPrice.substring(1, clubPrice.indexOf(' '));
      }

      return undefined;
    } else if (specialType.localeCompare('multibuy') === 0) {
      return undefined;
    }

    return undefined;
  }

  static getMultiBuyInfo = (product) => {
    const specialType = CountdownService.getSpecialType(product);

    if (specialType.localeCompare('multibuy') === 0) {
      if (product.has('specialMultiBuyText')) {
        const specialMultiBuyText = product.get('specialMultiBuyText');

        return Map({
          count: parseInt(specialMultiBuyText.substring(0, specialMultiBuyText.indexOf('for')), 10),
          price: CountdownService.convertPriceStringToDecimal(specialMultiBuyText.substring(specialMultiBuyText.indexOf('for') + 'for'.length)),
        });
      } else if (product.has('multiBuyText')) {
        const multiBuyText = product.get('multiBuyText');

        return Map({
          count: parseInt(multiBuyText.substring(0, multiBuyText.indexOf(' ')), 10),
          price: CountdownService.convertPriceStringToDecimal(multiBuyText.substring(multiBuyText.indexOf('for ') + 'for '.length)),
        });
      }

      return undefined;
    }

    return undefined;
  }

  static convertPriceStringToDecimal = (price) => {
    if (price) {
      return parseFloat(price);
    }

    return undefined;
  }

  constructor({
    logVerboseFunc,
    logInfoFunc,
    logErrorFunc,
  }) {
    this.logVerboseFunc = logVerboseFunc;
    this.logInfoFunc = logInfoFunc;
    this.logErrorFunc = logErrorFunc;
  }

  updateStoreCralwerProductCategoriesConfiguration = (config) => {
    const self = this;
    const updateStoreCralwerProductCategoriesConfigurationInternal = (finalConfig) => {
      let currentConfig;

      self.logInfo(finalConfig, () =>
        'Fetching store crawler configuration and the most recent Countdown crawling result for Countdown High Level Product Categories...',
      ); // eslint-disable-line max-len

      return Promise.all([StoreCrawlerConfigurationService.search(Map({
        conditions: Map({
          name: 'Countdown',
        }),
        topMost: true,
      })),
        CrawlSessionService.search(Map({
          conditions: Map({
            sessionKey: 'Countdown High Level Product Categories',
          }),
          topMost: true,
        })),
      ])
        .then((results) => {
          self.logInfo(finalConfig, () =>
            'Fetched both store crawler configuration and the most recent Countdown crawling result for Countdown High Level Product Categories.',
          ); // eslint-disable-line max-len

          currentConfig = results[0].first();

          self.logVerbose(finalConfig, () => `Current Store Crawler config for Countdown: ${currentConfig}`);

          return CrawlResultService.search(Map({
            conditions: Map({
              crawlSessionId: results[1].first()
                .get('id'),
            }),
          }));
        })
        .then((results) => {
          const highLevelProductCategories = results.first()
            .getIn(['resultSet', 'highLevelProductCategories']);

          self.logInfo(finalConfig, () => 'Updating new Store Crawler config for Countdown');

          const newConfig = currentConfig.setIn(['config', 'productCategories'], highLevelProductCategories);

          self.logVerbose(finalConfig, () => `New Store Crawler config for Countdown: ${JSON.stringify(newConfig)}`);

          return StoreCrawlerConfigurationService.create(newConfig);
        });
    };

    return config ? updateStoreCralwerProductCategoriesConfigurationInternal(config) : CountdownService.getConfig()
      .then(updateStoreCralwerProductCategoriesConfigurationInternal);
  }

  syncToMasterProductList = (config) => {
    const self = this;
    const syncToMasterProductListInternal = (finalConfig) => {
      self.logInfo(finalConfig, () => 'Fetching the most recent Countdown crawling result for Countdown Products...');

      return CrawlSessionService.search(Map({
        conditions: Map({
          sessionKey: 'Countdown Products',
        }),
        topMost: true,
      }))
        .then((crawlSessionInfos) => {
          const sessionInfo = crawlSessionInfos.first();
          const sessionId = sessionInfo.get('id');
          let products = List();

          self.logInfo(finalConfig, () =>
            `Fetched the most recent Countdown crawling result for Countdown Products. Session Id: ${sessionId}`);

          const result = CrawlResultService.searchAll(Map({
            conditions: Map({
              crawlSessionId: sessionId,
            }),
          }));

          result.event.subscribe((info) => {
            const resultSet = info.get('resultSet');

            self.logVerbose(finalConfig, () => `Received result sets for Session Id: ${sessionId}`);

            products = products.concat(resultSet.get('products')
              .filterNot(_ => _.get('description')
                .trim()
                .length === 0));
          });

          return result.promise.then(() => {
            // TODO: 20170506 - Morteza - Need to unsubscribe following event when promise is rejected...
            result.event.unsubscribeAll();

            return new Promise((resolve, reject) => {
              const productsWithoutDuplication = products.groupBy(_ => _.get('description'))
                .map(_ => _.first())
                .valueSeq();

              self.logVerbose(finalConfig, () => 'Checking whether products already exist...');

              Promise.all(productsWithoutDuplication.map(product => MasterProductService.exists(Map({
                conditions: product,
              })))
                  .toArray())
                .then((results) => {
                  self.logVerbose(finalConfig, () => 'Finished checking whether products already exist.');

                  const indexes = Range(0, productsWithoutDuplication.size);
                  const productsWithIndexes = productsWithoutDuplication.zipWith((product, index) => Map({
                    product,
                    index,
                  }), indexes);

                  const newProducts = productsWithIndexes.filterNot(_ => results[_.get('index')])
                    .map(_ => _.get('product'));

                  if (newProducts.isEmpty()) {
                    resolve();
                  } else {
                    self.logInfo(finalConfig, () => 'Saving new products...');

                    const newProductInfo = newProducts.map(_ =>
                      Map({
                        description: _.get('description'),
                        barcode: _.get('barcode'),
                        imageUrl: _.get('imageUrl'),
                      }));

                    Promise.all(newProductInfo.map(MasterProductService.create)
                        .toArray())
                      .then(() => resolve())
                      .catch(error => reject(error));
                  }
                });
            });
          });
        });
    };

    return config ? syncToMasterProductListInternal(config) : CountdownService.getConfig()
      .then(syncToMasterProductListInternal);
  }

  syncToMasterProductPriceList = (config) => {
    const self = this;
    const syncToMasterProductPriceListInternal = (finalConfig, stores) => {
      self.logInfo(finalConfig, () => 'Fetching the most recent Countdown crawling result for Countdown Products Price...');

      return CrawlSessionService.search(Map({
        conditions: Map({
          sessionKey: 'Countdown Products',
        }),
        topMost: true,
      }))
        .then((crawlSessionInfos) => {
          const sessionInfo = crawlSessionInfos.first();
          const sessionId = sessionInfo.get('id');
          let products = List();

          self.logInfo(finalConfig, () =>
            `Fetched the most recent Countdown crawling result for Countdown Products Price. Session Id: ${sessionId}`);

          const result = CrawlResultService.searchAll(Map({
            conditions: Map({
              crawlSessionId: sessionId,
            }),
          }));

          result.event.subscribe((info) => {
            const resultSet = info.get('resultSet');

            self.logVerbose(finalConfig, () => `Received result sets for Session Id: ${sessionId}`);

            products = products.concat(resultSet.get('products')
              .filterNot(_ => _.get('description')
                .trim()
                .length === 0));
          });

          return result.promise.then(() => {
            result.event.unsubscribeAll();

            const productsWithoutDuplication = products.groupBy(_ => _.get('description'))
              .map(_ => _.first())
              .valueSeq();

            self.logVerbose(finalConfig, () => 'Finding the product in master product...');

            const capturedDate = new Date();

            return Promise.all(productsWithoutDuplication.map(product => new Promise((resolve, reject) => {
              MasterProductService.search(Map({
                conditions: product,
              }))
                  .then((results) => {
                    if (results.isEmpty()) {
                      reject(`No master product found for: ${JSON.stringify(product.toJS())}`);
                      resolve();

                      return;
                    } else if (results.size > 1) {
                      reject(`Multiple master products found for: ${JSON.stringify(product.toJS())}`);

                      return;
                    }

                    const masterProduct = results.first();
                    const masterProductPriceInfo = Map({
                      masterProductId: masterProduct.get('id'),
                      storeId: stores.find(_ => _.get('name')
                          .localeCompare('Countdown') === 0)
                        .get('id'),
                      capturedDate,
                      priceDetails: Map({
                        specialType: CountdownService.getSpecialType(product),
                        price: CountdownService.convertPriceStringToDecimal(CountdownService.getPrice(product)),
                        wasPrice: CountdownService.convertPriceStringToDecimal(CountdownService.getWasPrice(product)),
                        multiBuyInfo: CountdownService.getMultiBuyInfo(product),
                      }),
                    });

                    MasterProductPriceService.create(masterProductPriceInfo)
                      .then(() => resolve())
                      .catch(error => reject(error));
                  })
                  .catch(error => reject(error));
            }))
              .toArray());
          });
        });
    };

    if (config) {
      return CountdownService.getCountdownStore()
        .then(store => syncToMasterProductPriceListInternal(config, List.of(store)));
    }

    return Promise.all([CountdownService.getConfig(), CountdownService.getCountdownStore()])
      .then(results => syncToMasterProductPriceListInternal(results[0], List.of(results[1])));
  }

  syncToTagList = (config) => {
    const self = this;
    const syncToTagListInternal = (finalConfig, existingTags) => {
      self.logInfo(finalConfig, () => 'Fetching the most recent Countdown crawling result for Countdown Products Price...');

      return CrawlSessionService.search(Map({
        conditions: Map({
          sessionKey: 'Countdown Products',
        }),
        topMost: true,
      }))
        .then((crawlSessionInfos) => {
          const sessionInfo = crawlSessionInfos.first();
          const sessionId = sessionInfo.get('id');
          let tags = Set();

          self.logInfo(finalConfig, () =>
            `Fetched the most recent Countdown crawling result for Countdown Products Price. Session Id: ${sessionId}`);

          const result = CrawlResultService.searchAll(Map({
            conditions: Map({
              crawlSessionId: sessionId,
            }),
          }));

          result.event.subscribe((info) => {
            const resultSet = info.get('resultSet');

            self.logVerbose(finalConfig, () => `Received result sets for Session Id: ${sessionId}`);

            tags = tags.add(resultSet.get('productCategory'));
          });

          return result.promise.then(() => {
            result.event.unsubscribeAll();

            const newTags = tags.filterNot(tag => existingTags.find(_ => _.get('name')
              .toLowerCase()
              .trim()
              .localeCompare(tag.toLowerCase()
                .trim()) === 0));

            return Promise.all(newTags.map(tag => TagService.create(Map({
              name: tag,
              weight: 1,
            })))
              .toArray());
          });
        });
    };

    if (config) {
      return CountdownService.getExistingTags()
        .then(existingTags => syncToTagListInternal(config, existingTags));
    }

    return Promise.all([CountdownService.getConfig(), CountdownService.getExistingTags()])
      .then(results => syncToTagListInternal(results[0], results[1]));
  }

  syncMasterProductTags = (config) => {
    const self = this;
    const syncMasterProductTagsInternal = (finalConfig, existingTags) => {
      self.logInfo(finalConfig, () => 'Fetching the most recent Countdown crawling result for Countdown Products Price...');

      return CrawlSessionService.search(Map({
        conditions: Map({
          sessionKey: 'Countdown Products',
        }),
        topMost: true,
      }))
        .then((crawlSessionInfos) => {
          const sessionInfo = crawlSessionInfos.first();
          const sessionId = sessionInfo.get('id');
          let products = List();

          self.logInfo(finalConfig, () =>
            `Fetched the most recent Countdown crawling result for Countdown Products Price. Session Id: ${sessionId}`);

          const result = CrawlResultService.searchAll(Map({
            conditions: Map({
              crawlSessionId: sessionId,
            }),
          }));

          result.event.subscribe((info) => {
            const resultSet = info.get('resultSet');

            self.logVerbose(finalConfig, () => `Received result sets for Session Id: ${sessionId}`);

            products = products.concat(resultSet.get('products')
              .filterNot(_ => _.get('description')
                .trim()
                .length === 0)
              .map(_ => _.set('productCategory', resultSet.get('productCategory'))));
          });

          return result.promise.then(() => {
            result.event.unsubscribeAll();

            const productsGroupedByDescription = products.groupBy(_ => _.get('description'));

            self.logVerbose(finalConfig, () => 'Finding the product in master product...');

            return Promise.all(productsGroupedByDescription.keySeq()
              .map(key => new Promise((resolve, reject) => {
                const product = productsGroupedByDescription.get(key)
                  .first();

                MasterProductService.search(Map({
                  conditions: product,
                }))
                  .then((results) => {
                    if (results.isEmpty()) {
                      reject(`No master product found for: ${JSON.stringify(product.toJS())}`);
                      resolve();

                      return;
                    } else if (results.size > 1) {
                      reject(`Multiple master products found for: ${JSON.stringify(product.toJS())}`);

                      return;
                    }

                    const existingProduct = results.first();

                    const tags = productsGroupedByDescription.get(key)
                      .map(_ => _.get('productCategory'))
                      .toSet();
                    const notFoundTags = tags.filterNot(tag => existingTags.find(existingTag => existingTag.get('name')
                      .toLowerCase()
                      .trim()
                      .localeCompare(tag.toLowerCase()
                        .trim()) === 0));

                    if (!notFoundTags.isEmpty()) {
                      reject(`Multiple master products found for: ${JSON.stringify(notFoundTags.toJS())}`);

                      return;
                    }

                    const tagIds = tags.map(tag => existingTags.find(existingTag => existingTag.get('name')
                        .toLowerCase()
                        .trim()
                        .localeCompare(tag.toLowerCase()
                          .trim()) === 0)
                      .get('id'));

                    const newTagIds = tagIds.filterNot(tagId => existingProduct.get('tagIds')
                      .find(id => id === tagId));

                    if (newTagIds.isEmpty()) {
                      resolve();

                      return;
                    }

                    MasterProductService.update(existingProduct.update('tagIds', (currentTags) => {
                      if (currentTags) {
                        return currentTags.concat(newTagIds);
                      }

                      return newTagIds;
                    }))
                      .then(() => resolve())
                      .catch(error => reject(error));
                  })
                  .catch(error => reject(error));
              }))
              .toArray());
          });
        });
    };

    if (config) {
      return CountdownService.getExistingTags()
        .then(existingTags => syncMasterProductTagsInternal(config, existingTags));
    }

    return Promise.all([CountdownService.getConfig(), CountdownService.getExistingTags()])
      .then(results => syncMasterProductTagsInternal(results[0], results[1]));
  }

  logVerbose = (config, messageFunc) => {
    if (this.logVerboseFunc && config && config.get('logLevel') && config.get('logLevel') >= 3 && messageFunc) {
      this.logVerboseFunc(messageFunc());
    }
  }

  logInfo = (config, messageFunc) => {
    if (this.logInfoFunc && config && config.get('logLevel') && config.get('logLevel') >= 2 && messageFunc) {
      this.logInfoFunc(messageFunc());
    }
  }

  logError = (config, messageFunc) => {
    if (this.logErrorFunc && config && config.get('logLevel') && config.get('logLevel') >= 1 && messageFunc) {
      this.logErrorFunc(messageFunc());
    }
  }
}
