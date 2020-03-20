const Promise = require('bluebird')
const { MongoClient, ObjectId } = require('mongodb')
const { createMessenger } = require('@first-lego-league/ms-messenger')

const { NotFound } = require('../../resources/errors/not_found')

const MONGO_URI = process.env.MONGO_URI

class MongoResourceAdapter {
  constructor (Model, options = {}) {
    this._Model = Model
    this._options = options
    this._messenger = createMessenger({
      clientId: this._Model.name,
      node: 'protected',
      credentials: {
        username: 'protected-client',
        password: process.env.PROTECTED_MHUB_PASSWORD
      }
    })
  }

  create (attrs) {
    const entry = this.newEntry(attrs)
    if (!entry._id) {
      entry._id = String(new ObjectId())
    }
    return this._connect()
      .then(collection => {
        return this.all()
          .then(allEntries => entry.validate({ collection: allEntries }))
          .then(() => collection.insertOne(entry.toJson()))
          .then(({ insertedId }) => {
            entry._id = insertedId
            return entry
          })
          .then(newEntry => this.sendingJson(entry)
            .then(json => {
              this._messenger.send(`${this._Model.name}:reload`, { action: 'create', entry: json })
              return newEntry
            })
          )
      })
  }

  all () {
    return this._connect()
      .then(collection => collection.find({}).toArray())
      .then(data => Promise.all(data.map(datum => Promise.resolve(this.newEntry(datum)))))
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

  search (query, options = { }) {
    return this._connect()
      .then(collection => {
        let finder = collection.find(query)

        if (options.sort) {
          finder = finder.sort(options.sort)
        }
        if (options.limit) {
          finder = finder.limit(options.limit)
        }
        if (options.skip) {
          finder = finder.skip(options.skip)
        }

        return Promise.all(finder.toArray().map(datum => Promise.resolve(this.newEntry(datum))))
      })
  }

  update (id, attrs) {
    return this._connect()
      .then(collection => {
        return Promise.resolve(collection.findOne({ _id: id }))
          .then(data => {
            if (!data) {
              throw new NotFound()
            }
            return this.newEntry(data)
          }).then(entry => {
            Object.assign(entry, attrs)
            return this.all()
              .then(allEntries => entry.validate({ collection: allEntries }))
              .then(() => collection.updateOne({ _id: id }, { $set: entry }))
              .then(() => this.sendingJson(entry))
              .then(json => this._messenger.send(`${this._Model.name}:reload`, { action: 'update', entry: json }))
              .then(() => entry)
          })
      })
  }

  deleteAll () {
    return this._connect()
      .then(collection => collection.deleteMany({}))
      .then(() => this._messenger.send(`${this._Model.name}:reload`, { action: 'clear' }))
  }

  delete (id) {
    return this._connect()
      .then(collection => collection.deleteOne({ _id: id }))
      .then(({ deletedCount }) => {
        if (deletedCount === 0) {
          throw new NotFound()
        } else {
          this._messenger.send(`${this._Model.name}:reload`, { action: 'delete', id })
        }
      })
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

  sendingJson (entry) {
    let promise = Promise.resolve(entry)
    if (this._options.beforeSend) {
      promise = promise.then(e => this._options.beforeSend(e))
    }
    return promise.then(e => e.toJson())
  }
}

exports.MongoResourceAdapter = MongoResourceAdapter
