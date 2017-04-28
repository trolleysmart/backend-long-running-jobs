'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _microBusinessParseServerBackend = require('micro-business-parse-server-backend');

var _microBusinessParseServerBackend2 = _interopRequireDefault(_microBusinessParseServerBackend);

var _endpoint = require('./endpoint');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _backend = (0, _microBusinessParseServerBackend2.default)({
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
  parseServerCloudFilePath: _path2.default.resolve(__dirname, 'cloud.js')
}),
    server = _backend.server,
    serverHost = _backend.serverHost,
    serverPort = _backend.serverPort,
    parseServerUrl = _backend.parseServerUrl,
    parseServerApplicationId = _backend.parseServerApplicationId,
    parseServerMasterKey = _backend.parseServerMasterKey,
    parseServerClientKey = _backend.parseServerClientKey,
    parseServerJavascriptKey = _backend.parseServerJavascriptKey,
    parseServerFileKey = _backend.parseServerFileKey,
    parseServerDatabaseUri = _backend.parseServerDatabaseUri,
    parseServerDashboardApplicationName = _backend.parseServerDashboardApplicationName;

(0, _endpoint.setupEndPoint)(server);

process.on('SIGINT', function () {
  return process.exit();
});

server.listen(serverPort, function () {
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