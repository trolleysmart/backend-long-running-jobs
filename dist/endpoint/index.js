'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupEndPoint = undefined;

var _expressGraphql = require('express-graphql');

var _expressGraphql2 = _interopRequireDefault(_expressGraphql);

var _graphql = require('graphql');

var _utilities = require('graphql/utilities');

var _rootSchema = require('./graphql/root-schema');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function setupEndPoint(expressInstance) {
  var schema = (0, _rootSchema.getRootSchema)();

  expressInstance.use('/graphql', (0, _expressGraphql2.default)({
    schema: schema,
    graphiql: true
  }));

  expressInstance.get('/graphql-schema', function (request, response) {
    (0, _graphql.graphql)(schema, _utilities.introspectionQuery).then(function (json) {
      response.setHeader('Content-Type', 'application/json');
      response.send(JSON.stringify(json, null, 2));
    }).catch(function (error) {
      return response.status(500).send(error);
    });
  });
}

exports.setupEndPoint = setupEndPoint;
exports.default = {
  setupEndPoint: setupEndPoint
};