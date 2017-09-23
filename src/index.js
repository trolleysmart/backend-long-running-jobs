// @flow

import path from 'path';
import backend from 'micro-business-parse-server-backend';
import { CountdownWebCrawlerService, WarehouseWebCrawlerService } from 'trolley-smart-store-crawler';
import { ParseWrapperService } from 'micro-business-parse-server-common';

let countdownStoreTags;
let warehouseStoreTags;

const crawlCountdownProductsDetailsAndCurrentPrice = async (sessionToken) => {
  const service = new CountdownWebCrawlerService({
    logVerboseFunc: message => console.log(message),
    logInfoFunc: message => console.log(message),
    logErrorFunc: message => console.log(message),
    sessionToken,
  });

  if (countdownStoreTags) {
    countdownStoreTags = await service.getStoreTags();
  }

  service
    .crawlProductsDetailsAndCurrentPrice(countdownStoreTags)
    .then(() => crawlCountdownProductsDetailsAndCurrentPrice(sessionToken))
    .catch(() => crawlCountdownProductsDetailsAndCurrentPrice(sessionToken));
};

const crawlWarehouseProductsDetailsAndCurrentPrice = async (sessionToken) => {
  const service = new WarehouseWebCrawlerService({
    logVerboseFunc: message => console.log(message),
    logInfoFunc: message => console.log(message),
    logErrorFunc: message => console.log(message),
    sessionToken,
  });

  if (warehouseStoreTags) {
    warehouseStoreTags = await service.getStoreTags();
  }

  service
    .crawlProductsDetailsAndCurrentPrice(warehouseStoreTags)
    .then(() => crawlWarehouseProductsDetailsAndCurrentPrice(sessionToken))
    .catch(() => crawlWarehouseProductsDetailsAndCurrentPrice(sessionToken));
};

const crawlPriceDetails = async (crawlerUsername, crawlerPassword) => {
  const user = await ParseWrapperService.logIn(crawlerUsername, crawlerPassword);
  global.parseServerSessionToken = user.getSessionToken();

  crawlCountdownProductsDetailsAndCurrentPrice(global.parseServerSessionToken);
  crawlWarehouseProductsDetailsAndCurrentPrice(global.parseServerSessionToken);
};

const backendInfo = backend({
  serverHost: process.env.HOST,
  serverPort: process.env.PORT,
  parseServerApplicationId: process.env.PARSE_SERVER_APPLICATION_ID,
  parseServerMasterKey: process.env.PARSE_SERVER_MASTER_KEY,
  parseServerClientKey: process.env.PARSE_SERVER_CLIENT_KEY,
  parseServerJavascriptKey: process.env.PARSE_SERVER_JAVASCRIPT_KEY,
  parseServerFileKey: process.env.PARSE_SERVER_FILE_KEY,
  parseServerDatabaseUri: process.env.PARSE_SERVER_DATABASE_URI,
  startParseDashboard: process.env.START_PARSE_DASHBOARD,
  parseDashboardAuthentication: process.env.PARSE_DASHBOARD_AUTHENTICATION,
  parseServerDashboardApplicationName: process.env.PARSE_SERVER_DASHBOARD_APPLICATION_NAME,
  parseServerCloudFilePath: path.resolve(__dirname, 'cloud.js'),
  parseServerAllowClientClassCreation: process.env.PARSE_SERVER_ALLOW_CLIENT_CLASS_CREATION,
});

process.on('SIGINT', () =>
  ParseWrapperService.logOut()
    .then(() => process.exit())
    .catch(() => process.exit()),
);

backendInfo.get('server').listen(backendInfo.get('serverPort'), () => {
  console.log('TrolleySmart backend (jobs) started.');
  console.log(JSON.stringify(backendInfo.toJS(), null, 2));

  crawlPriceDetails(process.env.CRAWLER_USERNAME, process.env.CRAWLER_PASSWORD);
});
