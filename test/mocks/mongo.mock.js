'use strict'

const Promise = require('bluebird')
const chai = require('chai')
const spies = require('chai-spies')

chai.use(spies)

const MongoClient = {
  connect: () => {
    if (MongoClient.errorsEnabled) {
      return Promise.reject(new Error('Some error'))
    } else {
      return Promise.resolve(MongoClient.connection)
    }
  }
}

const clientSandbox = chai.spy.sandbox()
clientSandbox.on(MongoClient, Object.keys(MongoClient))

MongoClient.connection = {
  db: () => MongoClient.db
}

MongoClient.db = {
  collection: () => Promise.resolve(MongoClient.collection)
}

const dbSendbox = chai.spy.sandbox()
dbSendbox.on(MongoClient.db, Object.keys(MongoClient.db))

MongoClient.collection = {
  find: () => Promise.resolve(MongoClient.collection.data),
  findOne: ({ _id }) => Promise.resolve(MongoClient.collection.data.find(datum => datum._id === _id.toString())),
  count: () => Promise.resolve(MongoClient.collection.data.length),
  insertOne: () => Promise.resolve({ insertedId: 123 }),
  updateOne: () => Promise.resolve(),
  deleteOne: ({ _id }) => Promise.resolve({ deletedCount: MongoClient.collection.data.filter(datum => datum._id === _id.toString()).length }),
  deleteMany: () => Promise.resolve()
}

const collectionSendbox = chai.spy.sandbox()
collectionSendbox.on(MongoClient.collection, Object.keys(MongoClient.collection))

exports.MongoClient = MongoClient

exports.MongoMock = { MongoClient }
