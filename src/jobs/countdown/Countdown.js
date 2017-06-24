// @flow

import { Exception } from 'micro-business-parse-server-common';
import { CountdownWebCrawlerService } from 'store-crawler';
import CountdownService from './CountdownService';

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

  const service = new CountdownService({
    logVerboseFunc: message => log.info(message),
    logInfoFunc: message => log.info(message),
    logErrorFunc: message => log.error(message),
  });

  try {
    await webCrawlerService.crawlHighLevelProductCategories();
    await service.updateStoreCralwerProductCategoriesConfiguration();
    await webCrawlerService.crawlProducts();
    await service.syncToTagList();
    await service.syncToMasterProductList();
    await service.syncMasterProductTags();
    await service.syncToMasterProductPriceList();

    log.info(`The job ${jobName} completed successfully.`);
    status.success(`The job ${jobName} completed successfully.`);
  } catch (ex) {
    const errorMessage = ex instanceof Exception ? ex.getErrorMessage() : ex;

    log.error(`The job ${jobName} ended in error. Error: ${errorMessage}`);
    status.error(`The job ${jobName} ended in error. Error: ${errorMessage}`);
  }
});