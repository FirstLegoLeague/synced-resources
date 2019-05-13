'use strict'
/* global describe it beforeEach */

const express = require('express')
const chai = require('chai')
const chaiString = require('chai-string')
const request = require('supertest')
const proxyquire = require('proxyquire')

chai.use(chaiString)
const expect = chai.expect

const { ModelMock } = require('../../../mocks/model.mock')
const { MessengerMock, messenger } = require('../../../mocks/ms-messenger.mock')
const { LoggerMock } = require('../../../mocks/ms-logger.mock')
const { MongoMock, MongoClient } = require('../../../mocks/mongo.mock')

// mocks
MessengerMock['@global'] = true
LoggerMock['@global'] = true
MongoMock['@global'] = true
MongoClient.collection.data = [{
  _id: 'a21212121212121212121212',
  field1: '916381'
}, {
  _id: 'a53535353535353535353535',
  field1: '5138'
}, {
  _id: 'a56483151681357985135165',
  field1: 'a31f51'
}, {
  _id: 'a98431513813202213505468',
  field1: '1a3e5df'
}]

const mocks = {
  '@first-lego-league/ms-messenger': MessengerMock,
  '@first-lego-league/ms-logger': LoggerMock,
  'mongodb': MongoMock
}

const { MongoCollectionServer } = proxyquire('../../../../lib/server/mongo/collection_server', mocks)

describe('mongo collection server', () => {
  describe('with no options', () => {
    const app = express()
    const server = new MongoCollectionServer(ModelMock)
    app.use(server)

    beforeEach(() => {
      server._connectionPromise = undefined
      MongoClient.errorsEnabled = false
    })

    describe('get all', () => {
      it('responds with all the items in the collection as taken from the mongo client with the correct name, mapped using the model toJson', done => {
        request(app)
          .get('/')
          .expect(200, (error, response) => {
            if (error) {
              throw error
            }

            expect(response.body).to.have.deep.members(MongoClient.collection.data)
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

    describe('delete all', () => {
      it('calls deleteMany in the DB', done => {
        request(app)
          .delete('/')
          .expect(204, (error, response) => {
            if (error) {
              throw error
            }

            expect(MongoClient.collection.deleteMany).to.have.been.called.with({})
            done()
          })
      })

      it('sends update message if the operation was sucessful', done => {
        request(app)
          .delete('/')
          .expect(204, (error, response) => {
            if (error) {
              throw error
            }

            expect(messenger.send).to.have.been.called.with('ModelMock:reload', { action: 'clear' })
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

    describe('get search', () => {
      const query = { field1: 'value1', field2: '2' }
      const queryURLString = Object.entries(query).map(([field, value]) => `${field}=${value}`).join('&')

      it('responds with matching items from find method as taken from the mongo client with the correct name, mapped using the model toJson', done => {
        request(app)
          .get(`/search?${queryURLString}`)
          .expect(200, (error, response) => {
            if (error) {
              throw error
            }

            expect(MongoClient.collection.find).to.have.been.called.with(query)
            expect(response.body).to.have.deep.members(MongoClient.collection.data)
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

    describe('get count', () => {
      it('responds with all the items in the collection as taken from the mongo client with the correct name, mapped using the model toJson', done => {
        request(app)
          .get('/count')
          .expect(200, (error, response) => {
            if (error) {
              throw error
            }

            expect(response.body.count).to.equal(MongoClient.collection.data.length)
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

    describe('create', () => {
      describe('a valid entry', () => {
        const entry = new ModelMock({ field1: 'field1', field2: '2' })
        const entryJson = entry.toJson()

        it('saves the entry sanitized version into the DB', done => {
          request(app)
            .post('/')
            .send(entryJson)
            .expect(200, (error, response) => {
              if (error) {
                throw error
              }

              expect(MongoClient.collection.insertOne).to.have.been.called.with(entry.sanitize())
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

              expect(messenger.send).to.have.been.called.with('ModelMock:reload', { action: 'create', entry: entryJson })
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
        const entry = new ModelMock({ field1: 'field1', field2: '2', invalid: true })
        const entryJson = entry.toJson()

        it('responds with 422', done => {
          request(app)
            .post('/')
            .send(entryJson)
            .expect(422, done)
        })
      })
    })

    describe('get', () => {
      const existingId = 'a98431513813202213505468'
      const nonExistingId = 'a98431513813202213594383'

      it('responds with the requested model using its toJson, if it exists', done => {
        request(app)
          .get(`/${existingId}`)
          .expect(200, (error, response) => {
            if (error) {
              throw error
            }

            expect(response.body._id).to.equal(existingId)
            done()
          })
      })

      it('responds with 404 if the entry does not exists', done => {
        request(app)
          .get(`/${nonExistingId}`)
          .expect(404, done)
      })

      it('responds with 500 in case of an unexpected mongo error', done => {
        MongoClient.errorsEnabled = true
        request(app)
          .get(`/${existingId}`)
          .expect(500, done)
      })
    })

    describe('update', () => {
      describe('a valid entry', () => {
        const entry = new ModelMock(Object.assign({ anotherField: 'x' }, MongoClient.collection.data[0]))
        const entryJson = entry.toJson()

        it('saves the entry sanitized version into the DB', done => {
          request(app)
            .put(`/${entry._id}`)
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
            .put(`/${entry._id}`)
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
            .put(`/${entry._id}`)
            .send(entryJson)
            .expect(500, done)
        })
      })

      describe('an invalid entry', () => {
        const entry = new ModelMock(Object.assign({ invalid: true }, MongoClient.collection.data[0]))
        const entryJson = entry.toJson()

        it('responds with 422', done => {
          request(app)
            .put(`/${entry._id}`)
            .send(entryJson)
            .expect(422, done)
        })
      })

      describe('a non existing entry', () => {
        const nonExistingId = 'a98431513813202213594383'

        it('responds with 404', done => {
          request(app)
            .put(`/${nonExistingId}`)
            .send({ })
            .expect(404, done)
        })
      })
    })

    describe('delete', () => {
      const existingId = 'a98431513813202213505468'
      const nonExistingId = 'a98431513813202213594383'

      it('deletes the entry from the DB if it exists', done => {
        request(app)
          .delete(`/${existingId}`)
          .expect(204, (error, response) => {
            if (error) {
              throw error
            }

            expect(MongoClient.collection.deleteOne).to.have.been.called()
            done()
          })
      })

      it('responds with 404 if the entry does not exists', done => {
        request(app)
          .delete(`/${nonExistingId}`)
          .expect(404, done)
      })

      it('responds with 500 in case of an unexpected mongo error', done => {
        MongoClient.errorsEnabled = true
        request(app)
          .delete(`/${existingId}`)
          .expect(500, done)
      })
    })
  })
})
