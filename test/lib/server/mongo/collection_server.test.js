'use strict'
/* global describe it before */

const express = require('express')
const chai = require('chai')
const chaiString = require('chai-string')
const request = require('supertest')
const proxyquire = require('proxyquire')

chai.use(chaiString)
const expect = chai.expect

const { ModelMock } = require('../../../mocks/model.mock')
const { MessengerMock } = require('../../../mocks/ms-messenger.mock')
const { LoggerMock } = require('../../../mocks/ms-logger.mock')
const { MongoMock, MongoClient } = require('../../../mocks/mongo.mock')

// mocks
MessengerMock['@global'] = true
LoggerMock['@global'] = true
MongoMock['@global'] = true
MongoClient.collection.data = [{
  _id: 12,
  field1: '916381'
}, {
  _id: 35,
  field1: '5138'
}, {
  _id: 7,
  field1: 'a31f51'
}, {
  _id: 85,
  field1: '1a3e5df'
}]

const mocks = {
  '@first-lego-league/ms-messenger': MessengerMock,
  '@first-lego-league/ms-logger': LoggerMock,
  'mongodb': MongoMock
}

const { MongoCollectionServer } = proxyquire('../../../../lib/server/mongo/collection_server', mocks)

const app = express()

describe('mongo collection server', () => {
  before(() => {
    const server = new MongoCollectionServer(ModelMock)
    app.use(server)
  })

  describe('get all', () => {
    it('responds with all the items in the collection as taken from the mongo client with the correct name, mapped using the model toJson', () => {
      request(app)
        .get('/')
        .expect(200, (error, response) => {
          if (error) {
            throw error
          }

          expect(response.body).to.have.deep.members(MongoClient.collection.data)
        })
    })

    it('responds with 422 in case of an unexpected error', () => {
    })

    it('responds with 500 in case of an unexpected mongo error', () => {
    })
  })
})
