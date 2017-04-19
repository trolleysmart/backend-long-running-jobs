import Common from 'smart-grocery-parse-server-common';

class CountdownService {
  static updateStoreCralwerProductCategoriesConfiguration() {
    let currentConfig;

    return Promise.all([Common.CrawlService.getStoreCrawlerConfig('Countdown'),
      Common.CrawlService.getMostRecentCrawlSessionInfo('Countdown High Level Product Categories'),
    ])
      .then((results) => {
        currentConfig = results[0];

        return Common.CrawlService.getResultSets(results[1].get('id'));
      })
      .then((resultSets) => {
        const newConfig = currentConfig.set('productCategories', resultSets.first()
            .get('highLevelProductCategories'))
          .toJS();

        return Common.CrawlService.setStoreCrawlerConfig('Countdown', newConfig);
      });
  }
}

export default CountdownService;
