const express = require('express')
const chai = require('chai')
const chaiSpies = require('chai-spies')
const chaiString = require('chai-string')
const request = require('supertest')
const proxyquire = require('proxyquire')

chai.use(chaiString)
chai.use(chaiSpies)
const expect = chai.expect

const { ModelMock } = require('../../../mocks/model.mock')
const { MessengerMock, messenger } = require('../../../mocks/ms-messenger.mock')
const { LoggerMock } = require('../../../mocks/ms-logger.mock')
const { MongoMock, MongoClient } = require('../../../mocks/mongo.mock')

// mocks
const mocks = {
  '@first-lego-league/ms-messenger': MessengerMock,
  '@first-lego-league/ms-logger': LoggerMock,
  'mongodb': MongoMock
}

const { MongoEntityServer } = proxyquire('../../../../lib/server/mongo/entity_server', mocks)

describe('mongo entity server', () => {
  describe('with no options', () => {
    const app = express()
    const server = new MongoEntityServer(ModelMock)
    app.use(server)

    beforeEach(() => {
      server._adapter._connectionPromise = undefined
      MongoClient.errorsEnabled = false
      MongoClient.collection.data = [{
        _id: 'entity-id',
        field1: '1a3e5df'
      }]
    })

    describe('get', () => {
      it('responds with the entity, using the model toJson', done => {
        request(app)
          .get('/')
          .expect(200, (error, response) => {
            if (error) {
              throw error
            }

            expect(response.body).to.eql(MongoClient.collection.data[0])
            done()
          })
      })

      it('responds with 500 in case of an unexpected mongo error', done => {
        MongoClient.errorsEnabled = true
        request(app)
          .get('/')
          .expect(500, done)
      })
    })

    describe('get field', () => {
      it('responds with the matching field, if such one exists', done => {
        request(app)
          .get('/field1')
          .expect(200, (error, response) => {
            if (error) {
              throw error
            }

            expect(response.body).to.equal(MongoClient.collection.data[0].field1)
            done()
          })
      })

      it('responds with 404 if such field does not exists', done => {
        request(app)
          .get('/field2')
          .expect(404, done)
      })

      it('responds with 500 in case of an unexpected mongo error', done => {
        MongoClient.errorsEnabled = true
        request(app)
          .get('/')
          .expect(500, done)
      })
    })

    describe('set', () => {
      describe('a valid entry', () => {
        const entry = new ModelMock(Object.assign({ anotherField: 'x' }, MongoClient.collection.data[0]))
        const entryJson = entry.toJson()

        it('saves the entry sanitized version into the DB', done => {
          request(app)
            .post('/')
            .send(entryJson)
            .expect(200, (error, response) => {
              if (error) {
                throw error
              }

              expect(MongoClient.collection.updateOne).to.have.been.called()
              done()
            })
        })

        it('sends update message if the operation was sucessful', done => {
          request(app)
            .post('/')
            .send(entryJson)
            .expect(200, (error, response) => {
              if (error) {
                throw error
              }

              expect(messenger.send).to.have.been.called.with('ModelMock:reload', { action: 'update', entry: entryJson })
              done()
            })
        })

        it('responds with 500 in case of an unexpected mongo error', done => {
          MongoClient.errorsEnabled = true
          request(app)
            .post('/')
            .send(entryJson)
            .expect(500, done)
        })
      })

      describe('an invalid entry', () => {
        const entry = new ModelMock(Object.assign({ invalid: true }, MongoClient.collection.data[0]))
        const entryJson = entry.toJson()

        it('responds with 422', done => {
          request(app)
            .post('/')
            .send(entryJson)
            .expect(422, done)
        })
      })
    })
  })

  describe('with options', () => {
    const app = express()
    const options = {
      exclude: ['getField'],
      before: {
        get: chai.spy((req, res, next) => next())
      },
      override: {
        set: chai.spy((req, res, next) => res.sendStatus(200))
      }
    }
    const server = new MongoEntityServer(ModelMock, options)
    app.use(server)

    beforeEach(() => {
      server._adapter._connectionPromise = undefined
      MongoClient.errorsEnabled = false
    })

    it('excludes all routes in options.exclude', done => {
      request(app)
        .get('/field1')
        .expect(404, done)
    })

    it('calls before function of routes in options.before', done => {
      request(app)
        .get('/')
        .expect(200, () => {
          expect(options.before.get).to.have.been.called()
          done()
        })
    })

    it('calls override function of routes in options.override, and does not call the original', done => {
      MongoClient.load()
      request(app)
        .post('/')
        .expect(200, () => {
          expect(options.override.set).to.have.been.called()
          expect(MongoClient.collection.updateOne).not.to.have.been.called()
          done()
        })
    })
  })

  describe('with extendable', () => {
    const app = express()
    const options = {
      extendable: true
    }
    const server = new MongoEntityServer(ModelMock, options)
    app.use(server)

    beforeEach(() => {
      server._adapter._connectionPromise = undefined
      MongoClient.errorsEnabled = false
    })

    it('has no routes if close has not been called', done => {
      request(app)
        .get('/')
        .expect(404, done)
    })

    it('has routes if close has been called', done => {
      server.close()
      request(app)
        .get('/')
        .expect(200, done)
    })
  })

  it('saves the connection promise', done => {
    const app = express()
    const server = new MongoEntityServer(ModelMock)
    app.use(server)

    MongoClient.load()

    request(app)
      .get('/')
      .expect(200, () => {
        request(app)
          .get('/')
          .expect(200, () => {
            expect(MongoClient.connect).to.have.been.called.exactly(1)
            done()
          })
      })
  })
})
