'use strict'
/* global describe it before */

const chai = require('chai')
const chaiString = require('chai-string')
const proxyquire = require('proxyquire')

chai.use(chaiString)
const expect = chai.expect

const { LoggerMock, logger } = require('./mocks/ms-logger.mock.js')
const { ClientMock, client } = require('./mocks/ms-client.mock.js')
const { MessengerMock, messenger, triggerListener } = require('./mocks/ms-messenger.mock.js')

const Resource = proxyquire('../', {
  '@first-lego-league/ms-logger': LoggerMock,
  '@first-lego-league/ms-client': ClientMock,
  '@first-lego-league/ms-messenger': MessengerMock
}).Resource

describe('Resource', () => {
  describe('in devvelopment NODE_ENV', () => {
  	before(() => {
      process.env.NODE_ENV = 'development'
    })

  	it('returns developmentValue', done => {
  		const developmentValue = 'developmentValue'
  		new Resource({ developmentValue }).get()
  			.then(value => {
          expect(value).to.equal(developmentValue)
          done()
        })
  	})
  })

  describe('in production NODE_ENV', () => {
  	before(() => {
      process.env.NODE_ENV = 'prod'
    })

    describe('init', () => {
      const url = 'url'
      const topic = 'topic'
      const name = 'name'

      it('does not save initPromise upon failure', done => {
        const resource = new Resource({ url, topic, name })
        resource.reload = chai.spy(() => { throw new Error('error') })
        resource.init().then(() => {
          expect(true).to.be(false)
        }).catch(() => {
          expect(resource._initPromise).to.equal(null)
          done()
        })
      })

      it('throws the error upon failure', done => {
        const error = new Error('error')
        const resource = new Resource({ url, topic, name })
        resource.reload = chai.spy(() => { throw error })
        resource.init().then(() => {
          expect(true).to.be(false)
        }).catch(err => {
          expect(err).to.equal(error)
          done()
        })
      })

      it('calls messenger.listen with the topic', done => {
        const resource = new Resource({ url, topic, name })
        resource.init().then(() => {
          expect(messenger.listen).to.have.been.called()
          done()
        })
      })

      it('calls this.reload', done => {
        const resource = new Resource({ url, topic, name })
        resource.reload = chai.spy()
        resource.init().then(() => {
          expect(resource.reload).to.have.been.called()
          done()
        })
      })

      it('sets this.value to be that value returned from this.reload', done => {
        const value = 'value'
        const resource = new Resource({ url, topic, name })
        resource.reload = chai.spy(() => value)
        resource.init().then(() => {
          expect(resource.value).to.equal(value)
          done()
        })
      })
    })

    describe('on message', () => {
      const url = 'url'
      const topic = 'topic'
      const name = 'name'

      it('sets the value from this.reload if dataInMessage is falsly', done => {
        const value = 'value'
        const value2 = 'other value'
        const resource = new Resource({ url, topic, name, dataInMessage: false })
        resource.reload = chai.spy(() => Promise.resolve(value))
        resource.init()
          .then(() => triggerListener({ value: value2 }))
          .then(() => {
            expect(resource.value).to.equal(value)
            done()
          })
      })

      it('sets the value from data if dataInMessage is true', done => {
        const value = 'value'
        const value2 = 'other value'
        const resource = new Resource({ url, topic, name, dataInMessage: true })
        resource.reload = chai.spy(() => Promise.resolve(value))
        resource.init()
          .then(() => triggerListener({ value: value2 }))
          .then(() => {
            expect(resource.value).to.equal(value2)
            done()
          })
      })

      it('calls this.onUpdate', done => {
        const value = 'value'
        const value2 = 'other value'
        const onUpdate = chai.spy(() => { })
        const resource = new Resource({ url, topic, name, onUpdate })
        resource.init()
          .then(() => triggerListener({ value: value2 }))
          .then(() => {
            expect(onUpdate).to.have.been.called()
            done()
          })
      })
    })

    describe('reload', () => {
      const url = 'url'
      const topic = 'topic'
      const name = 'name'

      it('calls logger.info with correct message', done => {
        const resource = new Resource({ url, topic, name })
        resource.reload().then(() => {
          expect(logger.info).to.have.been.called.with(`Reloading ${name}`)
          done()
        })
      })

      it('calls client.get with the given url', done => {
        const resource = new Resource({ url, topic, name })
        resource.reload().then(() => {
          expect(client.get).to.have.been.called.with(url)
          done()
        })
      })

      it('returns the data from the response', done => {
        const resource = new Resource({ url, topic, name })
        resource.reload().then(value => {
          expect(value).to.equal(client.data)
          done()
        })
      })
    })

    describe('get', () => {
      const url = 'url'
      const topic = 'topic'
      const name = 'name'

      it('calls this.init', done => {
        const resource = new Resource({ url, topic, name })
        resource.init = chai.spy(() => Promise.resolve())
        resource.get().then(() => {
          expect(resource.init).to.have.been.called()
          done()
        })
      })

      it('returns this.value', done => {
        const resource = new Resource({ url, topic, name })
        resource.get().then(value => {
          expect(value).to.equal(client.data)
          done()
        })
      })
    })
  })
})
