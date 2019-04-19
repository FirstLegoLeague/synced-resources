'use strict'
/* global describe it before */

const chai = require('chai')
const chaiString = require('chai-string')
const proxyquire = require('proxyquire')

chai.use(chaiString)
const expect = chai.expect

// mocks
const Model = {}
const InvalidEntry = {}

const MongoCollectionServer = {}
const MongoEntityServer = {}

const DevelopmentCollectionClient = {}
const DevelopmentEntityClient = {}
const RegularCollectionClient = {}
const RegularEntityClient = {}

const mocks = {
  './lib/resources/model': { Model },
  './lib/resources/errors/invalid_entry': { InvalidEntry },

  './lib/server/mongo/collection_server': { MongoCollectionServer },
  './lib/server/mongo/entity_server': { MongoEntityServer },

  './lib/client/development/entity_client': { EntityClient: DevelopmentEntityClient },
  './lib/client/development/collection_client': { CollectionClient: DevelopmentCollectionClient },
  './lib/client/entity_client': { EntityClient: RegularEntityClient },
  './lib/client/collection_client': { CollectionClient: RegularCollectionClient }
}

describe('index', () => {
  describe('in development', () => {
    process.env.NODE_ENV = 'development'
    const index = proxyquire('../', mocks)

    it('exposes all correct shared modules', () => {
      expect(index.Model).to.eq(Model)
      expect(index.InvalidEntry).to.eq(InvalidEntry)
    })

    it('exposes all correct server modules', () => {
      expect(index.MongoEntityServer).to.eq(MongoEntityServer)
      expect(index.MongoCollectionServer).to.eq(MongoCollectionServer)
    })

    it('exposes all correct client modules', () => {
      expect(index.EntityClient).to.eq(DevelopmentEntityClient)
      expect(index.CollectionClient).to.eq(DevelopmentCollectionClient)
    })
  })

  describe('in production', () => {
    process.env.NODE_ENV = 'production'
    const index = proxyquire('../', mocks)

    it('exposes all correct shared modules', () => {
      expect(index.Model).to.eq(Model)
      expect(index.InvalidEntry).to.eq(InvalidEntry)
    })

    it('exposes all correct server modules', () => {
      expect(index.MongoEntityServer).to.eq(MongoEntityServer)
      expect(index.MongoCollectionServer).to.eq(MongoCollectionServer)
    })

    it('exposes all correct client modules', () => {
      expect(index.EntityClient).to.eq(RegularEntityClient)
      expect(index.CollectionClient).to.eq(RegularCollectionClient)
    })
  })
})
