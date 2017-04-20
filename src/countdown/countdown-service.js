import {
  CrawlService,
} from 'smart-grocery-parse-server-common';

class CountdownService {
  static updateStoreCralwerProductCategoriesConfiguration() {
    let currentConfig;

    return Promise.all([CrawlService.getStoreCrawlerConfig('Countdown'),
      CrawlService.getMostRecentCrawlSessionInfo('Countdown High Level Product Categories'),
    ])
      .then((results) => {
        currentConfig = results[0];

        return CrawlService.getResultSets(results[1].get('id'));
      })
      .then((resultSets) => {
        const newConfig = currentConfig.set('productCategories', resultSets.first()
            .get('highLevelProductCategories'))
          .toJS();

        return CrawlService.setStoreCrawlerConfig('Countdown', newConfig);
      });
  }
}

export default CountdownService;
