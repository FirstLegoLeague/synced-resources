const Promise = require('bluebird')
const { MongoClient } = require('mongodb')

const { NotFound } = require('../../resources/errors/not_found')

const MONGO_URI = process.env.MONGO_URI

class MongoResourceAdapter {
  constructor (Model, options = {}) {
    this._Model = Model
  }

  create (attrs) {
    const entry = this.newEntry(attrs)
    return this._connect()
      .then(collection => {
        return this.all()
          .then(allEntries => entry.validate({ collection: allEntries }))
          .then(() => collection.insertOne(entry.toJson()))
          .then(({ insertedId }) => {
            entry._id = insertedId
            return entry
          })
      })
  }

  all () {
    return this._connect()
      .then(collection => collection.find({}).toArray())
      .then(data => data.map(datum => this.newEntry(datum)))
  }

  count () {
    return this._connect()
      .then(collection => collection.count({ }))
  }

  get (id) {
    return this._connect()
      .then(collection => collection.findOne({ _id: id }))
      .then(data => {
        if (!data) {
          throw new NotFound()
        }
        return this.newEntry(data)
      })
  }

  search (query) {
    return this._connect()
      .then(collection => collection.find(query).toArray().map(data => this.newEntry(data)))
  }

  update (id, attrs) {
    return this._connect()
      .then(collection => {
        return Promise.resolve(collection.findOne({ _id: id }))
          .then(data => {
            if (!data) {
              throw new NotFound()
            }
            const entry = this.newEntry(data)
            Object.assign(entry, attrs)
            return this.all()
              .then(allEntries => entry.validate({ collection: allEntries }))
              .then(() => collection.updateOne({ _id: id }, { $set: entry }))
              .then(() => entry)
          })
      })
  }

  deleteAll () {
    return this._connect()
      .then(collection => collection.deleteMany({}))
  }

  delete (id) {
    return this._connect()
      .then(collection => collection.deleteOne({ _id: id }))
  }

  _connect () {
    if (!this._connectionPromise) {
      this._connectionPromise = MongoClient
        .connect(MONGO_URI, { promiseLibrary: Promise, useNewUrlParser: true, useUnifiedTopology: true })
        .then(client => client.db().collection(this._Model.name))
    }
    return this._connectionPromise
  }

  newEntry (attrs) {
    return new this._Model(attrs)
  }
}

exports.MongoResourceAdapter = MongoResourceAdapter
