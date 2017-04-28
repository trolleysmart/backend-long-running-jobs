'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupEndPoint = undefined;

var _expressGraphql = require('express-graphql');

var _expressGraphql2 = _interopRequireDefault(_expressGraphql);

var _rootSchema = require('./graphql/root-schema');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function setupEndPoint(expressInstance) {
  expressInstance.use('/graphql', (0, _expressGraphql2.default)({
    schema: (0, _rootSchema.getRootSchema)(),
    graphiql: true
  }));
}

exports.setupEndPoint = setupEndPoint;
exports.default = {
  setupEndPoint: setupEndPoint
};