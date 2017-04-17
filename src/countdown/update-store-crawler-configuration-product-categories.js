import Common from 'smart-grocery-parse-server-common';

const jobName = 'Update Store Crawler Countdown Configuration - Product Categories';

Parse.Cloud.job(jobName, (request, status) => { // eslint-disable-line no-undef
  const log = request.log;

  log.info(`The job ${jobName} has started.`);
  status.message('The job has started.');

  let currentConfig;

  Promise.all([Common.CrawlService.getStoreCrawlerConfig('Countdown'),
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
    })
    .then(() => {
      log.info(`The job ${jobName} completed successfully.`);
      status.success('Job completed successfully.');
    })
    .catch((error) => {
      log.error(`The job ${jobName} ended in error. Error: ${error}`);
      status.error('Job completed in error.');
    });
});
