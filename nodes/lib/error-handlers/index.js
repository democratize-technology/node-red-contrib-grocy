/**
 * Error handlers module exports
 * Provides centralized access to all specialized error handlers
 */
const ErrorClassifier = require('./classifier');
const ErrorFormatter = require('./formatter');
const ErrorFactory = require('./factory');
const NetworkErrorHandler = require('./network-handler');
const HttpErrorHandler = require('./http-handler');
const AuthErrorHandler = require('./auth-handler');
const ValidationErrorHandler = require('./validation-handler');
const ConfigErrorHandler = require('./config-handler');
const TimeoutErrorHandler = require('./timeout-handler');
const RateLimitErrorHandler = require('./ratelimit-handler');
const ParsingErrorHandler = require('./parsing-handler');
const OperationErrorHandler = require('./operation-handler');

module.exports = {
  ErrorClassifier,
  ErrorFormatter,
  ErrorFactory,
  NetworkErrorHandler,
  HttpErrorHandler,
  AuthErrorHandler,
  ValidationErrorHandler,
  ConfigErrorHandler,
  TimeoutErrorHandler,
  RateLimitErrorHandler,
  ParsingErrorHandler,
  OperationErrorHandler
};