import Immutable, {
  List,
  Map,
} from 'immutable';
import {
  ParseWrapperService,
} from 'micro-business-parse-server-common';
import {
  CrawlResultService,
  CrawlSessionService,
  StoreCrawlerConfigurationService,
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

          const newConfig = currentConfig.set(['config', 'productCategories'], highLevelProductCategories);

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

      CrawlSessionService.search(Map({
        sessionKey: 'Countdown Products',
        latest: true,
      }))
        .then((crawlSessionInfos) => {
          const sessionInfo = crawlSessionInfos.first();
          const sessionId = sessionInfo.get('id');
          let promises = new List();

          self.logInfo(finalConfig, () =>
            `Fetched the most recent Countdown crawling result for Countdown Products. Session Id: ${sessionId}`);

          const result = CrawlResultService.searchAll(Map({
            crawlSessionId: sessionId,
          }));

          result.event.subscribe((info) => {
            const resultSet = info.get('resultSet');
            self.logVerbose(finalConfig, () => `Received result sets for Session Id: ${sessionId}`);

            const products = resultSet.get('products')
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
