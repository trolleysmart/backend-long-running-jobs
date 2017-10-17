// @flow

import { Health2000WebCrawlerService, TargetCrawledDataStoreType } from 'trolley-smart-store-crawler';

const jobName = 'Health2000';

Parse.Cloud.job(jobName, async (request, status) => {
  const { log } = request;

  log.info(`The job ${jobName} has started.`);
  status.message(`The job ${jobName} has started.`);

  const webCrawlerService = new Health2000WebCrawlerService({
    logVerboseFunc: message => log.info(message),
    logInfoFunc: message => log.info(message),
    logErrorFunc: message => log.error(message),
    sessionToken: global.parseServerSessionToken,
    targetCrawledDataStoreType: TargetCrawledDataStoreType.CRAWLED_SPECIFIC_DESIGNED_TABLES,
  });

  try {
    await webCrawlerService.crawlAndSyncProductCategoriesToStoreTags();
    await webCrawlerService.crawlProducts();
    await webCrawlerService.crawlProductsDetailsAndCurrentPrice();

    log.info(`The job ${jobName} completed successfully.`);
    status.success(`The job ${jobName} completed successfully.`);
  } catch (ex) {
    const errorMessage = ex instanceof Error ? ex.message : ex;

    log.error(`The job ${jobName} ended in error. Error: ${errorMessage}`);
    status.error(`The job ${jobName} ended in error. Error: ${errorMessage}`);
  }
});
