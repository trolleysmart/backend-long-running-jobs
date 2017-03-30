import backend from 'micro-business-parse-server-backend';

const {
  server,
  serverHost,
  serverPort,
  parseServerUrl,
  parseServerApplicationId,
  parseServerMasterKey,
  parseServerFileKey,
  parseServerDatabaseUri,
} = backend({
  serverHost: process.env.HOST,
  serverPort: process.env.PORT,
  parseServerApplicationId: process.env.PARSE_SERVER_APPLICATION_ID,
  parseServerMasterKey: process.env.PARSE_SERVER_MASTER_KEY,
  parseServerFileKey: process.env.PARSE_SERVER_FILE_KEY,
  parseServerDatabaseUri: process.env.PARSE_SERVER_DATABASE_URI,
  startParseDashboard: process.env.START_PARSE_DASHBOARD,
  parseDashboardAuthentication: process.env.PARSE_DASHBOARD_AUTHENTICATION,
});

server.listen(serverPort, () => {
  console.log('Smart Grocery backend started.');
  console.log('Server host: ', serverHost);
  console.log('Listening port: ', serverPort);
  console.log('Parse Server url: ', parseServerUrl);
  console.log('Parse Server Application Id: ', parseServerApplicationId);
  console.log('Parse Server Master Key: ', parseServerMasterKey);
  console.log('Parse Server File Key: ', parseServerFileKey);
  console.log('Parse Server Database Uri: ', parseServerDatabaseUri);
});
