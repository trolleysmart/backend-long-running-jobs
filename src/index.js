import path from 'path';
import backend from 'micro-business-parse-server-backend';

const {
  server,
  serverHost,
  serverPort,
  parseServerUrl,
  parseServerApplicationId,
  parseServerMasterKey,
  parseServerClientKey,
  parseServerJavascriptKey,
  parseServerFileKey,
  parseServerDatabaseUri,
  parseServerDashboardApplicationName,
} = backend({
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

server.listen(serverPort, () => {
  console.log('Smart Grocery backend started.');
  console.log('Server host: ', serverHost);
  console.log('Listening port: ', serverPort);
  console.log('Parse Server url: ', parseServerUrl);
  console.log('Parse Server Application Id: ', parseServerApplicationId);
  console.log('Parse Server Master Key: ', parseServerMasterKey);
  console.log('Parse Server Client Key: ', parseServerClientKey);
  console.log('Parse Server Javascript Key: ', parseServerJavascriptKey);
  console.log('Parse Server File Key: ', parseServerFileKey);
  console.log('Parse Server Database Uri: ', parseServerDatabaseUri);
  console.log('Parse Server Dashboard Application Name: ', parseServerDashboardApplicationName);
});
