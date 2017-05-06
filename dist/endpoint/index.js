'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = setupEndPoint;

var _expressGraphql = require('express-graphql');

var _expressGraphql2 = _interopRequireDefault(_expressGraphql);

var _graphql = require('./graphql');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function setupEndPoint(expressInstance) {
  var schema = (0, _graphql.getRootSchema)();

  expressInstance.use('/graphql', (0, _expressGraphql2.default)({
    schema: schema,
    graphiql: true
  }));
}