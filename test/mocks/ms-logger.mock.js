'use strict'

const chai = require('chai')
const spies = require('chai-spies')

chai.use(spies)

const logger = {
  debug: () => { },
  info: () => { },
  warn: () => { },
  error: () => { },
  fatal: () => { }
}

const loggerSandbox = chai.spy.sandbox()
loggerSandbox.on(logger, Object.keys(logger))

exports.logger = logger

exports.LoggerMock = {
  Logger: function Logger () {
    return logger
  }
}
