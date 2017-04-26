import Immutable, {
  List,
  Map,
  Range,
} from 'immutable';
import {
  ParseWrapperService,
} from 'micro-business-parse-server-common';
import {
  Maybe,
} from 'monet';
import {
  CrawlResultService,
  CrawlSessionService,
  StoreCrawlerConfigurationService,
  MasterProductService,
  MasterProductPriceService,
  StoreService,
} from 'smart-grocery-parse-server-common';

class CountdownService {
  static getConfig() {
    return new Promise((resolve, reject) => {
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
    });
  }

  static getCountdownStore() {
    return new Promise((resolve, reject) => {
      const criteria = Map({
        name: 'Countdown',
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
    });
  }

  static getSpecialType(product) {
    if (product.has('special') && product.get('special')) {
      return 'special';
    }

    if (product.has('onecard') && product.get('onecard')) {
      return 'onecard';
    }

    return 'none';
  }

  static getPrice(product) {
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
    }

    return price.substring(1, price.indexOf(' '));
  }

  static getWasPrice(product) {
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
    }

    return undefined;
  }

  static convertPriceStringToDecimal(price) {
    return price ? parseFloat(price) : undefined;
  }

  constructor({
    logVerboseFunc,
    logInfoFunc,
    logErrorFunc,
  }) {
    this.logVerboseFunc = logVerboseFunc;
    this.logInfoFunc = logInfoFunc;
    this.logErrorFunc = logErrorFunc;

    this.updateStoreCralwerProductCategoriesConfiguration = this.updateStoreCralwerProductCategoriesConfiguration.bind(this);
    this.syncToMasterProductList = this.syncToMasterProductList.bind(this);
    this.syncToMasterProductPriceList = this.syncToMasterProductPriceList.bind(this);
    this.logVerbose = this.logVerbose.bind(this);
    this.logInfo = this.logInfo.bind(this);
    this.logError = this.logError.bind(this);
  }

  updateStoreCralwerProductCategoriesConfiguration(config) {
    const self = this;
    const updateStoreCralwerProductCategoriesConfigurationInternal = (finalConfig) => {
      let currentConfig;

      self.logInfo(finalConfig, () =>
        'Fetching store crawler configuration and the most recent Countdown crawling result for Countdown High Level Product Categories...'); // eslint-disable-line max-len

      return Promise.all([StoreCrawlerConfigurationService.search(Map({
        key: 'Countdown',
        latest: true,
      })),
        CrawlSessionService.search(Map({
          sessionKey: 'Countdown High Level Product Categories',
          latest: true,
        })),
      ])
        .then((results) => {
          self.logInfo(finalConfig, () =>
            'Fetched both store crawler configuration and the most recent Countdown crawling result for Countdown High Level Product Categories.',
          ); // eslint-disable-line max-len

          currentConfig = results[0].first();

          self.logVerbose(finalConfig, () => `Current Store Crawler config for Countdown: ${currentConfig}`);

          return CrawlResultService.search(Map({
            crawlSessionId: results[1].first()
              .get('id'),
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

  syncToMasterProductList(config) {
    const self = this;
    const syncToMasterProductListInternal = (finalConfig) => {
      self.logInfo(finalConfig, () => 'Fetching the most recent Countdown crawling result for Countdown Products...');

      return CrawlSessionService.search(Map({
        sessionKey: 'Countdown Products',
        latest: true,
      }))
        .then((crawlSessionInfos) => {
          const sessionInfo = crawlSessionInfos.first();
          const sessionId = sessionInfo.get('id');
          let products = List();

          self.logInfo(finalConfig, () =>
            `Fetched the most recent Countdown crawling result for Countdown Products. Session Id: ${sessionId}`);

          const result = CrawlResultService.searchAll(Map({
            crawlSessionId: sessionId,
          }));

          result.event.subscribe((info) => {
            const resultSet = info.get('resultSet');

            self.logVerbose(finalConfig, () => `Received result sets for Session Id: ${sessionId}`);

            products = products.concat(resultSet.get('products')
              .filterNot(_ => _.get('description')
                .trim()
                .length === 0));
          });

          return result.promise.then(() => new Promise((resolve, reject) => {
            const productsWithoutDuplication = products.groupBy(_ => _.get('description'))
              .map(_ => _.first())
              .valueSeq();

            self.logVerbose(finalConfig, () => 'Checking whether products already exist...');

            Promise.all(productsWithoutDuplication.map(product => MasterProductService.exists(product))
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
                      barcode: Maybe.fromNull(_.get('barcode')),
                      imageUrl: Maybe.fromNull(_.get('imageUrl')),
                    }));

                  Promise.all(newProductInfo.map(MasterProductService.create)
                      .toArray())
                    .then(() => resolve())
                    .catch(error => reject(error));
                }
              });
          }));
        });
    };

    return config ? syncToMasterProductListInternal(config) : CountdownService.getConfig()
      .then(syncToMasterProductListInternal);
  }

  syncToMasterProductPriceList(config) {
    const self = this;
    const syncToMasterProductPriceListInternal = (finalConfig, stores) => {
      self.logInfo(finalConfig, () => 'Fetching the most recent Countdown crawling result for Countdown Products Price...');

      return CrawlSessionService.search(Map({
        sessionKey: 'Countdown Products',
        latest: true,
      }))
        .then((crawlSessionInfos) => {
          const sessionInfo = crawlSessionInfos.first();
          const sessionId = sessionInfo.get('id');
          let products = List();

          self.logInfo(finalConfig, () =>
            `Fetched the most recent Countdown crawling result for Countdown Products Price. Session Id: ${sessionId}`);

          const result = CrawlResultService.searchAll(Map({
            crawlSessionId: sessionId,
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
            const productsWithoutDuplication = products.groupBy(_ => _.get('description'))
              .map(_ => _.first())
              .valueSeq();

            self.logVerbose(finalConfig, () => 'Finding the product in master product...');
            const capturedDate = new Date();

            return Promise.all(productsWithoutDuplication.map(product => new Promise((resolve, reject) => {
              MasterProductService.search(product)
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

    return config ? syncToMasterProductPriceListInternal(config) : Promise.all([CountdownService.getConfig(), CountdownService.getCountdownStore()])
      .then(results => syncToMasterProductPriceListInternal(results[0], List.of(results[1])));
  }

  logVerbose(config, messageFunc) {
    if (this.logVerboseFunc && config && config.get('logLevel') && config.get('logLevel') >= 3 && messageFunc) {
      this.logVerboseFunc(messageFunc());
    }
  }

  logInfo(config, messageFunc) {
    if (this.logInfoFunc && config && config.get('logLevel') && config.get('logLevel') >= 2 && messageFunc) {
      this.logInfoFunc(messageFunc());
    }
  }

  logError(config, messageFunc) {
    if (this.logErrorFunc && config && config.get('logLevel') && config.get('logLevel') >= 1 && messageFunc) {
      this.logErrorFunc(messageFunc());
    }
  }
}

export {
  CountdownService,
};

export default CountdownService;
