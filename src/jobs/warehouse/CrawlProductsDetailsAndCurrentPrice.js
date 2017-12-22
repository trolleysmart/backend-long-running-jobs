// @flow

import { Warehouse, TargetCrawledDataStoreType } from '@trolleysmart/store-crawler';

const jobName = 'Warehouse - Crawl products details and current price';

Parse.Cloud.job(jobName, async (request, status) => {
  const { log } = request;

  log.info(`The job ${jobName} has started.`);
  status.message(`The job ${jobName} has started.`);

  const webCrawlerService = new Warehouse({
    logVerboseFunc: message => log.info(message),
    logInfoFunc: message => log.info(message),
    logErrorFunc: message => log.error(message),
    sessionToken: global.parseServerSessionToken,
    targetCrawledDataStoreType: TargetCrawledDataStoreType.CRAWLED_SPECIFIC_DESIGNED_TABLES,
  });

  try {
    await webCrawlerService.crawlProductsDetailsAndCurrentPrice();

    log.info(`The job ${jobName} completed successfully.`);
    status.success(`The job ${jobName} completed successfully.`);
  } catch (ex) {
    const errorMessage = ex instanceof Error ? ex.message : ex;

    log.error(`The job ${jobName} ended in error. Error: ${errorMessage}`);
    status.error(`The job ${jobName} ended in error. Error: ${errorMessage}`);
  }
});
