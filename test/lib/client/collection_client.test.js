/* global describe it beforeEach */

const Promise = require('bluebird')
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

const mocks = {
  '@first-lego-league/ms-messenger': MessengerMock,
  '@first-lego-league/ms-client': ClientMock
}

const { CollectionClient } = proxyquire('../../../lib/client/collection_client', mocks)

const RESOURCE_SERVER_URL = '/resource'

describe('CollectionClient', () => {
  let collectionClient

  beforeEach(() => {
    collectionClient = new CollectionClient(ModelMock, RESOURCE_SERVER_URL)
    collectionClient.emit = chai.spy(collectionClient.emit)
    client.data = ModelMock.developmentCollection()
  })

  describe('init', () => {
    it('listens using the messenger to `reload` messeges', () => {
      return collectionClient.init()
        .then(() => {
          expect(messenger.listen).to.have.been.called.with('ModelMock:reload')
        })
    })

    it('sends a HTTP request for the data', () => {
      return collectionClient.init()
        .then(() => {
          expect(client.get).to.have.been.called.with(RESOURCE_SERVER_URL)
        })
    })

    it('sets the data to be a model representation of the data returned by the HTTP client', () => {
      return collectionClient.init()
        .then(() => {
          collectionClient.data.forEach((datum, index) => {
            expect(datum.constructor.name).to.equal('ModelMock')
            expect(datum.toJson()).to.eql(client.data[index])
          })
        })
    })

    it('initialize the listeners if autoInit is set to true', () => {
      return Promise.resolve(new CollectionClient(ModelMock, RESOURCE_SERVER_URL, { autoInit: true }))
        .then(() => {
          expect(messenger.on).to.have.been.called()
        })
    })
  })

  describe('listener', () => {
    it('applies a clearing localy if requested', () => {
      return collectionClient.init()
        .then(() => {
          triggerListener({ action: 'clear' })

          expect(collectionClient.data.length).to.equal(0)
        })
    })

    it('applies a creation localy if requested', () => {
      return collectionClient.init()
        .then(() => {
          const entry = { _id: 123 }
          const lengthBefore = collectionClient.data.length

          triggerListener({ action: 'create', entry })

          expect(collectionClient.data.some(datum => datum._id === entry._id)).to.equal(true)
          expect(collectionClient.data.length).to.equal(lengthBefore + 1)
        })
    })

    it('applies an update localy if requested', () => {
      return collectionClient.init()
        .then(() => {
          const entry = collectionClient.data[1].toJson()
          const anotherValue = '18273'
          entry.anotherField = anotherValue
          const lengthBefore = collectionClient.data.length

          triggerListener({ action: 'update', entry })

          const updatedEntry = collectionClient.data.find(datum => datum._id === entry._id)
          expect(updatedEntry.anotherField).to.equal(anotherValue)
          expect(collectionClient.data.length).to.equal(lengthBefore)
        })
    })

    it('applies a deletion localy if requested', () => {
      return collectionClient.init()
        .then(() => {
          const id = collectionClient.data[1]._id
          const lengthBefore = collectionClient.data.length

          triggerListener({ action: 'delete', id })

          expect(collectionClient.data.some(datum => datum._id === id)).to.equal(false)
          expect(collectionClient.data.length).to.equal(lengthBefore - 1)
        })
    })

    it('emits reload event', () => {
      return collectionClient.init()
        .then(() => {
          triggerListener({ action: 'create' })
          expect(collectionClient.emit).to.have.been.called.with('reload')
        })
    })
  })

  describe('clear', () => {
    it('calls ignoreNextMessage', () => {
      return collectionClient.init()
        .then(() => collectionClient.clear())
        .then(() => {
          expect(messenger.ignoreNextMessage).to.have.been.called.with('ModelMock:reload')
        })
    })

    it('sends a DELETE HTTP request', () => {
      return collectionClient.init()
        .then(() => collectionClient.clear())
        .then(() => {
          expect(client.delete).to.have.been.called.with(RESOURCE_SERVER_URL)
        })
    })

    it('applies localy', () => {
      return collectionClient.init()
        .then(() => collectionClient.clear())
        .then(() => {
          expect(collectionClient.data.length).to.equal(0)
        })
    })
  })

  describe('create', () => {
    it('calls ignoreNextMessage', () => {
      return collectionClient.init()
        .then(() => collectionClient.clear())
        .then(() => {
          expect(messenger.ignoreNextMessage).to.have.been.called.with('ModelMock:reload')
        })
    })

    it('sends a POST HTTP request', () => {
      return collectionClient.init()
        .then(() => collectionClient.create({ _id: 5 }))
        .then(() => {
          expect(client.post).to.have.been.called.with(RESOURCE_SERVER_URL)
        })
    })

    it('applies localy', () => {
      const entry = { _id: 123 }
      let lengthBefore
      return collectionClient.init()
        .then(() => {
          lengthBefore = collectionClient.data.length
          client.data = entry
          collectionClient.create(entry)
        }).then(() => {
          expect(collectionClient.data.some(datum => datum._id === entry._id)).to.equal(true)
          expect(collectionClient.data.length).to.equal(lengthBefore + 1)
        })
    })
  })

  describe('update', () => {
    it('calls ignoreNextMessage', () => {
      return collectionClient.init()
        .then(() => {
          const entry = collectionClient.data[1].toJson()
          const anotherValue = '18273'
          entry.anotherField = anotherValue
          client.data = entry

          return collectionClient.update(entry)
        })
        .then(() => {
          expect(messenger.ignoreNextMessage).to.have.been.called.with('ModelMock:reload')
        })
    })

    it('sends a PUT HTTP request', () => {
      let entry
      return collectionClient.init()
        .then(() => {
          entry = collectionClient.data[1].toJson()
          const anotherValue = '18273'
          entry.anotherField = anotherValue
          client.data = entry

          return collectionClient.update(entry)
        }).then(() => {
          expect(client.put).to.have.been.called.with(`${RESOURCE_SERVER_URL}/${entry._id}`)
        })
    })

    it('applies localy', () => {
      let entry, lengthBefore
      const anotherValue = '18273'
      return collectionClient.init()
        .then(() => {
          entry = collectionClient.data[1].toJson()
          entry.anotherField = anotherValue
          lengthBefore = collectionClient.data.length
          client.data = entry

          return collectionClient.update(entry)
        }).then(() => {
          const updatedEntry = collectionClient.data.find(datum => datum._id === entry._id)
          expect(updatedEntry.anotherField).to.equal(anotherValue)
          expect(collectionClient.data.length).to.equal(lengthBefore)
        })
    })
  })

  describe('delete', () => {
    it('calls ignoreNextMessage', () => {
      return collectionClient.init()
        .then(() => {
          return collectionClient.delete(collectionClient.data[1])
        }).then(() => {
          expect(messenger.ignoreNextMessage).to.have.been.called.with('ModelMock:reload')
        })
    })

    it('sends a DELETE HTTP request', () => {
      let entry
      return collectionClient.init()
        .then(() => {
          entry = collectionClient.data[1]
          return collectionClient.delete(entry)
        }).then(() => {
          expect(client.delete).to.have.been.called.with(`${RESOURCE_SERVER_URL}/${entry._id}`)
        })
    })

    it('applies localy', () => {
      let entry, lengthBefore
      return collectionClient.init()
        .then(() => {
          entry = collectionClient.data[1]
          lengthBefore = collectionClient.data.length

          return collectionClient.delete(entry)
        }).then(() => {
          expect(collectionClient.data.some(datum => datum._id === entry._id)).to.equal(false)
          expect(collectionClient.data.length).to.equal(lengthBefore - 1)
        })
    })
  })
})
