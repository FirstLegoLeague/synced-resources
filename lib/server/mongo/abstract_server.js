'use strict'

const Router = require('router')
const Promise = require('bluebird')
const bodyParser = require('body-parser')
const { MongoClient } = require('mongodb')
const { Logger } = require('@first-lego-league/ms-logger')
const { Messenger } = require('@first-lego-league/ms-messenger')

const MONGO_URI = process.env.MONGO_URI

/**
 * This server class is an abstract class for mongo routers.
 *
 * It offers two methods for the routes of the server:
 * _addRoute (name, method, path, callback)
 * adds a route to the router, but also allows it to except in the options hash of the constructor
 * the route by `name` in the options.exclude array, the options.before hash and the options.override hash.
 *
 * _connect()
 * returns a promise resloving to the collection of the mongoD, using the model's name.
 *
 * But probably the most important thing this class does is to automatlically add routes when calling the `close` method.
 * This method is called in the constructor unless options.extendable is true.
 * It calls all of the methods of the server matching the pattern /_add.+Route/
 *
 * Therefore it will call all of the methods in the router that define a new route, while closing it.
 */

class AbstractMongoServer extends Router {
  constructor (model, options = {}) {
    super()
    this._model = model
    this._options = options
    this._logger = new Logger()
    this._messenger = new Messenger({
      clientId: this._model.name,
      logger: this._logger,
      node: 'protected',
      credentials: {
        username: 'protected-client',
        password: process.env.PROTECTED_MHUB_PASSWORD
      }
    })

    this.use(bodyParser.json())
    this.use(bodyParser.urlencoded({ extended: true }))

    if (!this._options.extendable) {
      this.close()
    }
  }

  close () {
    // Getting the names of the methods
    Object.getOwnPropertyNames(this.constructor.prototype)
      .filter(methodName => methodName.match(/_add.+Route/))
      .forEach(methodName => this[methodName]())

    return this
  }

  _addRoute (name, method, path, callback) {
    if (this.options.exclude && this.options.exclude.includes(name)) {
      return
    }

    if (this.options.before && this.options.before[name]) {
      this[method](path, this.options.before[name])
    }

    if (this.options.override && this.options.override[name]) {
      this[method](path, this.options.override[name])
      return
    }

    this[method](path, callback)
  }

  _connect () {
    if (!this._connectionPromise) {
      this._connectionPromise = MongoClient
        .connect(MONGO_URI, { promiseLibrary: Promise, useNewUrlParser: true })
        .then(client => client.db().collection(this._model.name))
    }
    return this._connectionPromise
  }
}

exports.AbstractMongoServer = AbstractMongoServer
