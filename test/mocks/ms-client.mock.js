'use strict'

const Promise = require('bluebird')
const chai = require('chai')
const spies = require('chai-spies')

chai.use(spies)

const client = {
  get: () => Promise.resolve({ data: client.data }),
  post: () => Promise.resolve({ data: client.data }),
  put: () => Promise.resolve({ data: client.data }),
  patch: () => Promise.resolve({ data: client.data }),
  delete: () => Promise.resolve({ data: client.data })
}

const clientSandbox = chai.spy.sandbox()
clientSandbox.on(client, Object.keys(client))

client.data = 'data'

exports.client = client

exports.ClientMock = { client }
