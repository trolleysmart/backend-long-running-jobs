// @flow

import { Exception } from 'micro-business-parse-server-common';
import { WarehouseWebCrawlerService } from 'trolley-smart-store-crawler';

const jobName = 'Warehouse - Crawl Product Categories';

Parse.Cloud.job(jobName, async (request, status) => {
  // eslint-disable-line no-undef
  const log = request.log;

  log.info(`The job ${jobName} has started.`);
  status.message(`The job ${jobName} has started.`);

  const service = new WarehouseWebCrawlerService({
    logVerboseFunc: message => log.info(message),
    logInfoFunc: message => log.info(message),
    logErrorFunc: message => log.error(message),
  });

  try {
    await service.crawlProductCategories(null, global.parseServerSessionToken);

    log.info(`The job ${jobName} completed successfully.`);
    status.success(`The job ${jobName} completed successfully.`);
  } catch (ex) {
    const errorMessage = ex instanceof Exception ? ex.getErrorMessage() : ex;

    log.error(`The job ${jobName} ended in error. Error: ${errorMessage}`);
    status.error(`The job ${jobName} ended in error. Error: ${errorMessage}`);
  }
});
