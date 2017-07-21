// @flow

import { Exception } from 'micro-business-parse-server-common';
import { CountdownWebCrawlerService } from 'store-crawler';

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
  });

  try {
    await webCrawlerService.crawlProductCategories(null, global.parseServerSessionToken);
    await webCrawlerService.syncProductCategoriesToStoreTags(global.parseServerSessionToken);
    await webCrawlerService.crawlProducts(null, global.parseServerSessionToken);
    await webCrawlerService.crawlProductsDetails(null, global.parseServerSessionToken);

    log.info(`The job ${jobName} completed successfully.`);
    status.success(`The job ${jobName} completed successfully.`);
  } catch (ex) {
    const errorMessage = ex instanceof Exception ? ex.getErrorMessage() : ex;

    log.error(`The job ${jobName} ended in error. Error: ${errorMessage}`);
    status.error(`The job ${jobName} ended in error. Error: ${errorMessage}`);
  }
});
