const Promise = require('bluebird')
const chai = require('chai')
const spies = require('chai-spies')

chai.use(spies)

const MongoClient = {
}

MongoClient.load = () => {
  MongoClient.connect = () => {
    if (MongoClient.errorsEnabled) {
      return Promise.reject(new Error('Some error'))
    } else {
      return Promise.resolve(MongoClient.connection)
    }
  }

  const clientSandbox = chai.spy.sandbox()
  clientSandbox.on(MongoClient, ['connect'])

  MongoClient.connection = {
    db: () => MongoClient.db
  }

  MongoClient.db = {
    collection: () => Promise.resolve(MongoClient.collection)
  }

  const dbSendbox = chai.spy.sandbox()
  dbSendbox.on(MongoClient.db, Object.keys(MongoClient.db))

  // Save data if this is not the first load
  const previousCollectionData = MongoClient.collection ? MongoClient.collection.data : undefined

  MongoClient.collection = {
    find: () => ({ toArray: () => MongoClient.collection.data }),
    findOne: ({ _id }) => Promise.resolve(_id ? MongoClient.collection.data.find(datum => datum._id === _id.toString()) : MongoClient.collection.data[0]),
    count: () => Promise.resolve(MongoClient.collection.data.length),
    insertOne: () => Promise.resolve({ insertedId: 123 }),
    updateOne: () => Promise.resolve(),
    deleteOne: ({ _id }) => Promise.resolve({ deletedCount: MongoClient.collection.data.filter(datum => datum._id === _id.toString()).length }),
    deleteMany: () => Promise.resolve()
  }

  const collectionSendbox = chai.spy.sandbox()
  collectionSendbox.on(MongoClient.collection, Object.keys(MongoClient.collection))

  if (previousCollectionData) {
    MongoClient.collection.data = previousCollectionData
  }
}

MongoClient.load()

exports.MongoClient = MongoClient

exports.MongoMock = { MongoClient }
exports.MongoMock['@global'] = true
exports.MongoMock['@noCallThru'] = true
  