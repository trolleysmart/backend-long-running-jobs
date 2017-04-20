import Immutable, {
  List,
} from 'immutable';
import {
  ParseWrapperService,
} from 'micro-business-parse-server-common';
import {
  CrawlService,
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

          return CrawlService.getResultSets(results[1].get('id'));
        })
        .then((resultSets) => {
          self.logInfo(finalConfig, () => 'Updating new Store Crawler config for Countdown');

          const newConfig = currentConfig.set('productCategories', resultSets.first()
              .get('highLevelProductCategories'))
            .toJS();

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
        .then(sessionInfo => new Promise((resolve, reject) => {
          const sessionId = sessionInfo.get('id');
          const promises = new List();

          self.logInfo(finalConfig, () =>
            `Fetched the most recent Countdown crawling result for Countdown Products. Session Id: ${sessionId}`);

          const result = CrawlService.getResultSets(sessionId);

          result.eventEmitter.on('newResultSets', (resultSets) => {
            self.logInfo(finalConfig, () => `Received result sets for Session Id: ${sessionId}`);
          });

          return result.promise.then(() => Promise.all(promises.toArray())
              .then(() => resolve())
              .catch(error => reject(error)))
            .catch(error => reject(error));
        }));
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
