import Immutable, {
  List,
  Map,
} from 'immutable';
import {
  ParseWrapperService,
} from 'micro-business-parse-server-common';
import {
  CrawlService,
  MasterProductService,
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

      return Promise.all([CrawlService.getStoreCrawlerConfig('Countdown'),
        CrawlService.getMostRecentCrawlSessionInfo('Countdown High Level Product Categories'),
      ])
        .then((results) => {
          self.logInfo(finalConfig, () =>
            'Fetched both store crawler configuration and the most recent Countdown crawling result for Countdown High Level Product Categories.',
          ); // eslint-disable-line max-len

          currentConfig = results[0];

          self.logVerbose(finalConfig, () => `Current Store Crawler config for Countdown: ${currentConfig}`);

          return new Promise((resolve, reject) => {
            let highLevelProductCategories;
            const result = CrawlService.getResultSets(results[1].get('id'));

            result.eventEmitter.on('newResultSets', (resultSets) => {
              highLevelProductCategories = resultSets.get('highLevelProductCategories');
            });

            result.promise.then(() => resolve(highLevelProductCategories))
              .catch(error => reject(error));
          });
        })
        .then((highLevelProductCategories) => {
          self.logInfo(finalConfig, () => 'Updating new Store Crawler config for Countdown');

          const newConfig = currentConfig.set('productCategories', highLevelProductCategories.toJS());

          self.logVerbose(finalConfig, () => `New Store Crawler config for Countdown: ${JSON.stringify(newConfig)}`);

          return CrawlService.setStoreCrawlerConfig('Countdown', newConfig);
        });
    };

    return config ? updateStoreCralwerProductCategoriesConfigurationInternal(config) : CountdownService.getConfig()
      .then(updateStoreCralwerProductCategoriesConfigurationInternal);
  }

  syncToMasterProductList(config) {
    const self = this;
    const syncToMasterProductListInternal = (finalConfig) => {
      self.logInfo(finalConfig, () => 'Fetching the most recent Countdown crawling result for Countdown Products...');

      CrawlService.getMostRecentCrawlSessionInfo('Countdown Products')
        .then((sessionInfo) => {
          const sessionId = sessionInfo.get('id');
          let promises = new List();

          self.logInfo(finalConfig, () =>
            `Fetched the most recent Countdown crawling result for Countdown Products. Session Id: ${sessionId}`);

          const result = CrawlService.getResultSets(sessionId);

          result.eventEmitter.on('newResultSets', (resultSets) => {
            self.logVerbose(finalConfig, () => `Received result sets for Session Id: ${sessionId}`);

            const products = resultSets.get('products')
              .filterNot(_ => _.get('description')
                .trim()
                .length === 0);

            if (products.isEmpty()) {
              self.logVerbose(finalConfig, () => 'No new product to save.');

              return;
            }

            self.logVerbose(finalConfig, () => 'Checking whether products already exist...');

            const promise =
              Promise.all(products.map(product => MasterProductService.exists(product))
                .toArray())
              .then((results) => {
                self.logVerbose(finalConfig, () => 'Finished checking whether products already exist.');

                const indexes = Immutable.fromJS([...Array(products.size)
                  .keys(),
                ]);

                const productsWithIndexes = products.zipWith((product, index) => Map({
                  product,
                  index,
                }), indexes);

                const newProducts = productsWithIndexes.filterNot(_ => results[_.get('index')])
                  .map(_ => _.get('product'));

                if (!newProducts.isEmpty()) {
                  self.logInfo(finalConfig, () => 'Saving new products...');
                }

                return Promise.all(newProducts.map(newProduct => MasterProductService.create(newProduct))
                  .toArray());
              });

            promises = promises.push(promise);
          });

          return result.promise.then(() => Promise.all(promises.toArray()));
        });
    };

    return config ? syncToMasterProductListInternal(config) : CountdownService.getConfig()
      .then(syncToMasterProductListInternal);
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
