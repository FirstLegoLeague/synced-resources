'use strict'
/* global describe it beforeEach */

const chai = require('chai')
const chaiSpies = require('chai-spies')
const chaiString = require('chai-string')
const proxyquire = require('proxyquire')

chai.use(chaiString)
chai.use(chaiSpies)
const expect = chai.expect

const { MessengerMock, messenger, triggerListener } = require('../../mocks/ms-messenger.mock')
const { ClientMock, client } = require('../../mocks/ms-client.mock')
const { ModelMock } = require('../../mocks/model.mock')

// mocks
MessengerMock['@global'] = true
ClientMock['@global'] = true

const mocks = {
  '@first-lego-league/ms-messenger': MessengerMock,
  '@first-lego-league/ms-client': ClientMock
}

const { EntityClient } = proxyquire('../../../lib/client/entity_client', mocks)

const RESOURCE_SERVER_URL = '/resource'

describe('EntityClient', () => {
  let entityClient

  beforeEach(() => {
    entityClient = new EntityClient(ModelMock, RESOURCE_SERVER_URL)
  })

  describe('init', () => {
    it('listens using the messenger to `reload` messeges', () => {
      return entityClient.init()
        .then(() => {
          expect(messenger.listen).to.have.been.called.with('ModelMock:reload')
        })
    })

    it('sends a HTTP request for the data', () => {
      return entityClient.init()
        .then(() => {
          expect(client.get).to.have.been.called.with(RESOURCE_SERVER_URL)
        })
    })

    it('sets the data to be a model representation of the data returned by the HTTP client', () => {
      return entityClient.init()
        .then(() => {
          expect(entityClient.data.constructor.name).to.equal('ModelMock')
          expect(entityClient.data.toJson()).to.eql(client.data)
        })
    })
  })

  describe('listener', () => {
    it('sets the data from the message data when one is recieved', () => {
      const _id = 5
      return entityClient.init()
        .then(() => {
          triggerListener({ _id })
          expect(entityClient.data._id).to.equal(_id)
        })
    })
  })

  describe('set', () => {
    const newData = { field1: '12' }

    it('calls ignoreNextMessage', () => {
      return entityClient.init()
        .then(() => entityClient.set(newData))
        .then(() => {
          expect(messenger.ignoreNextMessage).to.have.been.called.with('ModelMock:reload')
        })
    })

    it('sends a POST HTTP request to set the value', () => {
      return entityClient.init()
        .then(() => entityClient.set(newData))
        .then(() => {
          expect(client.post).to.have.been.called.with(RESOURCE_SERVER_URL, newData)
        })
    })

    it('sets the data to be a model representation of the data returned by the HTTP client', () => {
      client.data = newData
      return entityClient.init()
        .then(() => entityClient.set(newData))
        .then(() => {
          expect(entityClient.data).to.eql(client.data)
        })
    })
  })
})
