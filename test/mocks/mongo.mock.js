'use strict'

const Promise = require('bluebird')
const chai = require('chai')
const spies = require('chai-spies')

chai.use(spies)

const MongoClient = {
  connect: () => Promise.resolve(MongoClient.connection)
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
  findOne: () => Promise.resolve(MongoClient.collection.data[0]),
  count: () => Promise.resolve(MongoClient.collection.data.length),
  insertOne: () => Promise.resolve(),
  updateOne: () => Promise.resolve(),
  deleteOne: () => Promise.resolve(),
  deleteMany: () => Promise.resolve()
}

const collectionSendbox = chai.spy.sandbox()
collectionSendbox.on(MongoClient.collection, Object.keys(MongoClient.collection))

exports.MongoClient = MongoClient

exports.MongoMock = { MongoClient }
