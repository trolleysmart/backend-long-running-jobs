// @flow

import path from 'path';
import backend from 'micro-business-parse-server-backend';
import { CountdownWebCrawlerService, WarehouseWebCrawlerService } from 'store-crawler';

const countdownWebCrawlerService = new CountdownWebCrawlerService({
  logVerboseFunc: message => console.log(message),
  logInfoFunc: message => console.log(message),
  logErrorFunc: message => console.log(message),
});

const wareshouseWebCrawlerService = new WarehouseWebCrawlerService({
  logVerboseFunc: message => console.log(message),
  logInfoFunc: message => console.log(message),
  logErrorFunc: message => console.log(message),
});

const crawlCountdownProductsPrices = async () => {
  countdownWebCrawlerService.crawlProductsPriceDetails().then(() => crawlCountdownProductsPrices()).catch(() => crawlCountdownProductsPrices());
};

const crawlWarehouseProductsPrices = async () => {
  wareshouseWebCrawlerService.crawlProductsPriceDetails().then(() => crawlWarehouseProductsPrices()).catch(() => crawlWarehouseProductsPrices());
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
});

process.on('SIGINT', () => process.exit());

backendInfo.get('server').listen(backendInfo.get('serverPort'), () => {
  console.log('Smart Grocery backend (jobs) started.');
  console.log(JSON.stringify(backendInfo.toJS(), null, 2));

  crawlCountdownProductsPrices();
  crawlWarehouseProductsPrices();
});
