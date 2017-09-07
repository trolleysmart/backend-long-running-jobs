// @flow

import { CountdownWebCrawlerService } from 'trolley-smart-store-crawler';

const jobName = 'Countdown';

Parse.Cloud.job(jobName, async (request, status) => {
  // eslint-disable-line no-undef
  const log = request.log;

  log.info(`The job ${jobName} has started.`);
  status.message(`The job ${jobName} has started.`);

  const webCrawlerService = new CountdownWebCrawlerService({
    logVerboseFunc: message => log.info(message),
    logInfoFunc: message => log.info(message),
    logErrorFunc: message => log.error(message),
    sessionToken: global.parseServerSessionToken,
  });

  try {
    await webCrawlerService.crawlAndSyncProductCategoriesToStoreTags();
    await webCrawlerService.syncTags();
    await webCrawlerService.updateStoreTags();
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
